/* ==========================================================================
   NCSmall.Farm V.2 — Map View (Real Data)
   Google satellite + Guilford County real-time GIS
   ========================================================================== */

(function() {

  let mapInstance = null;
  let parcelPolygonGroup = null;
  let filterText = '';
  let realParcelLayer = null;
  let lastBbox = null;
  let isFetchingParcels = false;
  let totalRealParcelsInView = 0;

  /* ── Farm Classification from land use ────────────────────── */
  const FARM_CLASS = {
    'confirmed-farm':   { color: '#2E7D32', fill: 'rgba(46,125,50,0.18)',  label: 'Confirmed Farm' },
    'likely-farm':      { color: '#4CAF50', fill: 'rgba(76,175,80,0.15)',  label: 'Likely Farm' },
    'potential-farm':   { color: '#FFC107', fill: 'rgba(255,193,7,0.15)',  label: 'Potential Farm' },
    'non-agricultural': { color: '#78909C', fill: 'rgba(120,144,156,0.08)', label: 'Non-Agricultural' }
  };

  function classifyParcel(landUse, acres) {
    var lu = (landUse || '').toUpperCase();
    var ac = parseFloat(acres) || 0;
    // Confirmed: explicitly agricultural land use
    if (lu.includes('AGRI') || lu.includes('FARM') || lu.includes('CROP') ||
        lu.includes('DAIRY') || lu.includes('LIVESTOCK') || lu.includes('ORCHARD') ||
        lu.includes('TIMBER') || lu.includes('FOREST') || lu.includes('HORTI') ||
        lu.includes('NURSERY') || lu.includes('POULTRY') || lu.includes('RANCH')) {
      return 'confirmed-farm';
    }
    // Likely: rural residential with significant acreage
    if ((lu.includes('RURAL') || lu.includes('R-A') || lu.includes('AG')) && ac >= 5) {
      return 'likely-farm';
    }
    // Potential: residential with 10+ acres (could be farmed)
    if (lu.includes('RESID') && ac >= 10) {
      return 'potential-farm';
    }
    // Potential: vacant land with 5+ acres
    if ((lu.includes('VACANT') || lu.includes('UNIMP') || lu === '' || lu === 'UNKNOWN') && ac >= 5) {
      return 'potential-farm';
    }
    return 'non-agricultural';
  }

  /* ── Main Render ─────────────────────────────────────────── */
  window.renderMapView = function() {
    setTimeout(() => initMap(), 80);

    return h('div', { style: { position: 'relative', width: '100%', height: 'calc(100vh - 64px)' } },

      // Map container
      h('div', { id: 'nc-farm-map', style: { width: '100%', height: '100%', zIndex: '1' } }),

      // ── Top: Search ──
      h('div', { style: { position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: '1000', display: 'flex', gap: '8px', alignItems: 'center' } },
        h('div', { style: { display: 'flex', alignItems: 'center', background: 'rgba(10,14,23,0.85)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', width: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
          h('span', { className: 'material-icons-round', style: { padding: '10px 12px', color: '#94a3b8', fontSize: '18px' } }, 'search'),
          h('input', {
            type: 'text', placeholder: 'Search address or owner (Coming soon)...',
            style: { flex: '1', border: 'none', outline: 'none', background: 'transparent', color: '#f8fafc', fontSize: '13px', fontWeight: '500', padding: '10px 12px 10px 0', fontFamily: 'Inter, sans-serif' },
            value: filterText,
            onInput: (e) => { filterText = e.target.value; }
          })
        )
      ),

      // ── Right: Layers + Farm Filter Panel ──
      h('div', { style: { position: 'absolute', top: '12px', right: '12px', zIndex: '1000', width: '220px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' } },
        // GIS Layers
        panel(
          secTitle('Geoscope Layers'),
          layerDot('Clean Satellite', 'satellite_alt', '#90A4AE', true),
          layerDot('Parcels', 'texture', '#FDB927', true),
          divider(),
          layerDot('Soils (SSURGO)', 'grass', '#4CAF50', false),
          layerDot('Zoning', 'home_work', '#AB47BC', false),
          layerDot('Overlay Districts', 'layers', '#5C6BC0', false),
          layerDot('Future Land Use', 'map', '#F57F17', false),
          layerDot('Water Bodies & Streams', 'waves', '#1E88E5', false),
          layerDot('Flood Zones', 'water', '#2196F3', false),
          layerDot('Wetlands (NWI)', 'water_drop', '#00897B', false),
          divider(),
          layerDot('Building Footprints', 'apartment', '#FF6B35', false),
          layerDot('Elevation (DEM)', 'terrain', '#66BB6A', false),
          layerDot('Sun Exposure', 'wb_sunny', '#FFC107', false),
          layerDot('Slope Analysis', 'signal_cellular_alt', '#E91E63', false)
        ),
        // Farm Classification Filter
        h('div', { style: { marginTop: '8px' } },
          panel(
            secTitle('Farm Classification'),
            h('div', { style: { fontSize: '9px', color: '#64748b', marginBottom: '8px', lineHeight: '1.4' } }, 'NC § 160D-903 · Guilford County UDO'),
            farmFilterBtn('ALL', 'All Parcels', '#f8fafc', '—'),
            farmFilterBtn('confirmed-farm', 'Confirmed Farm', '#2E7D32', '—'),
            farmFilterBtn('likely-farm', 'Likely Farm', '#4CAF50', '—'),
            farmFilterBtn('potential-farm', 'Potential Farm', '#FFC107', '—'),
            farmFilterBtn('non-agricultural', 'Non-Agricultural', '#78909C', '—'),
            divider(),
            secTitle('Identification Criteria'),
            criteriaRow('verified', 'Bona Fide Farm Cert', '#2E7D32'),
            criteriaRow('agriculture', 'VAD / EVAD Enrolled', '#4CAF50'),
            criteriaRow('paid', 'Present-Use Value Tax', '#FFC107'),
            criteriaRow('home_work', 'AG / R-A Zoned', '#81C784')
          )
        )
      ),

      // ── Bottom Left: Portfolio Stats ──
      h('div', { style: { position: 'absolute', bottom: '20px', left: '12px', zIndex: '1000', width: '230px' } },
        panel(
          secTitle('Real-Time Data'),
          h('div', { id: 'real-parcel-count-label', style: { fontSize: '13px', fontWeight: '800', color: '#f8fafc', padding: '8px 0' } }, `Parcels in View: ${totalRealParcelsInView}`),
          h('div', { style: { fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' } }, 'Zoom in and click any parcel to load enriched tax and assessment data.')
        )
      ),

      // Intake Form Modal (hidden by default)
      h('div', { id: 'farmer-intake-modal', style: { display: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: '9999', justifyContent: 'center', alignItems: 'center' } },
        h('div', { style: { background: 'rgba(10,14,23,0.95)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', width: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 48px rgba(0,0,0,0.6)' } },
          h('h2', { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' } }, '🌱 Farm Profile Intake'),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Owner Name (from GIS)'),
            h('input', { id: 'intake-owner', type: 'text', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } })
          ),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Property Address'),
            h('input', { id: 'intake-address', type: 'text', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } })
          ),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Acreage'),
            h('input', { id: 'intake-acres', type: 'text', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } })
          ),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Do you have Bona Fide Farm status?'),
            h('select', { id: 'intake-bff', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } },
              h('option', { value: 'yes' }, 'Yes'), h('option', { value: 'no' }, 'No'), h('option', { value: 'unsure' }, 'Not Sure')
            )
          ),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Are you enrolled in VAD or EVAD?'),
            h('select', { id: 'intake-vad', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } },
              h('option', { value: 'none' }, 'None'), h('option', { value: 'vad' }, 'VAD'), h('option', { value: 'evad' }, 'EVAD')
            )
          ),

          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Do you have Present-Use Value (PVU) tax deferral?'),
            h('select', { id: 'intake-pvu', style: { width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' } },
              h('option', { value: 'yes' }, 'Yes'), h('option', { value: 'no' }, 'No'), h('option', { value: 'unsure' }, 'Not Sure')
            )
          ),
          
          h('div', { style: { marginBottom: '12px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'What do you farm?'),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', color: '#cbd5e1' } },
              ...['Row Crops', 'Livestock', 'Forestry', 'Horticulture', 'Aquaculture', 'Other'].map(lbl => 
                h('label', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, h('input', { type: 'checkbox', value: lbl, className: 'farm-type-chk' }), lbl)
              )
            )
          ),
          
          h('div', { style: { marginBottom: '16px' } },
            h('label', { style: { display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' } }, 'Top Resource Concerns'),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', color: '#cbd5e1' } },
              ...['Soil Erosion', 'Water Quality', 'Drainage', 'Pest Management', 'No Riparian Buffer', 'Nutrient Runoff', 'Pasture Degradation', 'Other'].map(lbl => 
                h('label', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, h('input', { type: 'checkbox', value: lbl, className: 'concern-chk' }), lbl)
              )
            )
          ),

          h('div', { style: { display: 'flex', gap: '8px' } },
            h('button', { 
              onclick: () => document.getElementById('farmer-intake-modal').style.display = 'none',
              style: { flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' } 
            }, 'Cancel'),
            h('button', { 
              onclick: submitIntakeForm,
              style: { flex: 1, padding: '10px', background: '#3B7A57', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' } 
            }, 'Complete Profile')
          )
        )
      )
    );
  };

  /* ── UI Helpers ──────────────────────────────────────────── */

  function panel() {
    var el = document.createElement('div');
    Object.assign(el.style, { background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(16px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' });
    for (var i = 0; i < arguments.length; i++) {
      var child = arguments[i];
      if (child instanceof Node) el.appendChild(child);
      else if (Array.isArray(child)) child.forEach(function(c) { if (c instanceof Node) el.appendChild(c); });
      else if (child !== null && child !== undefined && child !== false) el.appendChild(document.createTextNode(String(child)));
    }
    return el;
  }
  function secTitle(text) {
    return h('div', { style: { fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' } }, text);
  }
  function divider() {
    return h('div', { style: { height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' } });
  }
  function criteriaRow(icon, label, color) {
    return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' } },
      h('span', { className: 'material-icons-round', style: { fontSize: '13px', color: color } }, icon),
      h('span', { style: { fontSize: '10px', color: '#cbd5e1' } }, label)
    );
  }
  function farmFilterBtn(key, label, color, count) {
    return h('button', {
      'data-farm-class': key,
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        padding: '6px 8px', marginBottom: '3px', borderRadius: '8px', border: 'none',
        background: 'transparent',
        cursor: 'default', fontFamily: 'Inter, sans-serif'
      }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('div', { style: { width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: '0', border: '2px solid ' + color + '88' } }),
        h('span', { style: { fontSize: '11px', fontWeight: '500', color: '#94a3b8' } }, label)
      ),
      h('span', { className: 'fc-count', style: { fontSize: '11px', fontWeight: '800', color: color } }, String(count))
    );
  }
  function layerDot(label, icon, color, active) {
    return h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', cursor: 'pointer' },
      onclick: function(e) {
        var dot = e.currentTarget.querySelector('.ldot');
        if (dot) {
          var isOn = dot.style.background !== 'transparent';
          dot.style.background = isOn ? 'transparent' : color;
          dot.style.borderColor = isOn ? '#475569' : color;
        }
      }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('span', { className: 'material-icons-round', style: { fontSize: '14px', color: active ? color : '#475569' } }, icon),
        h('span', { style: { fontSize: '11px', fontWeight: '500', color: active ? '#e2e8f0' : '#64748b' } }, label)
      ),
      h('div', { className: 'ldot', style: { width: '12px', height: '12px', borderRadius: '50%', background: active ? color : 'transparent', border: '2px solid ' + (active ? color : '#475569'), transition: 'all 0.2s', flexShrink: '0' } })
    );
  }

  /* ── Map Init ── */
  function initMap() {
    var container = document.getElementById('nc-farm-map');
    if (!container) return;
    if (!window.L) return;

    if (mapInstance) { try { mapInstance.remove(); } catch(e) {} mapInstance = null; }

    mapInstance = L.map(container, { zoomControl: false, attributionControl: false }).setView([36.07, -79.79], 14);
    window._ncMapInstance = mapInstance;

    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 21 }).addTo(mapInstance);
    L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', { maxZoom: 21, opacity: 0.4 }).addTo(mapInstance);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
    parcelPolygonGroup = L.layerGroup().addTo(mapInstance);

    mapInstance.on('moveend', fetchRealParcels);
    mapInstance.on('zoomend', fetchRealParcels);

    setTimeout(function() {
      if (mapInstance) {
        mapInstance.invalidateSize();
        fetchRealParcels(); 
      }
    }, 400);
  }

  /* ── Fetch REAL parcel polygons from gis-proxy ── */
  function fetchRealParcels() {
    if (!mapInstance || isFetchingParcels) return;
    var zoom = mapInstance.getZoom();
    if (zoom < 14) {
      if (realParcelLayer) { mapInstance.removeLayer(realParcelLayer); realParcelLayer = null; }
      showToast('Zoom in to load parcel boundaries', 'info');
      document.getElementById('real-parcel-count-label').innerText = `Parcels in View: 0`;
      return;
    }

    var bounds = mapInstance.getBounds();
    var bbox = bounds.getWest().toFixed(6) + ',' + bounds.getSouth().toFixed(6) + ',' +
               bounds.getEast().toFixed(6) + ',' + bounds.getNorth().toFixed(6);

    if (bbox === lastBbox) return;
    lastBbox = bbox;
    isFetchingParcels = true;
    showToast('Loading parcels...', 'info');

    var w = bounds.getWest().toFixed(6);
    var s = bounds.getSouth().toFixed(6);
    var e = bounds.getEast().toFixed(6);
    var n = bounds.getNorth().toFixed(6);

    var arcgisParams = 'where=1%3D1&geometry=' + w + ',' + s + ',' + e + ',' + n
      + '&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects'
      + '&outFields=*&returnGeometry=true&outSR=4326&f=geojson&resultRecordCount=500';

    var urls = [
      '/.netlify/functions/gis-proxy?service=parcels&bbox=' + w + ',' + s + ',' + e + ',' + n,
      'https://maps.guilfordcountync.gov/arcgis/rest/services/BaseLayers/Parcels/MapServer/0/query?' + arcgisParams,
      'https://maps.guilfordcountync.gov/arcgis/rest/services/Parcels/MapServer/0/query?' + arcgisParams,
      'https://gis.guilfordcountync.gov/arcgis/rest/services/Parcels/FeatureServer/0/query?' + arcgisParams,
      'https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/1/query?' + arcgisParams
    ];

    tryFetchParcels(urls, 0);
  }

  function tryFetchParcels(urls, idx) {
    if (idx >= urls.length) {
      isFetchingParcels = false;
      showToast('All parcel sources unavailable', 'warn');
      return;
    }

    fetch(urls[idx], { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(geojson) {
        if (!geojson || !geojson.features || !geojson.features.length) {
          throw new Error('empty');
        }
        totalRealParcelsInView = geojson.features.length;
        if(document.getElementById('real-parcel-count-label')) {
            document.getElementById('real-parcel-count-label').innerText = `Parcels in View: ${totalRealParcelsInView}`;
        }
        renderParcelGeoJSON(geojson);
        var src = idx === 0 ? 'proxy' : (urls[idx].includes('guilford') ? 'Guilford County GIS' : 'NC OneMap');
        showToast(geojson.features.length + ' parcels loaded (' + src + ')', 'success');
        isFetchingParcels = false;
      })
      .catch(function(err) {
        console.warn('[NCSmall Map] Source ' + idx + ' failed:', err.message, urls[idx].substring(0, 60));
        tryFetchParcels(urls, idx + 1);
      });
  }

  function renderParcelGeoJSON(geojson) {
    if (realParcelLayer) { mapInstance.removeLayer(realParcelLayer); }

    // Track classification counts
    var classCounts = { 'confirmed-farm': 0, 'likely-farm': 0, 'potential-farm': 0, 'non-agricultural': 0 };
    var farmAcres = 0;
    var skipped = 0;

    realParcelLayer = L.geoJSON(geojson, {
      filter: function(feature) {
        // Only show farm parcels — skip non-agricultural
        var p = feature.properties || {};
        var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || '';
        var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || '0';
        var cls = classifyParcel(landUse, acres);
        if (cls === 'non-agricultural') {
          classCounts['non-agricultural']++;
          skipped++;
          return false; // don't render
        }
        return true;
      },
      style: function(feature) {
        var p = feature.properties || {};
        var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || '';
        var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || '0';
        var cls = classifyParcel(landUse, acres);
        var fc = FARM_CLASS[cls];
        return {
          color: '#FDB927',       // Gold outline on all farm parcels
          weight: 2.5,
          fillColor: fc.color,    // Bold classification color fill
          fillOpacity: 0.4,       // Strong visible fill
          opacity: 0.9
        };
      },
      onEachFeature: function(feature, layer) {
        var p = feature.properties || {};
        var owner = p.owner || p.ownname || p.OWNER_NAME || p.OWNER || p.OWNERNM || 'Unknown';
        var addr = p.mailadd || p.siteadd || p.SITUS_ADDRESS || p.SITE_ADDR || p.sadd || 'Unknown Address';
        var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || '0';
        var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || 'Unknown';
        var pin = p.parcelnumb || p.parno || p.PARCEL_ID || p.PIN || p.PARID || '';
        var cls = classifyParcel(landUse, acres);
        var fc = FARM_CLASS[cls];

        // Track counts
        classCounts[cls]++;
        if (cls === 'confirmed-farm' || cls === 'likely-farm') farmAcres += parseFloat(acres) || 0;

        // Classification badge
        var badge = '<span style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;'
          + 'background:' + fc.color + '22;color:' + fc.color + ';border:1px solid ' + fc.color + '44;">' + fc.label + '</span>';
        
        // Escape quotes for onclick
        var safeOwner = owner.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safeAddr = addr.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        var popupContent = '<div id="popup-' + pin + '" style="min-width:280px;font-family:Inter,sans-serif;padding:4px;">'
          + '<div style="font-weight:900;color:#004684;font-size:15px;margin-bottom:2px;">' + owner + '</div>'
          + '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">' + addr + '</div>'
          + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">' + badge
          + (pin ? '<span style="font-size:10px;color:#64748b;">PIN: ' + pin + '</span>' : '') + '</div>'
          
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'
          + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Acreage</div><div style="font-weight:800;font-size:14px;">' + parseFloat(acres).toFixed(2) + ' ac</div></div>'
          + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Land Use</div><div style="font-size:11px;font-weight:600;color:' + fc.color + ';">' + landUse + '</div></div>'
          + '</div>'
          
          + '<div id="tax-data-' + pin + '" style="margin-bottom:12px; padding: 8px; background: rgba(0,70,132,0.05); border-radius: 6px;">'
          + '<div style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;"><span class="material-icons-round" style="font-size:14px;">sync</span> Loading tax data...</div>'
          + '</div>'

          + '<div style="display:flex;gap:6px;margin-bottom:12px;">'
          + '<a href="https://gisdv.guilfordcountync.gov/Guilford/?pin=' + pin + '" target="_blank" style="flex:1;text-align:center;padding:6px;background:#e2e8f0;color:#334155;border-radius:4px;font-size:10px;font-weight:bold;text-decoration:none;">View on County GIS</a>'
          + '<a href="https://lrcpwa.ncptscloud.com/guilford/" target="_blank" style="flex:1;text-align:center;padding:6px;background:#e2e8f0;color:#334155;border-radius:4px;font-size:10px;font-weight:bold;text-decoration:none;">View Tax Record</a>'
          + '</div>'

          + '<button onclick="window.openIntakeForm(\'' + pin + '\', \'' + safeOwner + '\', \'' + safeAddr + '\', \'' + acres + '\')" style="width:100%;padding:10px;background:#3B7A57;color:white;border:none;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(59,122,87,0.3);">🌱 This Is My Farm — Start Assessment</button>'
          + '</div>';
          
        layer.bindPopup(popupContent, { maxWidth: 320, autoPan: true, autoPanPadding: [40, 80] });

        layer.on('popupopen', function() {
           if (pin) fetchEnrichedTaxData(pin, acres, landUse);
        });

        // Store classification for mouseout restore
        layer._ncClass = cls;
        layer.on('mouseover', function() {
          this.setStyle({ weight: 4, fillOpacity: 0.55, color: '#FFD700' });
        });
        layer.on('mouseout', function() {
          var c = FARM_CLASS[this._ncClass] || FARM_CLASS['confirmed-farm'];
          this.setStyle({ weight: 2.5, fillOpacity: 0.4, color: '#FDB927' });
        });
      }
    }).addTo(mapInstance);

    // Update legend counts
    updateClassCounts(classCounts, farmAcres);
  }

  function updateClassCounts(counts, farmAcres) {
    // Update the farm filter buttons in the sidebar with real counts
    var btns = document.querySelectorAll('[data-farm-class]');
    btns.forEach(function(btn) {
      var cls = btn.getAttribute('data-farm-class');
      var countEl = btn.querySelector('.fc-count');
      if (countEl && counts[cls] !== undefined) {
        countEl.textContent = String(counts[cls]);
      }
    });
    // Update bottom panel
    var label = document.getElementById('real-parcel-count-label');
    if (label) {
      var total = Object.values(counts).reduce(function(a,b) { return a+b; }, 0);
      var farmCount = (counts['confirmed-farm'] || 0) + (counts['likely-farm'] || 0);
      label.innerHTML = 'Parcels: <b>' + total + '</b> · Farms: <b style="color:#4CAF50">' + farmCount + '</b> · <b style="color:#4CAF50">' + Math.round(farmAcres).toLocaleString() + ' ac</b>';
    }
  }

  const EQIP_PRACTICES = {
    'cover_crop':      { code: '340', name: 'Cover Crop',           unit: 'acre', rateMin: 50,  rateMax: 80,  triggers: ['cropland', 'row crops'] },
    'nutrient_mgmt':   { code: '590', name: 'Nutrient Management',  unit: 'acre', rateMin: 8,   rateMax: 12,  triggers: ['any'] },
    'prescribed_graze':{ code: '528', name: 'Prescribed Grazing',   unit: 'acre', rateMin: 12,  rateMax: 18,  triggers: ['livestock', 'pasture'] },
    'riparian_buffer': { code: '391', name: 'Riparian Forest Buffer',unit: 'acre', rateMin: 200, rateMax: 400, triggers: ['near_water'] },
    'high_tunnel':     { code: '325', name: 'High Tunnel System',   unit: 'each', rateMin: 7000,rateMax: 25000,triggers: ['horticulture', 'small_farm'] },
    'fence':           { code: '382', name: 'Fence (Rotational)',    unit: 'lin ft',rateMin: 2, rateMax: 8,   triggers: ['livestock'] },
    'erosion_control': { code: '600', name: 'Terrace',              unit: 'lin ft',rateMin: 3, rateMax: 12,  triggers: ['slope_high'] },
    'waterway':        { code: '412', name: 'Grassed Waterway',     unit: 'acre', rateMin: 800, rateMax: 2000,triggers: ['erosion', 'slope_high'] }
  };

  function fetchEnrichedTaxData(pin, acres, landUse) {
      const container = document.getElementById('tax-data-' + pin);
      if(!container) return;

      fetch('/.netlify/functions/parcel-lookup?pin=' + pin)
        .then(res => res.json())
        .then(data => {
            if(!container) return;
            
            if(data.error) {
                container.innerHTML = '<div style="font-size:10px;color:#e53e3e;">Failed to load enriched data.</div>';
                return;
            }

            const valFmt = v => v ? '$' + Number(v).toLocaleString() : 'N/A';
            let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Assessed Value</div><div style="font-weight:800;font-size:13px;color:#004684;">' + valFmt(data.assessedValue) + '</div></div>';
            
            if (data.deferredValue && Number(data.deferredValue) > 0) {
               html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Deferred (PVU)</div><div style="font-weight:800;font-size:13px;color:#2E7D32;">' + valFmt(data.deferredValue) + '</div><div style="font-size:9px;color:#4CAF50;font-weight:bold;">✓ PVU Enrolled</div></div>';
            } else {
               html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Property Type</div><div style="font-weight:600;font-size:12px;">' + (data.propertyType || 'N/A') + '</div></div>';
            }
            html += '</div>';

            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Year Built</div><div style="font-size:11px;font-weight:600;">' + (data.yearBuilt || 'N/A') + '</div></div>';
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Structure Size</div><div style="font-size:11px;font-weight:600;">' + (data.structureSize ? Number(data.structureSize).toLocaleString() + ' sqft' : 'N/A') + '</div></div>';
            html += '</div>';

            // Auto-generate EQIP Opportunity Card
            let recommended = [];
            let minTotal = 0; let maxTotal = 0;
            let ac = parseFloat(acres) || 0;
            
            if (ac > 0) {
              recommended.push(EQIP_PRACTICES.nutrient_mgmt);
              minTotal += ac * EQIP_PRACTICES.nutrient_mgmt.rateMin;
              maxTotal += ac * EQIP_PRACTICES.nutrient_mgmt.rateMax;
              
              if (ac < 10) {
                 recommended.push(EQIP_PRACTICES.high_tunnel);
                 minTotal += EQIP_PRACTICES.high_tunnel.rateMin;
                 maxTotal += EQIP_PRACTICES.high_tunnel.rateMax;
              } else {
                 recommended.push(EQIP_PRACTICES.cover_crop);
                 minTotal += ac * EQIP_PRACTICES.cover_crop.rateMin;
                 maxTotal += ac * EQIP_PRACTICES.cover_crop.rateMax;
              }
            }

            if (recommended.length > 0) {
                html += '<div style="margin-top: 12px; padding: 12px; background: rgba(59,122,87,0.1); border-left: 4px solid #3B7A57; border-radius: 4px;">';
                html += '<div style="font-size:12px; font-weight:800; color:#3B7A57; margin-bottom:4px; display:flex; align-items:center; gap:4px;"><span class="material-icons-round" style="font-size:14px;">payments</span> EQIP Opportunity</div>';
                html += '<div style="font-size:10px; color:#cbd5e1; margin-bottom:8px;">You may be eligible for NRCS conservation funding:</div>';
                html += '<ul style="margin:0; padding-left:16px; font-size:10px; color:#f8fafc; margin-bottom:8px;">';
                recommended.forEach(p => {
                    html += `<li><b>${p.name}</b> ($${p.rateMin}-${p.rateMax}/${p.unit})</li>`;
                });
                html += '</ul>';
                html += `<div style="font-size:12px; font-weight:800; color:#FDB927;">Est. Potential: $${Math.round(minTotal).toLocaleString()} - $${Math.round(maxTotal).toLocaleString()}</div>`;
                html += '<div style="font-size:9px; color:#94a3b8; margin-top:6px;">* Historically Underserved producers may qualify for higher rates.</div>';
                html += '</div>';
            }

            container.innerHTML = html;
        })
        .catch(err => {
            if(!container) return;
            container.innerHTML = '<div style="font-size:10px;color:#e53e3e;">Tax lookup failed.</div>';
        });
  }

  /* ── Form Intake ─────────────────────────────────────────── */
  let currentIntakePin = '';

  window.openIntakeForm = function(pin, owner, address, acres) {
      currentIntakePin = pin;
      document.getElementById('intake-owner').value = owner || '';
      document.getElementById('intake-address').value = address || '';
      document.getElementById('intake-acres').value = acres ? parseFloat(acres).toFixed(2) : '';
      
      // reset checkboxes
      document.querySelectorAll('.farm-type-chk, .concern-chk').forEach(c => c.checked = false);
      
      document.getElementById('farmer-intake-modal').style.display = 'flex';
  };

  function submitIntakeForm() {
      const data = {
          pin: currentIntakePin,
          owner: document.getElementById('intake-owner').value,
          address: document.getElementById('intake-address').value,
          acres: document.getElementById('intake-acres').value,
          bonaFideFarm: document.getElementById('intake-bff').value,
          vadEnrolled: document.getElementById('intake-vad').value,
          pvu: document.getElementById('intake-pvu').value,
          farmTypes: Array.from(document.querySelectorAll('.farm-type-chk:checked')).map(c => c.value),
          concerns: Array.from(document.querySelectorAll('.concern-chk:checked')).map(c => c.value),
          timestamp: new Date().toISOString()
      };

      if (currentIntakePin) {
          localStorage.setItem('farm_profile_' + currentIntakePin, JSON.stringify(data));
      }

      document.getElementById('farmer-intake-modal').style.display = 'none';
      showToast('Profile saved successfully! Ready for full assessment.', 'success');
  }

  /* ── Toast notification ──────────────────────────────────── */
  function showToast(msg, type) {
    var existing = document.getElementById('nc-map-toast');
    if (existing) existing.remove();
    var colors = { info: '#3B82F6', success: '#22C55E', warn: '#F59E0B' };
    var toast = document.createElement('div');
    toast.id = 'nc-map-toast';
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(10,14,23,0.9)', color: colors[type] || '#f8fafc',
      padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
      fontFamily: 'Inter, sans-serif', zIndex: '9999', backdropFilter: 'blur(8px)',
      border: '1px solid ' + (colors[type] || '#475569') + '44',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    });
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
  }

})();

