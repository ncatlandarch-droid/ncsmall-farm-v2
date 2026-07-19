// Netlify Function: GIS data proxy — routes parcel, contour, soils, zoning requests
// Adds CORS headers and caches responses for 5 minutes
// NOTE: uses process.env (universally available in Netlify functions) instead of
// Netlify.env.get() which requires an explicit @netlify/functions import.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300'
};

const MAX_BBOX_DEG = 0.20;

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  // Handle POST — translation endpoint
  if (request.method === 'POST') {
    const url = new URL(request.url);
    const layer = url.searchParams.get('layer');
    if (layer === 'gemini-translate') {
      return await handleTranslate(request);
    }
    return json({ error: 'Method not allowed' }, 405);
  }
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(request.url);
  const service = url.searchParams.get('service');
  const bbox = url.searchParams.get('bbox'); // W,S,E,N

  if (!service || !bbox) return json({ error: 'Missing service or bbox' }, 400);

  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return json({ error: 'Invalid bbox' }, 400);
  const [west, south, east, north] = parts;

  // Parcels/farms/soils have their own caps; skip bbox limit for them.
  if (service !== 'parcels' && service !== 'farms' && service !== 'soils' && ((east - west) > MAX_BBOX_DEG || (north - south) > MAX_BBOX_DEG)) {
    return json({ error: 'bbox_too_large', message: 'Zoom in to load GIS data' }, 400);
  }

  try {
    switch (service) {
      case 'parcels':  return await fetchParcels(west, south, east, north);
      case 'farms':    return await fetchFarms(west, south, east, north);
      case 'contours': return await fetchContours(west, south, east, north);
      case 'soils':      return await fetchSoils(west, south, east, north);
      case 'zoning':     return await fetchZoning(west, south, east, north);
      case 'hydrology':  return await fetchHydrology(west, south, east, north);
      case 'floodplain': return await fetchFloodplain(west, south, east, north);
      case 'wetlands':   return await fetchWetlands(west, south, east, north);
      case 'overlay':    return await fetchOverlayDistricts(west, south, east, north);
      case 'historic':   return await fetchHistoricDistricts(west, south, east, north);
      case 'futurelu':   return await fetchFutureLandUse(west, south, east, north);
      case 'buildings':  return await fetchBuildings(west, south, east, north);
      default:           return json({ error: `Unknown service: ${service}` }, 400);
    }
  } catch (err) {
    console.error('[gis-proxy] FATAL', service, err.message, err.stack?.split('\n')[1] || '');
    return json({ error: err.message, service }, 502);
  }
};

// ---------------------------------------------------------------------------
// Shared ArcGIS query helper — tries each URL in order, returns first success
// ---------------------------------------------------------------------------
async function arcgisQuery(urls, params) {
  let lastErr;
  for (const base of urls) {
    try {
      console.log('[gis-proxy] Trying:', base);
      const resp = await fetch(`${base}?${params}`, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) {
        const msg = `HTTP ${resp.status} from ${base}`;
        console.warn('[gis-proxy] Skip:', msg);
        lastErr = new Error(msg);
        continue;
      }
      const data = await resp.json();
      // ArcGIS error object (service exists but query failed)
      if (data?.error) {
        const msg = data.error.message || JSON.stringify(data.error);
        console.warn('[gis-proxy] ArcGIS error from', base, ':', msg);
        lastErr = new Error(msg);
        continue;
      }
      const count = data?.features?.length ?? (data?.geometries?.length ?? '?');
      console.log(`[gis-proxy] OK from ${base} — ${count} features`);
      return data;
    } catch (e) {
      console.warn('[gis-proxy] Fetch error from', base, ':', e.message);
      lastErr = e;
    }
  }
  throw lastErr || new Error('All endpoints failed');
}

// ---------------------------------------------------------------------------
// Parcels — NC OneMap FeatureServer/1 (polygons, free, all NC counties)
//           → Regrid API (nationwide, normalized fields, paid key optional)
// ---------------------------------------------------------------------------

/**
 * Normalize NC OneMap field names to match geo-layers.js _prop() aliases.
 * _prop() is case-sensitive, so lowercase NC OneMap fields need renaming.
 */
