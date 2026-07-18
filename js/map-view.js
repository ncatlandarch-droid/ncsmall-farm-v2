/* ==========================================================================
   NCSmall.Farm V.2 — Map View (Modular)
   Google satellite + Guilford County farm classification
   Ported from AVA V.4 geo-layers.js methodology

   Farm Classification Hierarchy (Guilford County UDO + NC § 160D-903):
     1. confirmed-farm  → AG/R-A zoned + Bona Fide Farm certificate
     2. likely-farm     → AG/R-A zoned OR VAD/EVAD enrolled
     3. potential-farm  → RS-40/RD zoned + Present-Use Value tax
     4. non-agricultural → CD, R-3, urban parcels
   ========================================================================== */

(function() {

  let mapInstance = null;
  let markerGroup = null;
  let parcelPolygonGroup = null;
  let filterText = '';
  let farmFilter = 'ALL';  // ALL, confirmed-farm, likely-farm, potential-farm, non-agricultural

  /* ── Farm Classification Colors & Labels ─────────────────── */
  const FARM_CLASS = {
    'confirmed-farm':   { color: '#2E7D32', label: 'Confirmed Farm',    icon: 'verified',         desc: 'AG/R-A + Bona Fide Farm' },
    'likely-farm':      { color: '#4CAF50', label: 'Likely Farm',       icon: 'agriculture',      desc: 'AG/R-A or VAD enrolled' },
    'potential-farm':   { color: '#FFC107', label: 'Potential Farm',    icon: 'help_outline',     desc: 'RS-40/RD + PVU tax status' },
    'non-agricultural': { color: '#78909C', label: 'Non-Agricultural',  icon: 'domain',           desc: 'Urban / Commercial' }
  };

  /* ── Guilford County Zoning Colors (from AVA) ────────────── */
  const ZONING_COLORS = {
    'AG':   '#4CAF50',
    'R-A':  '#81C784',
    'RS-40':'#2196F3',
    'R-3':  '#64B5F6',
    'RD':   '#AB47BC',
    'CD':   '#78909C',
    'PUD':  '#5C6BC0'
  };

  /* ── Parcel polygon from point + acreage (scaled for visibility) ── */
  function createParcelBounds(lat, lon, acreage) {
    // Real size: sqrt(acreage * 4047) meters per side
    // But at zoom 11 (county view), real parcels are invisible pixels.
    // Scale up 5x for demo visibility, with a minimum floor.
    var sideM = Math.sqrt(acreage * 4047) * 5;
    if (sideM < 600) sideM = 600;  // minimum ~600m so even 5ac parcels show
    var latDeg = sideM / 111320;
    var lonDeg = sideM / (111320 * Math.cos(lat * Math.PI / 180));
    // Slight shape variation so parcels aren't all perfect squares
    var skew = (acreage % 7) * 0.0001;
    var stretch = 1 + (acreage % 3) * 0.15;  // some parcels are elongated
    return [
      [lat - latDeg/2 + skew,            lon - lonDeg*stretch/2],
      [lat - latDeg/2,                    lon + lonDeg*stretch/2 + skew],
      [lat + latDeg/2 - skew/2,           lon + lonDeg*stretch/2],
      [lat + latDeg/2,                    lon - lonDeg*stretch/2 - skew]
    ];
  }

  /* ── Main Render ─────────────────────────────────────────── */
  window.renderMapView = function() {
    const parcels = window.DEMO_PARCELS || [];

    // Classification counts
    const classCount = {};
    Object.keys(FARM_CLASS).forEach(k => classCount[k] = 0);
    parcels.forEach(p => { if (classCount[p.farmClass] !== undefined) classCount[p.farmClass]++; });

    // Priority counts
    const highCount = parcels.filter(p => p.priorityLevel === 'high').length;
    const medCount = parcels.filter(p => p.priorityLevel === 'medium').length;
    const lowCount = parcels.filter(p => p.priorityLevel === 'low').length;

    // Financial
    let totalFunding = 0, totalAcres = 0;
    let farmAcres = 0;
    parcels.forEach(p => {
      totalAcres += p.acreage;
      if (p.farmClass === 'confirmed-farm' || p.farmClass === 'likely-farm') farmAcres += p.acreage;
      const parts = p.eqipEstimate.replace(/\$|,/g, '').split('-');
      if (parts.length > 1) totalFunding += parseInt(parts[1].trim());
    });

    // Filtered count
    const filtered = farmFilter === 'ALL' ? parcels : parcels.filter(p => p.farmClass === farmFilter);

    setTimeout(() => initMap(), 80);

    return h('div', { style: { position: 'relative', width: '100%', height: 'calc(100vh - 64px)' } },

      // Map container
      h('div', { id: 'nc-farm-map', style: { width: '100%', height: '100%', zIndex: '1' } }),

      // ── Top: Search + Count ──
      h('div', { style: { position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: '1000', display: 'flex', gap: '8px', alignItems: 'center' } },
        h('div', { style: { display: 'flex', alignItems: 'center', background: 'rgba(10,14,23,0.85)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', width: '360px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
          h('span', { className: 'material-icons-round', style: { padding: '10px 12px', color: '#94a3b8', fontSize: '18px' } }, 'search'),
          h('input', {
            type: 'text', placeholder: 'Search address or owner...',
            style: { flex: '1', border: 'none', outline: 'none', background: 'transparent', color: '#f8fafc', fontSize: '13px', fontWeight: '500', padding: '10px 12px 10px 0', fontFamily: 'Inter, sans-serif' },
            value: filterText,
            onInput: (e) => { filterText = e.target.value; updateMarkers(); }
          })
        ),
        h('div', { style: { background: 'rgba(10,14,23,0.85)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', color: '#FDB927', fontSize: '12px', fontWeight: '800', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' } },
          'Showing ' + filtered.length + ' of ' + parcels.length + ' parcels'
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
            farmFilterBtn('ALL', 'All Parcels', '#f8fafc', parcels.length),
            farmFilterBtn('confirmed-farm', FARM_CLASS['confirmed-farm'].label, FARM_CLASS['confirmed-farm'].color, classCount['confirmed-farm']),
            farmFilterBtn('likely-farm', FARM_CLASS['likely-farm'].label, FARM_CLASS['likely-farm'].color, classCount['likely-farm']),
            farmFilterBtn('potential-farm', FARM_CLASS['potential-farm'].label, FARM_CLASS['potential-farm'].color, classCount['potential-farm']),
            farmFilterBtn('non-agricultural', FARM_CLASS['non-agricultural'].label, FARM_CLASS['non-agricultural'].color, classCount['non-agricultural']),
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
          secTitle('Pre-Analyzed Portfolio'),
          stat('Confirmed Farms', String(classCount['confirmed-farm']), '#2E7D32'),
          stat('Likely Farms', String(classCount['likely-farm']), '#4CAF50'),
          stat('Potential Farms', String(classCount['potential-farm']), '#FFC107'),
          stat('Farm Acreage', farmAcres.toLocaleString() + ' ac', '#4CAF50'),
          stat('Total Acreage', totalAcres.toLocaleString() + ' ac', '#f8fafc'),
          divider(),
          stat('High Priority', String(highCount), '#e53e3e'),
          stat('Medium Priority', String(medCount), '#f6ad55'),
          stat('Low / OK', String(lowCount), '#48bb78'),
          divider(),
          h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0' } },
            h('span', { style: { fontSize: '12px', fontWeight: '600', color: '#94a3b8' } }, 'EQIP Potential'),
            h('span', { style: { fontSize: '15px', fontWeight: '900', color: '#FDB927' } }, '$' + totalFunding.toLocaleString())
          ),
          divider(),
          secTitle('Priority Key'),
          legendDot('#e53e3e', 'High — 3+ resource concerns'),
          legendDot('#f6ad55', 'Medium — 1-2 concerns'),
          legendDot('#48bb78', 'Low — assessed OK')
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
  function stat(label, value, color) {
    return h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' } },
      h('span', { style: { fontSize: '11px', color: '#94a3b8' } }, label),
      h('span', { style: { fontSize: '12px', fontWeight: '800', color: color } }, value)
    );
  }
  function legendDot(color, label) {
    return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' } },
      h('div', { style: { width: '10px', height: '10px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.3)', flexShrink: '0' } }),
      h('span', { style: { fontSize: '10px', color: '#cbd5e1' } }, label)
    );
  }
  function criteriaRow(icon, label, color) {
    return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' } },
      h('span', { className: 'material-icons-round', style: { fontSize: '13px', color: color } }, icon),
      h('span', { style: { fontSize: '10px', color: '#cbd5e1' } }, label)
    );
  }
  function farmFilterBtn(key, label, color, count) {
    var isActive = farmFilter === key;
    return h('button', {
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        padding: '6px 8px', marginBottom: '3px', borderRadius: '8px', border: 'none',
        background: isActive ? color + '25' : 'transparent',
        cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
      },
      onclick: function() { farmFilter = key; updateMarkers(); }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('div', { style: { width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: '0' } }),
        h('span', { style: { fontSize: '11px', fontWeight: isActive ? '800' : '500', color: isActive ? color : '#94a3b8' } }, label)
      ),
      h('span', { style: { fontSize: '11px', fontWeight: '800', color: isActive ? color : '#64748b' } }, String(count))
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

  /* ── Map Init (force fresh — DOM gets wiped by render()) ── */
  var realParcelLayer = null;
  var lastBbox = null;
  var isFetchingParcels = false;

  function initMap() {
    var container = document.getElementById('nc-farm-map');
    if (!container) { console.error('[NCSmall Map] No #nc-farm-map container'); return; }
    if (!window.L) { console.error('[NCSmall Map] Leaflet not loaded'); return; }

    if (mapInstance) { try { mapInstance.remove(); } catch(e) {} mapInstance = null; }

    mapInstance = L.map(container, { zoomControl: false, attributionControl: false }).setView([36.07, -79.79], 14);
    window._ncMapInstance = mapInstance;

    // Clean satellite
    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 21 }).addTo(mapInstance);
    // Faded road labels
    L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', { maxZoom: 21, opacity: 0.4 }).addTo(mapInstance);

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
    parcelPolygonGroup = L.layerGroup().addTo(mapInstance);
    markerGroup = L.layerGroup().addTo(mapInstance);

    // Fetch real parcels on map move (AVA methodology)
    mapInstance.on('moveend', fetchRealParcels);
    mapInstance.on('zoomend', fetchRealParcels);

    updateMarkers();
    setTimeout(function() {
      if (mapInstance) {
        mapInstance.invalidateSize();
        fetchRealParcels();  // initial load
      }
    }, 400);
  }

  /* ── Fetch REAL parcel polygons from gis-proxy (AVA pattern) ── */
  function fetchRealParcels() {
    if (!mapInstance || isFetchingParcels) return;
    var zoom = mapInstance.getZoom();
    if (zoom < 14) {
      // Too zoomed out — show toast and clear real parcels
      if (realParcelLayer) { mapInstance.removeLayer(realParcelLayer); realParcelLayer = null; }
      showToast('Zoom in to load parcel boundaries', 'info');
      return;
    }

    var bounds = mapInstance.getBounds();
    var bbox = bounds.getWest().toFixed(6) + ',' + bounds.getSouth().toFixed(6) + ',' +
               bounds.getEast().toFixed(6) + ',' + bounds.getNorth().toFixed(6);

    // Skip if same bbox
    if (bbox === lastBbox) return;
    lastBbox = bbox;
    isFetchingParcels = true;
    showToast('Loading parcels...', 'info');

    fetch('/.netlify/functions/gis-proxy?service=parcels&bbox=' + bbox)
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(geojson) {
        if (realParcelLayer) { mapInstance.removeLayer(realParcelLayer); }
        if (!geojson || !geojson.features || !geojson.features.length) {
          showToast('No parcels in this area', 'info');
          return;
        }
        realParcelLayer = L.geoJSON(geojson, {
          style: {
            color: '#FDB927',
            weight: 2,
            fillColor: 'rgba(253,185,39,0.08)',
            fillOpacity: 0.08,
            opacity: 0.9
          },
          onEachFeature: function(feature, layer) {
            var p = feature.properties || {};
            var owner = p.owner || p.ownname || p.OWNER_NAME || p.OWNER || 'Unknown';
            var addr = p.mailadd || p.siteadd || p.SITUS_ADDRESS || p.SITE_ADDR || '';
            var acres = p.GISACRES || p.gisacres || p.acres || '';
            var landUse = p.usedesc || p.parusedesc || p.LAND_USE || '';
            var pin = p.parcelnumb || p.parno || p.PARCEL_ID || p.PIN || '';

            var popup = '<div style="min-width:220px;font-family:Inter,sans-serif;padding:4px;">'
              + '<div style="font-weight:900;color:#004684;font-size:14px;margin-bottom:2px;">' + owner + '</div>'
              + (addr ? '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">' + addr + '</div>' : '')
              + (pin ? '<div style="font-size:10px;color:#64748b;margin-bottom:6px;">PIN: ' + pin + '</div>' : '')
              + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px;">'
              + (acres ? '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Acreage</div><div style="font-weight:800;font-size:14px;">' + parseFloat(acres).toFixed(2) + ' ac</div></div>' : '')
              + (landUse ? '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Land Use</div><div style="font-size:11px;font-weight:600;">' + landUse + '</div></div>' : '')
              + '</div>'
              + '</div>';
            layer.bindPopup(popup, { maxWidth: 280 });

            // Highlight on hover
            layer.on('mouseover', function() {
              this.setStyle({ weight: 4, fillOpacity: 0.25, color: '#FFD700' });
            });
            layer.on('mouseout', function() {
              this.setStyle({ weight: 2, fillOpacity: 0.08, color: '#FDB927' });
            });
          }
        }).addTo(mapInstance);

        showToast(geojson.features.length + ' parcels loaded', 'success');
      })
      .catch(function(err) {
        console.warn('[NCSmall Map] Parcel fetch failed:', err.message);
        showToast('Parcel data unavailable — try again', 'warn');
      })
      .finally(function() { isFetchingParcels = false; });
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

  /* ── Demo parcel markers (priority dots + popups) ────────── */
  function updateMarkers() {
    if (!mapInstance || !markerGroup) return;
    markerGroup.clearLayers();

    var parcels = window.DEMO_PARCELS || [];
    var q = filterText.toLowerCase();

    parcels.forEach(function(p) {
      if (q && !p.address.toLowerCase().includes(q) && !p.owner.toLowerCase().includes(q)) return;
      if (farmFilter !== 'ALL' && p.farmClass !== farmFilter) return;

      var fc = FARM_CLASS[p.farmClass] || FARM_CLASS['non-agricultural'];
      var zColor = ZONING_COLORS[p.zoning] || '#94a3b8';

      var dotColor = '#48bb78';
      if (p.priorityLevel === 'high')   dotColor = '#e53e3e';
      if (p.priorityLevel === 'medium') dotColor = '#f6ad55';

      // Priority dot (no fake polygon — real parcels come from GIS)
      var centerMarker = L.circleMarker([p.lat, p.lon], {
        radius: 10, fillColor: dotColor, color: '#fff',
        weight: 2.5, opacity: 1, fillOpacity: 0.9
      });

      var badges = [];
      if (p.bonaFideFarm) badges.push('<span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;background:#2E7D3222;color:#2E7D32;border:1px solid #2E7D3244;">✓ Bona Fide Farm</span>');
      if (p.vadEnrolled && p.vadEnrolled !== 'none') badges.push('<span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;background:#4CAF5022;color:#4CAF50;border:1px solid #4CAF5044;">' + p.vadEnrolled + ' Enrolled</span>');
      if (p.pvuStatus) badges.push('<span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:700;background:#FFC10722;color:#F57F17;border:1px solid #FFC10744;">PVU Tax</span>');

      var popup = '<div style="min-width:250px;font-family:Inter,sans-serif;padding:4px;">'
        + '<div style="font-weight:900;color:#004684;font-size:15px;margin-bottom:2px;">' + p.owner + '</div>'
        + '<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">' + p.address + '</div>'
        + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">'
        + '<span style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;background:' + fc.color + '22;color:' + fc.color + ';border:1px solid ' + fc.color + '44;">' + fc.label + '</span>'
        + '<span style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;background:' + zColor + '22;color:' + zColor + ';border:1px solid ' + zColor + '44;">' + p.zoning + ' — ' + (p.zoningDesc || '') + '</span>'
        + '</div>'
        + (badges.length ? '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">' + badges.join('') + '</div>' : '')
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">'
        + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Acreage</div><div style="font-weight:800;font-size:14px;">' + p.acreage + ' ac</div></div>'
        + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">EQIP Est.</div><div style="font-weight:800;font-size:14px;color:#3B7A57;">' + p.eqipEstimate + '</div></div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">'
        + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Soil</div><div style="font-size:11px;font-weight:600;">' + p.soilType + '</div></div>'
        + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Slope</div><div style="font-size:11px;font-weight:600;">' + p.slopePct + '</div></div>'
        + '</div>'
        + '<div style="margin-bottom:8px;"><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Land Use</div><div style="font-size:11px;font-weight:600;color:#4CAF50;">' + (p.landUse || 'Agricultural') + '</div></div>'
        + '<div style="margin-bottom:8px;"><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Resource Concerns</div><div style="font-size:11px;color:#e53e3e;font-weight:600;line-height:1.5;">' + p.concerns.join('<br>') + '</div></div>'
        + '<button onclick="window.selectParcelAndAssess(\'' + p.id + '\')" style="width:100%;padding:11px;background:linear-gradient(135deg,#004684,#003366);color:white;border:none;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;font-family:Inter,sans-serif;letter-spacing:0.03em;box-shadow:0 4px 12px rgba(0,70,132,0.3);">VIEW FULL ASSESSMENT</button>'
        + '</div>';

      centerMarker.bindPopup(popup, { maxWidth: 320 });
      markerGroup.addLayer(centerMarker);
    });
  }

  window.selectParcelAndAssess = function(id) {
    var parcel = (window.DEMO_PARCELS || []).find(function(p) { return p.id === id; });
    if (parcel && window.st) {
      window.st.selectedParcel = parcel;
      mapInstance = null;
      markerGroup = null;
      parcelPolygonGroup = null;
      window.setView('farm-assessment');
    }
  };

})();

