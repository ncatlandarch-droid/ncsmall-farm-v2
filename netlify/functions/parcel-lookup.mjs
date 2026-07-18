/* ==========================================================================
   NCSmall.Farm V.2 — Parcel Tax Lookup (Netlify Function)
   Fetches enriched tax/assessment data for a parcel by PIN
   Cascading: Guilford County GIS → NC OneMap → graceful fallback
   ========================================================================== */

export async function handler(event) {
  const pin = event.queryStringParameters?.pin;

  if (!pin) {
    return jsonResponse(400, { error: 'PIN parameter is required' });
  }

  // Normalize PIN — remove dashes/spaces for query flexibility
  const cleanPin = pin.replace(/[\s-]/g, '');

  // Cascade through endpoints until one returns data
  const endpoints = [
    // Guilford County — primary parcels with tax fields
    `https://maps.guilfordcountync.gov/arcgis/rest/services/BaseLayers/Parcels/MapServer/0/query?where=PIN+%3D+%27${cleanPin}%27+OR+PARCEL_ID+%3D+%27${cleanPin}%27&outFields=*&f=json`,
    // Guilford County — alternate Cadastral service
    `https://maps.guilfordcountync.gov/arcgis/rest/services/GC_Cadastral_Current/MapServer/0/query?where=PIN+%3D+%27${cleanPin}%27&outFields=*&f=json`,
    // NC OneMap statewide parcels
    `https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/0/query?where=PARCEL_ID+%3D+%27${cleanPin}%27+OR+ALTPARCELID+%3D+%27${cleanPin}%27&outFields=*&f=json`,
  ];

  for (let i = 0; i < endpoints.length; i++) {
    try {
      const res = await fetch(endpoints[i], {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      
      const data = await res.json();
      if (data?.error) continue;
      if (!data?.features?.length) continue;

      const attrs = data.features[0].attributes;
      const enriched = mapAttributes(attrs, cleanPin);
      enriched._source = i === 0 ? 'guilford-primary' : (i === 1 ? 'guilford-cadastral' : 'nc-onemap');
      
      return jsonResponse(200, enriched);
    } catch (err) {
      console.log(`[parcel-lookup] Endpoint ${i} failed: ${err.message}`);
      continue;
    }
  }

  // All endpoints failed — return empty data (not an error)
  return jsonResponse(200, {
    pin: cleanPin,
    assessedValue: null,
    landValue: null,
    buildingValue: null,
    deferredValue: null,
    propertyType: null,
    yearBuilt: null,
    structureSize: null,
    neighborhood: null,
    _source: 'none',
    _note: 'No enriched data found for this PIN. Verify at gisdv.guilfordcountync.gov'
  });
}

/* Map the various possible field names to our standard schema */
function mapAttributes(p, pin) {
  return {
    pin: pin,
    // Tax values
    assessedValue: p.TOTAL_VALUE || p.TOTALVALUE || p.ASSESSED || p.TOTVAL
                || p.Total_Assessed || p.TotalAssessed || p.TOTAL_ASSESSED || null,
    landValue: p.LAND_VALUE || p.LANDVALUE || p.LANDVAL || p.Total_Land_Value 
            || p.TotalLandValue || p.TOTAL_LAND || null,
    buildingValue: p.BLDG_VALUE || p.BUILDING_VALUE || p.BLDGVAL || p.Total_Building_Value
                || p.TotalBuildingValue || p.TOTAL_BLDG || null,
    deferredValue: p.DEFERRED_VALUE || p.DEFVAL || p.DEFERRED 
                || p.Total_Deferred_Value || p.TotalDeferredValue || p.TOTAL_DEFERRED || null,
    // Property info
    propertyType: p.LAND_USE || p.LANDUSE || p.CLASS || p.PROPTYPE
               || p.Property_Type || p.PropertyType || p.PROP_TYPE || null,
    yearBuilt: p.YEAR_BUILT || p.YEARBUILT || p.YRBLT || p.Year_Built || null,
    structureSize: p.HEATED_AREA || p.SQ_FT || p.SQFT || p.BLDGSQFT
                || p.Structure_Size || p.StructureSize || p.STRUCT_SZ || null,
    neighborhood: p.NEIGHBORHOOD || p.NBHD || p.Neighborhood || null,
    // Owner/address (for cross-reference)
    owner: p.OWNER || p.OWNERNM || p.OWNER_NAME || p.owner || p.ownname || null,
    address: p.SITUS_ADDRESS || p.SITE_ADDR || p.siteadd || p.mailadd || p.ADDRESS || null,
    acreage: p.GISACRES || p.gisacres || p.acres || p.CALCACRES || p.ACREAGE || null,
    lotSize: p.LOT_SIZE || p.LOTSIZE || p.Lot_Size || null,
    // Additional GIS fields
    zoning: p.ZONING || p.ZONE || p.Zoning || null,
    landUseCode: p.parusecode || p.LAND_USE_CODE || p.LUSECODE || null,
    landUseDesc: p.parusedesc || p.usedesc || p.LAND_USE_DESC || p.LUSEDESC || null,
  };
}

function jsonResponse(status, body) {
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
    body: JSON.stringify(body)
  };
}