function _normalizeNCOneMap(fc) {
  if (!fc?.features) return fc;

  fc.features.forEach(f => {
    const p = f.properties;
    if (!p) return;
    
    // Standard field mappings
    if (p.parno      != null) p.parcelnumb = p.parno;
    if (p.ownname    != null) p.owner      = p.ownname;
    if (p.ownname2   != null) p.OWNER1     = p.ownname2;
    if (p.gisacres   != null) p.GISACRES   = p.gisacres;
    if (p.parusedesc != null) p.usedesc    = p.parusedesc;
    if (p.parusecode != null) p.usecode    = p.parusecode;
    if (p.cntyname   != null) p.county     = p.cntyname;
    
    // NC OneMap address reality:
    //   siteadd = EMPTY for most Guilford Co parcels
    //   saddno/saddstname/saddstr/saddstsuf/saddsttyp = site address COMPONENTS
    //   mailadd = owner's MAILING address (could be PO Box or different city)
    //   scity = site city, mcity = mailing city
    
    // Step 1: Try assembling from site address components
    var parts = [];
    if (p.saddno && String(p.saddno).trim()) parts.push(String(p.saddno).trim());
    if (p.saddpref && String(p.saddpref).trim()) parts.push(String(p.saddpref).trim());
    if (p.saddstname && String(p.saddstname).trim()) parts.push(String(p.saddstname).trim());
    if (p.saddsttyp && String(p.saddsttyp).trim()) parts.push(String(p.saddsttyp).trim());
    if (p.saddstsuf && String(p.saddstsuf).trim()) parts.push(String(p.saddstsuf).trim());
    
    if (parts.length >= 2) {
      // We have a real site address from components
      p.address = parts.join(' ');
      if (p.scity && String(p.scity).trim()) p.address += ', ' + String(p.scity).trim();
    } else if (p.siteadd && String(p.siteadd).trim()) {
      // siteadd field has data (rare for Guilford)
      p.address = String(p.siteadd).trim();
      if (p.scity && String(p.scity).trim()) p.address += ', ' + String(p.scity).trim();
    } else if (p.mailadd && String(p.mailadd).trim()) {
      // Fall back to owner's mailing address
      p.address = String(p.mailadd).trim();
      if (p.mcity && String(p.mcity).trim()) p.address += ', ' + String(p.mcity).trim();
    }
    // If nothing found, p.address stays undefined — client shows county/PIN
  });
  return fc;
}

// ---------------------------------------------------------------------------
// Farm-specific query — fetches ONLY farm/agriculture parcels from NC OneMap
// Uses WHERE clause to filter by land use, covering the entire bbox area.
// Returns up to 2000 farm parcels per request.
// ---------------------------------------------------------------------------
async function fetchFarms(w, s, e, n) {
  const farmWhere = [
    "parusedesc LIKE '%AGRI%'",
    "parusedesc LIKE '%FARM%'",
    "parusedesc LIKE '%CROP%'",
    "parusedesc LIKE '%DAIRY%'",
    "parusedesc LIKE '%LIVESTOCK%'",
    "parusedesc LIKE '%FOREST%'",
    "parusedesc LIKE '%TIMBER%'",
    "parusedesc LIKE '%HORTI%'",
    "parusedesc LIKE '%NURSERY%'",
    "parusedesc LIKE '%POULTRY%'",
    "parusedesc LIKE '%PASTURE%'",
    "parusedesc LIKE '%ORCHARD%'",
    "parusedesc LIKE '%RANCH%'",
    "parusedesc LIKE '%VINEYARD%'",
    "parusedesc LIKE '%TOBACCO%'",
    "parusedesc LIKE '%HAY%'",
    "parusedesc LIKE '%EQUINE%'",
    "parusedesc LIKE '%CATTLE%'",
    "parusedesc LIKE '%SWINE%'",
    "parusedesc LIKE '%AQUA%'",
    "parusedesc LIKE '%COTTON%'",
    "parusedesc LIKE '%GOAT%'",
    "parusedesc LIKE '%SOD%'",
    "parusedesc LIKE '%CONSERV%'"
  ].join(' OR ');

  const ncOneMapUrl = 'https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/1/query';

  // Strategy: fetch with geometry but use geometryPrecision to keep response small
  const params = new URLSearchParams({
    where:          farmWhere,
    geometry:       `${w},${s},${e},${n}`,
    geometryType:   'esriGeometryEnvelope',
    inSR:           '4326',
    spatialRel:     'esriSpatialRelIntersects',
    outFields:      'parno,ownname,siteadd,saddno,saddstname,saddsttyp,scity,mailadd,mcity,gisacres,parusedesc,cntyname',
    returnGeometry: 'true',
    outSR:          '4326',
    geometryPrecision: '4',
    maxAllowableOffset: '0.0005',
    f:              'json',
    resultRecordCount: '2000',
  });

  try {
    console.log('[gis-proxy] Fetching farms from NC OneMap...');
    const resp = await fetch(`${ncOneMapUrl}?${params}`, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    
    if (data.error) throw new Error(data.error.message || 'ArcGIS error');
    if (!data.features || data.features.length === 0) {
      console.log('[gis-proxy] Farms query: 0 features');
      return geojsonResp({ type: 'FeatureCollection', features: [] });
    }

    console.log(`[gis-proxy] Farms query: ${data.features.length} raw features`);

    // Convert ArcGIS JSON (rings) to GeoJSON Points (centroids only — for pins)
    const features = [];
    for (const f of data.features) {
      const attrs = f.attributes || {};
      const rings = f.geometry?.rings;
      if (!rings || rings.length === 0) continue;

      // Compute centroid from first ring
      const ring = rings[0];
      let cx = 0, cy = 0;
      for (const pt of ring) { cx += pt[0]; cy += pt[1]; }
      cx /= ring.length; cy /= ring.length;

      // Build address
      let addr = attrs.siteadd || '';
      if (!addr) {
        const parts = [attrs.saddno, attrs.saddstname, attrs.saddsttyp].filter(Boolean);
        addr = parts.join(' ');
      }
      if (!addr) addr = attrs.mailadd || '';
      const city = attrs.scity || attrs.mcity || '';

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [cx, cy] },
        properties: {
          owner: attrs.ownname || 'Unknown',
          address: addr,
          city: city,
          acres: attrs.gisacres || 0,
          usedesc: attrs.parusedesc || '',
          parno: attrs.parno || '',
          county: attrs.cntyname || ''
        }
      });
    }

    console.log(`[gis-proxy] Farms: returning ${features.length} centroids`);
    return geojsonResp({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error('[gis-proxy] Farms query failed:', err.message);
    return json({ error: err.message }, 502);
  }
}

async function fetchParcels(w, s, e, n) {

  // Broad bbox params — works for any county/state ArcGIS parcel service.
  // outFields=* so we get whatever the source provides; _normalizeNCOneMap()
  // then aliases NC-specific names, and _prop() in geo-layers.js tries all variants.
  const bboxParams = new URLSearchParams({
    where:          '1=1',
    geometry:       `${w},${s},${e},${n}`,
    geometryType:   'esriGeometryEnvelope',
    inSR:           '4326',
    spatialRel:     'esriSpatialRelIntersects',
    outFields:      '*',
    returnGeometry: 'true',
    outSR:          '4326',
    f:              'geojson',
    resultRecordCount: '500',
  });

  // ── PRIMARY: Guilford County GIS (fastest for local projects) ──
  // ── SECONDARY: NC OneMap statewide (free, all NC counties)     ──
  // arcgisQuery() tries each URL and returns the first success.
  try {
    const data = await arcgisQuery([
      // Guilford County — same host as zoning layer (already proven reachable)
      'https://maps.guilfordcountync.gov/arcgis/rest/services/BaseLayers/Parcels/MapServer/0/query',
      'https://maps.guilfordcountync.gov/arcgis/rest/services/Parcels/MapServer/0/query',
      'https://gis.guilfordcountync.gov/arcgis/rest/services/Parcels/FeatureServer/0/query',
      // NC OneMap statewide parcel polygons (Layer 1 = polygons, Layer 0 = centroids)
      'https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/1/query',
      'https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/0/query',
    ], bboxParams);

    if (data?.features?.length) {
      console.log(`[gis-proxy] Parcels OK — ${data.features.length} polygons`);
      return geojsonResp(_normalizeNCOneMap(data));
    }
    console.warn('[gis-proxy] All ArcGIS parcel endpoints returned 0 features for this bbox');
  } catch (e) {
    console.warn('[gis-proxy] All ArcGIS parcel endpoints failed:', e.message);
  }

  // ── TERTIARY: Regrid API (nationwide, paid plan — polygon geometry if subscribed) ──
  const REGRID_KEY = process.env.REGRID_API_KEY;
  if (REGRID_KEY) {
    try {
      const bboxPolygon = JSON.stringify({
        type: 'Polygon',
        coordinates: [[[w,s],[e,s],[e,n],[w,n],[w,s]]]
      });
      const regridUrl = new URL('https://app.regrid.com/api/v2/us/parcels/query');
      regridUrl.searchParams.set('token', REGRID_KEY);
      regridUrl.searchParams.set('geojson', bboxPolygon);
      regridUrl.searchParams.set('per_page', '500');
      regridUrl.searchParams.set('return_custom', 'false');

      console.log('[gis-proxy] Regrid v2 fallback query');
      const resp = await fetch(regridUrl.toString(), { signal: AbortSignal.timeout(12000) });
      if (resp.ok) {
        const data = await resp.json();
        const fc = data?.parcels ?? data;
        if (fc?.features?.length) {
          fc.features.forEach(f => {
            if (f.properties?.fields) {
              Object.assign(f.properties, f.properties.fields);
              delete f.properties.fields;
            }
          });
          console.log(`[gis-proxy] Regrid OK — ${fc.features.length} parcels`);
          return geojsonResp(fc);
        }
      } else {
        console.warn('[gis-proxy] Regrid HTTP', resp.status);
      }
    } catch (e) {
      console.warn('[gis-proxy] Regrid exception:', e.message);
    }
  }

  // ── LAST RESORT: empty FeatureCollection ──
  console.warn('[gis-proxy] All parcel sources exhausted — returning empty FeatureCollection');
  return geojsonResp({ type: 'FeatureCollection', features: [] });
}

// ---------------------------------------------------------------------------
// Contours — USGS National Map pre-computed LiDAR contours
//   Layer 25: Normal Index Contours      (every 5th line, heavier)
//   Layer 26: Normal Intermediate Contours (standard spacing)
//   Layer 33: Depression Index Contours  (closed depressions)
//   Layer 34: Depression Intermediate Contours
// Elevation field: contourelevation (feet), derived from 3DEP LiDAR
// ---------------------------------------------------------------------------
async function fetchContours(w, s, e, n) {
  const BASE = 'https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer';
  const params = new URLSearchParams({
    where:           '1=1',
    geometry:        `${w},${s},${e},${n}`,
    geometryType:    'esriGeometryEnvelope',
    inSR:            '4326',
    spatialRel:      'esriSpatialRelIntersects',
    outFields:       'contourelevation,contourinterval,fcode',
    outSR:           '4326',
    f:               'geojson',
    resultRecordCount: '2000',
  });

  const [idxRes, intRes, dIdxRes, dIntRes] = await Promise.allSettled([
    arcgisQuery([`${BASE}/25/query`], params),  // Normal Index
    arcgisQuery([`${BASE}/26/query`], params),  // Normal Intermediate
    arcgisQuery([`${BASE}/33/query`], params),  // Depression Index
    arcgisQuery([`${BASE}/34/query`], params),  // Depression Intermediate
  ]);

  const features = [];
  const tag = (res, isIndex) => {
    if (res.status !== 'fulfilled' || !res.value?.features) return;
    res.value.features.forEach(f => {
      f.properties.isIndex   = isIndex;
      f.properties.elevation = Math.round(f.properties.contourelevation ?? 0);
      features.push(f);
    });
  };
  tag(idxRes,  true);
  tag(intRes,  false);
  tag(dIdxRes, true);
  tag(dIntRes, false);

  console.log(`[gis-proxy] contours: ${features.length} LiDAR features from USGS National Map`);
  return geojsonResp({ type: 'FeatureCollection', features });
}

// ---------------------------------------------------------------------------
// Soils — USDA Soil Data Access (SDA) WFS + post.rest SQL attribute join
//
// Primary: SDMWGS84Geographic.wfs  → GML2 MapunitPoly (geometry + musym/mukey)
// Enrich:  post.rest SQL            → muname, drclassdcd, hydgrpdcd by mukey
//
// GML note: EPSG:4326 in GML2 uses (lat, lon) axis order — must swap to [lon,lat]
// ---------------------------------------------------------------------------

/**
 * Lightweight GML2 → GeoJSON converter for USDA SDA MapunitPoly features.
 * Parses <gml:featureMember> blocks, extracts MultiPolygon/Polygon geometry,
 * and attaches soil attribute properties.
 */
function _gml2ToGeojson(gmlText) {
  const features = [];
  const memberRe = /<gml:featureMember>([\s\S]*?)<\/gml:featureMember>/g;
  let m;
  while ((m = memberRe.exec(gmlText)) !== null) {
    const block = m[1];
    const prop = (tag) => {
      const r = new RegExp(`<ms:${tag}>(.*?)<\\/ms:${tag}>`);
      return (block.match(r) || [])[1]?.trim() ?? null;
    };
    const musym     = prop('musym');
    const mukey     = prop('mukey');
    const muareaacres = parseFloat(prop('muareaacres') || '0');
    const areasymbol  = prop('areasymbol');

    // Collect all gml:Polygon rings inside the featureMember
    const polygons = [];
    const polyRe   = /<gml:Polygon>([\s\S]*?)<\/gml:Polygon>/g;
    let pm;
    while ((pm = polyRe.exec(block)) !== null) {
      const rings = [];
      const parseRing = (ringXml) => {
        const cm = ringXml.match(/<gml:coordinates[^>]*>([\s\S]*?)<\/gml:coordinates>/);
        if (!cm) return null;
        // GML2 coords are space-separated "lat,lon" pairs → swap to [lon,lat]
        const tokens = cm[1].trim().split(/\s+/);
        return tokens.map(t => {
          const [lat, lon] = t.split(',').map(Number);
          return [lon, lat]; // GeoJSON uses [lon, lat]
        }).filter(c => !c.some(isNaN));
      };
      const outerM = pm[1].match(/<gml:outerBoundaryIs>([\s\S]*?)<\/gml:outerBoundaryIs>/);
      if (outerM) { const r = parseRing(outerM[1]); if (r?.length > 2) rings.push(r); }
      const innerRe = /<gml:innerBoundaryIs>([\s\S]*?)<\/gml:innerBoundaryIs>/g;
      let im;
      while ((im = innerRe.exec(pm[1])) !== null) {
        const r = parseRing(im[1]); if (r?.length > 2) rings.push(r);
      }
      if (rings.length) polygons.push(rings);
    }
    if (!polygons.length) continue;

    features.push({
      type: 'Feature',
      geometry: polygons.length === 1
        ? { type: 'Polygon',      coordinates: polygons[0] }
        : { type: 'MultiPolygon', coordinates: polygons },
      properties: { musym, mukey, muareaacres, areasymbol,
                    muname: null, drclassdcd: null, hydgrpdcd: null },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Enrich GeoJSON features with muname, drclassdcd, hydgrpdcd from SDA SQL.
 * POSTs a SELECT to post.rest and joins by mukey.
 */
async function _enrichSoilAttrs(fc) {
  const mukeys = [...new Set(fc.features.map(f => f.properties.mukey).filter(Boolean))];
  if (!mukeys.length) return fc;
  const sql = `SELECT mu.mukey, mu.muname, ma.drclassdcd, ma.hydgrpdcd
               FROM mapunit mu
               LEFT JOIN muaggatt ma ON mu.mukey = ma.mukey
               WHERE mu.mukey IN (${mukeys.map(k => `'${k}'`).join(',')})`;
  try {
    const resp = await fetch('https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `FORMAT=JSON&QUERY=${encodeURIComponent(sql)}`,
      signal:  AbortSignal.timeout(8000),
    });
    if (!resp.ok) return fc;
    const json = await resp.json();
    // SDA post.rest returns { Table: [[mukey, muname, drclassdcd, hydgrpdcd], ...] }
    const rows = Array.isArray(json) ? json : (json?.Table || []);
    const byKey = {};
    for (const [mukey, muname, drclassdcd, hydgrpdcd] of rows) {
      byKey[mukey] = { muname, drclassdcd, hydgrpdcd };
    }
    fc.features.forEach(f => {
      const attrs = byKey[f.properties.mukey];
      if (attrs) Object.assign(f.properties, attrs);
    });
  } catch (e) {
    console.warn('[gis-proxy] SDA post.rest attr join failed:', e.message);
  }
  return fc;
}

async function fetchSoils(w, s, e, n) {
  // ── PRIMARY: USDA SDA WFS — authoritative SSURGO, free, no auth ──
  try {
    console.log('[gis-proxy] USDA SDA WFS soils query for bbox', w, s, e, n);
    const filter = `<Filter><BBOX><PropertyName>Geometry</PropertyName>` +
                   `<Box srsName='EPSG:4326'><coordinates>${w},${s} ${e},${n}</coordinates></Box></BBOX></Filter>`;
    const wfsUrl = `https://SDMDataAccess.sc.egov.usda.gov/Spatial/SDMWGS84Geographic.wfs` +
                   `?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=MapunitPoly` +
                   `&FILTER=${encodeURIComponent(filter)}&SRSNAME=EPSG:4326&OUTPUTFORMAT=GML2&MAXFEATURES=2000`;

    const resp = await fetch(wfsUrl, { signal: AbortSignal.timeout(25000) });
    if (!resp.ok) throw new Error(`SDA WFS HTTP ${resp.status}`);
    const gml  = await resp.text();
    if (!gml.includes('<gml:featureMember>')) throw new Error('No features in GML response');

    let fc = _gml2ToGeojson(gml);
    console.log(`[gis-proxy] SDA WFS OK — ${fc.features.length} soil map units`);

    // Enrich with muname, drainage class, hydrologic group from SDA SQL
    fc = await _enrichSoilAttrs(fc);
    return geojsonResp(fc);
  } catch (e) {
    console.warn('[gis-proxy] SDA WFS exception:', e.message);
  }

  // ── FALLBACK: empty FeatureCollection (ArcGIS soil services require auth) ──
  console.warn('[gis-proxy] Soils: all sources failed — returning empty');
  return geojsonResp({ type: 'FeatureCollection', features: [] });
}

// ---------------------------------------------------------------------------
// Zoning — Guilford County / City of Greensboro / High Point
// ---------------------------------------------------------------------------
async function fetchZoning(w, s, e, n) {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: 500
  });

  const data = await arcgisQuery([
    // Greensboro City GIS — verified working 2026-05-15
    'https://gis.greensboro-nc.gov/arcgis/rest/services/Planning/Zoning_MS/MapServer/7/query',
    // Overlay zoning districts (additional Greensboro layer)
    'https://gis.greensboro-nc.gov/arcgis/rest/services/Planning/Zoning_MS/MapServer/1/query',
  ], params);

  // Normalize Greensboro field names to common aliases
  if (data?.features) {
    data.features.forEach(f => {
      const p = f.properties;
      if (!p) return;
      if (p.ZONINGDISTRICT     != null) p.zoning             = p.ZONINGDISTRICT;
      if (p.ZONINGDISTRICTTITLE != null) p.zoning_description = p.ZONINGDISTRICTTITLE;
      if (p.CATEGORY           != null) p.zoning_category    = p.CATEGORY;
    });
  }

  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
// Hydrology — USGS National Hydrography Dataset (NHD Plus HR)
//   Layer 9:  NHDWaterbody         — lakes, ponds, reservoirs (polygons)
//   Layer 8:  NHDArea              — open-water stream surfaces (polygons)
//   Layer 3:  NetworkNHDFlowline   — named/connected rivers & streams (lines)
//   Layer 4:  NonNetworkNHDFlowline— small creeks, ditches, headwaters (lines)
// Fallback: standard NHD flowline service for any streams missed by Plus HR
// ---------------------------------------------------------------------------
async function fetchHydrology(w, s, e, n) {
  const base = new URLSearchParams({
    where: '1=1',
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: 1000,
  });

  // Separate params for flowlines — no record cap so we get all small streams
  const lineParams = new URLSearchParams(base);
  lineParams.set('resultRecordCount', '2000');

  const NHD    = 'https://hydro.nationalmap.gov/arcgis/rest/services/NHDPlus_HR/MapServer';
  const NHD_STD = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer';

  const [wb, area, netFl, nonNetFl, stdFl] = await Promise.allSettled([
    arcgisQuery([`${NHD}/9/query`],     base),      // NHDWaterbody
    arcgisQuery([`${NHD}/8/query`],     base),      // NHDArea
    arcgisQuery([`${NHD}/3/query`],     lineParams), // NetworkNHDFlowline (major streams)
    arcgisQuery([`${NHD}/4/query`],     lineParams), // NonNetworkNHDFlowline (small creeks)
    arcgisQuery([`${NHD_STD}/2/query`], lineParams), // Standard NHD all flowlines (fallback)
  ]);

  // Deduplicate flowlines by PERMANENT_IDENTIFIER so NHD+HR and standard NHD
  // don't double-render the same stream reach
  const seen = new Set();
  const dedup = (feats) => (feats || []).filter(f => {
    const id = f.properties?.PERMANENT_IDENTIFIER || f.properties?.GNIS_NAME || Math.random();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const features = [
    ...dedup(wb.status      === 'fulfilled' ? wb.value?.features      : []),
    ...dedup(area.status    === 'fulfilled' ? area.value?.features    : []),
    ...dedup(netFl.status   === 'fulfilled' ? netFl.value?.features   : []),
    ...dedup(nonNetFl.status === 'fulfilled' ? nonNetFl.value?.features : []),
    ...dedup(stdFl.status   === 'fulfilled' ? stdFl.value?.features   : []),
  ];

  console.log(`[gis-proxy] hydrology: ${features.length} total features`);
  return geojsonResp({ type: 'FeatureCollection', features });
}

// ---------------------------------------------------------------------------
// Floodplain — FEMA National Flood Hazard Layer (NFHL)
// ---------------------------------------------------------------------------
async function fetchFloodplain(w, s, e, n) {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: 500
  });

  const data = await arcgisQuery([
    // FEMA Living Atlas (AGOL) — verified working 2026-05-16
    'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Flood_Hazard_Reduced_Set_gdb/FeatureServer/0/query',
  ], params);

  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
// Wetlands — USFWS National Wetlands Inventory (NWI) via USGS WIM MapServer
//   Note: where=1=1 causes timeout on WIM; geometry-only query works fine.
//   Note: ESRI Living Atlas P3ePLMYs2RVChkJx requires AGOL auth (400 anon).
// ---------------------------------------------------------------------------
async function fetchWetlands(w, s, e, n) {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    outSR: '4326',
    f: 'geojson',
    resultRecordCount: '500',
  });

  const data = await arcgisQuery([
    // USGS WIM — public NWI MapServer (geometry query only, no where clause)
    'https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0/query',
  ], params);

  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
// Future Land Use — Greensboro Comprehensive Plan 2040, Layer 1
//   DISTRICT field: Residential, Commercial, Downtown, Industrial,
//   Major Campus, Airport, Reserve, + 9 Neighborhood Plans
// ---------------------------------------------------------------------------
async function fetchFutureLandUse(w, s, e, n) {
  const params = new URLSearchParams({
    where:           '1=1',
    geometry:        `${w},${s},${e},${n}`,
    geometryType:    'esriGeometryEnvelope',
    inSR:            '4326',
    spatialRel:      'esriSpatialRelIntersects',
    outFields:       'DISTRICT,Acres',
    outSR:           '4326',
    f:               'geojson',
    resultRecordCount: '500',
  });
  const data = await arcgisQuery([
    'https://gis.greensboro-nc.gov/arcgis/rest/services/Planning/CompPlan2040_MS/MapServer/1/query',
  ], params);
  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
// Overlay Districts — Greensboro Zoning_MS Layer 1
//   Includes Pedestrian Scale, Visual Corridor, Central Business overlays
// ---------------------------------------------------------------------------
async function fetchOverlayDistricts(w, s, e, n) {
  const params = new URLSearchParams({
    where:           '1=1',
    geometry:        `${w},${s},${e},${n}`,
    geometryType:    'esriGeometryEnvelope',
    inSR:            '4326',
    spatialRel:      'esriSpatialRelIntersects',
    outFields:       'NAME,TYPE,ACRES',
    outSR:           '4326',
    f:               'geojson',
    resultRecordCount: '200',
  });
  const data = await arcgisQuery([
    'https://gis.greensboro-nc.gov/arcgis/rest/services/Planning/Zoning_MS/MapServer/1/query',
  ], params);
  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
// Historic Districts — Greensboro Zoning_MS Layer 6
//   Local Historic Districts triggering design review requirements
// ---------------------------------------------------------------------------
async function fetchHistoricDistricts(w, s, e, n) {
  const params = new URLSearchParams({
    where:           '1=1',
    geometry:        `${w},${s},${e},${n}`,
    geometryType:    'esriGeometryEnvelope',
    inSR:            '4326',
    spatialRel:      'esriSpatialRelIntersects',
    outFields:       'NAME',
    outSR:           '4326',
    f:               'geojson',
    resultRecordCount: '100',
  });
  const data = await arcgisQuery([
    'https://gis.greensboro-nc.gov/arcgis/rest/services/Planning/Zoning_MS/MapServer/6/query',
  ], params);
  return geojsonResp(data);
}

// ---------------------------------------------------------------------------
function geojsonResp(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/geo+json', ...CORS }
  });
}

// ---------------------------------------------------------------------------
// Buildings — OpenStreetMap Overpass API (same as AVA V.4)
// ---------------------------------------------------------------------------
async function fetchBuildings(w, s, e, n) {
  const query = `[out:json][timeout:15];way["building"](${s},${w},${n},${e});out body;>;out skel qt;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query)
  });
  if (!res.ok) throw new Error('Overpass API error: ' + res.status);
  const data = await res.json();
  
  // Build node lookup
  const nodes = {};
  for (const el of data.elements) {
    if (el.type === 'node') nodes[el.id] = [el.lon, el.lat];
  }
  
  // Convert ways to GeoJSON polygons
  const features = [];
  for (const el of data.elements) {
    if (el.type !== 'way' || !el.nodes) continue;
    const coords = el.nodes.map(id => nodes[id]).filter(Boolean);
    if (coords.length < 3) continue;
    // Close the polygon if not already closed
    if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
      coords.push(coords[0]);
    }
    features.push({
      type: 'Feature',
      properties: {
        building: el.tags?.building || 'yes',
        name: el.tags?.name || '',
        addr: el.tags?.['addr:housenumber'] ? (el.tags['addr:housenumber'] + ' ' + (el.tags['addr:street'] || '')) : ''
      },
      geometry: { type: 'Polygon', coordinates: [coords] }
    });
  }
  
  return json({ type: 'FeatureCollection', features });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

// ---------------------------------------------------------------------------
// Gemini Translation Handler — POST endpoint for i18n
// ---------------------------------------------------------------------------
async function handleTranslate(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured' }, 503);

  let body;
  try { body = await request.json(); } catch(e) { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body.prompt) return json({ error: 'Missing prompt' }, 400);

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: body.prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
        }),
        signal: AbortSignal.timeout(20000)
      }
    );
    if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let translations;
    try { translations = JSON.parse(cleaned); } catch(e) {
      return json({ error: 'Failed to parse translation response', raw: text.substring(0, 500) }, 502);
    }
    return json({ translations });
  } catch(err) {
    console.error('[gis-proxy] translate error:', err.message);
    return json({ error: err.message }, 502);
  }
}
