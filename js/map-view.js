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

  // Layer references for toggle controls
  let satelliteLayer = null;
  let labelsLayer = null;
  let farmPinsLayer = null;
  let parcelsVisible = true;
  let labelsVisible = true;
  let farmPinData = []; // cached farm centroids for wide-zoom pins
  let directoryVisible = false;
  let directorySearchText = '';
  let totalDynamicFarmCount = 0;
  let totalDynamicFarmAcres = 0;

  /* ── Farm Classification from land use ────────────────────── */
  const FARM_CLASS = {
    'confirmed-farm':   { color: '#1B5E20', fill: 'rgba(27,94,32,0.22)',   label: 'Confirmed Farm' },
    'likely-farm':      { color: '#00838F', fill: 'rgba(0,131,143,0.18)',  label: 'Likely Farm' },
    'potential-farm':   { color: '#E65100', fill: 'rgba(230,81,0,0.18)',   label: 'Potential Farm' },
    'non-agricultural': { color: '#78909C', fill: 'rgba(120,144,156,0.08)', label: 'Non-Agricultural' }
  };

  function classifyParcel(landUse, acres, useCode) {
    var lu = (landUse || '').toUpperCase().trim();
    var code = (useCode || '').toUpperCase().trim();
    var numCode = parseInt(code) || parseInt(lu);
    var ac = parseFloat(acres) || 0;

    // ── NC Property Tax Use Codes (numeric) ──────────────────
    // 600-699 = Agricultural, 700-799 = Forest/Timber
    if (numCode >= 600 && numCode < 800) return 'confirmed-farm';

    // ── Text-based: explicitly agricultural ──────────────────
    if (lu.includes('AGRI') || lu.includes('FARM') || lu.includes('CROP') ||
        lu.includes('DAIRY') || lu.includes('LIVESTOCK') || lu.includes('ORCHARD') ||
        lu.includes('TIMBER') || lu.includes('FOREST') || lu.includes('HORTI') ||
        lu.includes('NURSERY') || lu.includes('POULTRY') || lu.includes('RANCH') ||
        lu.includes('PASTURE') || lu.includes('GRAZING') || lu.includes('TOBACCO') ||
        lu.includes('HAY') || lu.includes('GRAIN') || lu.includes('CATTLE') ||
        lu.includes('SWINE') || lu.includes('EQUINE') || lu.includes('HORSE') ||
        lu.includes('AQUA') || lu.includes('VINEYARD') || lu.includes('GARDEN') ||
        lu.includes('COTTON') || lu.includes('SOD') || lu.includes('GOAT') ||
        code.includes('AGRI') || code.includes('FARM') || code.includes('CROP') ||
        code.includes('TIMBER') || code.includes('FOREST')) {
      return 'confirmed-farm';
    }

    // ── Likely: rural/agricultural zoning + meaningful acreage ─
    var isAgZoned = lu.includes('RURAL') || lu.includes('R-A') || lu.includes('AG ') ||
        lu === 'AG' || lu.startsWith('AG-') ||
        code.includes('RURAL') || code.includes('AG');
    if (isAgZoned) return 'likely-farm';

    // ── EXCLUSION: land uses that are NEVER farms ─────────────
    // Must check BEFORE acreage rules to prevent false positives
    var isDefinitelyNotFarm =
        lu.includes('INSTIT') || lu.includes('COLLEGE') || lu.includes('SCHOOL') ||
        lu.includes('UNIVER') || lu.includes('CHURCH') || lu.includes('WORSHIP') ||
        lu.includes('HOSPITAL') || lu.includes('MEDICAL') || lu.includes('CLINIC') ||
        lu.includes('COMMER') || lu.includes('RETAIL') || lu.includes('OFFICE') ||
        lu.includes('SHOP') || lu.includes('STORE') || lu.includes('MALL') ||
        lu.includes('INDUST') || lu.includes('MANUFAC') || lu.includes('WAREHOUSE') ||
        lu.includes('APART') || lu.includes('MULTI') || lu.includes('CONDO') ||
        lu.includes('TOWNHO') || lu.includes('DUPLEX') || lu.includes('TRIPLEX') ||
        lu.includes('GOVERN') || lu.includes('PUBLIC') || lu.includes('MUNICI') ||
        lu.includes('CITY') || lu.includes('COUNTY') || lu.includes('STATE') ||
        lu.includes('FEDERAL') || lu.includes('CEMETERY') || lu.includes('PARK') ||
        lu.includes('GOLF') || lu.includes('RECREATION') || lu.includes('UTILITY') ||
        lu.includes('HOTEL') || lu.includes('MOTEL') || lu.includes('LODGE') ||
        lu.includes('PARKING') || lu.includes('EASEMENT') || lu.includes('RIGHT') ||
        lu.includes('MINING') || lu.includes('QUARRY') ||
        // NC numeric use codes: 300-399=Commercial, 400-499=Industrial, 800-899=Institutional
        (numCode >= 300 && numCode < 600) || (numCode >= 800);
    if (isDefinitelyNotFarm) return 'non-agricultural';

    // ── Likely: large parcels (10+ acres) in residential/vacant ─
    // In rural NC, 10+ acres of residential is almost always agricultural
    if (ac >= 10 && (lu.includes('RESID') || lu.includes('VACANT') || lu.includes('SINGLE') ||
        lu.includes('OPEN') || lu.includes('UNDEV') ||
        lu === '' || lu === 'UNKNOWN')) {
      return 'likely-farm';
    }

    // ── Potential: 5+ acre parcels with residential/vacant use ─
    if (ac >= 5 && (lu.includes('RESID') || lu.includes('VACANT') || lu.includes('SINGLE') ||
        lu.includes('OPEN') || lu.includes('UNDEV') || lu.includes('EXEMPT') ||
        lu === '' || lu === 'UNKNOWN')) {
      return 'potential-farm';
    }

    return 'non-agricultural';
  }

  /* ── Bona Fide Farm Eligibility Classifier (NCGS 153A-340) ── */
  function bonaFideEligibility(acres, landUse, zoning, miscImprovements, deferredValue) {
    var ac = parseFloat(acres) || 0;
    var lu = (landUse || '').toUpperCase();
    var zn = (zoning || '').toUpperCase();
    var misc = (miscImprovements || '').toUpperCase();
    var hasDeferral = deferredValue && Number(deferredValue) > 0;

    // Farm structures = strong indicator
    var hasFarmStructure = misc.indexOf('BARN') >= 0 || misc.indexOf('SILO') >= 0 ||
      misc.indexOf('GREENHOUSE') >= 0 || misc.indexOf('STABLE') >= 0 ||
      misc.indexOf('POULTRY') >= 0 || misc.indexOf('GRAIN') >= 0 ||
      misc.indexOf('DAIRY') >= 0 || misc.indexOf('EQUIP') >= 0;

    // Ag zoning
    var isAgZoned = zn.indexOf('AG') >= 0 || zn.indexOf('R-A') >= 0 ||
      zn.indexOf('RURAL') >= 0 || lu.indexOf('AGRI') >= 0 ||
      lu.indexOf('FARM') >= 0 || lu.indexOf('CROP') >= 0;

    // ── Classification thresholds per NCGS ──
    var classes = [];
    if (ac >= 10) classes.push('Agricultural (10+ ac)');
    if (ac >= 5)  classes.push('Horticultural (5+ ac)');
    if (ac >= 20) classes.push('Forest (20+ ac)');

    // Score: higher = more likely eligible
    var score = 0;
    if (classes.length > 0) score += 2;
    if (isAgZoned)          score += 2;
    if (hasFarmStructure)   score += 2;
    if (hasDeferral)        score += 3;

    // Additional: if already classified as farm by our classifier
    if (lu.indexOf('FARM') >= 0 || lu.indexOf('AGRI') >= 0 || lu.indexOf('CROP') >= 0 ||
        lu.indexOf('TIMBER') >= 0 || lu.indexOf('FOREST') >= 0) score += 2;

    if (score >= 6) return { level: 'likely', label: 'Likely Eligible', color: '#2E7D32', icon: 'verified', classes: classes };
    if (score >= 3 && classes.length > 0) return { level: 'potential', label: 'Potentially Eligible', color: '#E65100', icon: 'help_outline', classes: classes };
    if (ac >= 5) return { level: 'review', label: 'May Qualify — Review Needed', color: '#1565C0', icon: 'info', classes: classes };
    return { level: 'ineligible', label: 'Below Acreage Threshold', color: '#78909C', icon: 'block', classes: [] };
  }

  /* ── Main Render ─────────────────────────────────────────── */
  window.renderMapView = function() {
    setTimeout(() => initMap(), 80);

    return h('div', { style: { position: 'relative', width: '100%', height: 'calc(100vh - 64px)' } },

      // Map container
      h('div', { id: 'nc-farm-map', style: { width: '100%', height: '100%', zIndex: '1' } }),

      // ── Top: Search ──
      h('div', { style: { position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: '1000', display: 'flex', gap: '8px', alignItems: 'center' } },
        h('div', { style: { display: 'flex', alignItems: 'center', background: 'rgba(10,14,23,0.85)', backdropFilter: 'blur(12px)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
          h('span', { className: 'material-icons-round', style: { padding: '10px 12px', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' },
            onclick: () => { if (filterText.trim()) geocodeAddress(filterText); }
          }, 'search'),
          h('input', {
            id: 'nc-search-input',
            type: 'text', placeholder: 'Search address, owner, or PIN...',
            style: { flex: '1', border: 'none', outline: 'none', background: 'transparent', color: '#f8fafc', fontSize: '13px', fontWeight: '500', padding: '10px 12px 10px 0', fontFamily: 'Inter, sans-serif' },
            value: filterText,
            onInput: (e) => { filterText = e.target.value; },
            onKeyDown: (e) => { if (e.key === 'Enter' && filterText.trim()) geocodeAddress(filterText); }
          })
        )
      ),



      // ── Left: Farm Directory Toggle Button ──
      h('button', {
        id: 'directory-toggle-btn',
        onclick: () => { directoryVisible = !directoryVisible; toggleDirectoryPanel(); },
        style: { position: 'absolute', top: '56px', left: '12px', zIndex: '1001', background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }
      },
        h('span', { className: 'material-icons-round', style: { fontSize: '16px', color: '#4CAF50' } }, 'list'),
        'Farm Directory'
      ),

      // ── Left: Farm Directory Panel ──
      h('div', { id: 'farm-directory-panel', className: 'farm-directory-panel collapsed' },
        h('div', { className: 'farm-directory-header' },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            h('div', { style: { fontSize: '12px', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Farm Directory'),
            h('button', {
              onclick: () => { directoryVisible = false; toggleDirectoryPanel(); },
              style: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }
            }, h('span', { className: 'material-icons-round', style: { fontSize: '18px' } }, 'close'))
          ),
          h('div', { id: 'directory-farm-stats', style: { display: 'flex', gap: '12px', marginTop: '6px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
              h('span', { className: 'material-icons-round', style: { fontSize: '13px', color: '#4CAF50' } }, 'agriculture'),
              h('span', { id: 'dash-farm-count', style: { fontSize: '12px', fontWeight: '800', color: '#4CAF50' } }, '—'),
              h('span', { style: { fontSize: '9px', color: '#94a3b8' } }, 'farms')
            ),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
              h('span', { className: 'material-icons-round', style: { fontSize: '13px', color: '#FDB927' } }, 'straighten'),
              h('span', { id: 'dash-total-acres', style: { fontSize: '12px', fontWeight: '800', color: '#FDB927' } }, '—'),
              h('span', { style: { fontSize: '9px', color: '#94a3b8' } }, 'acres')
            ),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
              h('span', { style: { fontSize: '9px', color: '#64748b' } }, 'avg'),
              h('span', { id: 'dash-avg-size', style: { fontSize: '11px', fontWeight: '700', color: '#cbd5e1' } }, '—')
            )
          ),
          h('div', { className: 'farm-directory-search', style: { marginTop: '8px' } },
            h('span', { className: 'material-icons-round', style: { padding: '6px 8px', color: '#64748b', fontSize: '16px' } }, 'search'),
            h('input', {
              id: 'directory-search-input',
              type: 'text', placeholder: 'Filter by owner, address, type...',
              onInput: (e) => { directorySearchText = e.target.value; renderDirectoryList(); }
            })
          )
        ),
        h('div', { id: 'farm-directory-list', className: 'farm-directory-list' })
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
            farmFilterBtn('confirmed-farm', 'Confirmed Farm', '#1B5E20', '—'),
            farmFilterBtn('likely-farm', 'Likely Farm', '#00838F', '—'),
            farmFilterBtn('potential-farm', 'Potential Farm', '#E65100', '—'),
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
  var activeClassFilter = 'ALL'; // current farm class filter

  function farmFilterBtn(key, label, color, count) {
    var isActive = activeClassFilter === key;
    return h('button', {
      'data-farm-class': key,
      style: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
        padding: '6px 8px', marginBottom: '3px', borderRadius: '8px', border: 'none',
        background: isActive ? color + '22' : 'transparent',
        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        borderLeft: isActive ? '3px solid ' + color : '3px solid transparent',
        transition: 'all 0.2s'
      },
      onclick: function() {
        activeClassFilter = (activeClassFilter === key) ? 'ALL' : key;
        applyClassFilter();
        // Update button visuals without full re-render (which kills popups)
        document.querySelectorAll('[data-farm-class]').forEach(function(btn) {
          var k = btn.getAttribute('data-farm-class');
          var active = (k === activeClassFilter);
          btn.style.background = active ? 'rgba(255,255,255,0.1)' : 'transparent';
          btn.style.borderLeft = active ? '3px solid currentColor' : '3px solid transparent';
          var lbl = btn.querySelector('span:nth-child(1) > span:nth-child(2)');
          if (lbl) { lbl.style.fontWeight = active ? '700' : '500'; lbl.style.color = active ? '#f8fafc' : '#94a3b8'; }
        });
      },
      onmouseenter: function() { if (!isActive) this.style.background = 'rgba(255,255,255,0.05)'; },
      onmouseleave: function() { if (!isActive) this.style.background = 'transparent'; }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('div', { style: { width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: '0', border: '2px solid ' + color + '88' } }),
        h('span', { style: { fontSize: '11px', fontWeight: isActive ? '700' : '500', color: isActive ? '#f8fafc' : '#94a3b8' } }, label)
      ),
      h('span', { className: 'fc-count', style: { fontSize: '11px', fontWeight: '800', color: color } }, String(count))
    );
  }

  // Apply visual filter: highlight matching class, dim others
  function applyClassFilter() {
    if (!realParcelLayer) return;
    realParcelLayer.eachLayer(function(layer) {
      var cls = layer._ncClass || 'non-agricultural';
      var fc = FARM_CLASS[cls] || FARM_CLASS['non-agricultural'];
      if (activeClassFilter === 'ALL') {
        // Show all normally
        layer.setStyle({ fillOpacity: cls === 'non-agricultural' ? 0.05 : 0.25, opacity: 0.6, weight: 1.5 });
      } else if (cls === activeClassFilter) {
        // Highlight matching
        layer.setStyle({ fillOpacity: 0.5, opacity: 1, weight: 3, color: fc.color, fillColor: fc.color });
      } else {
        // Dim non-matching
        layer.setStyle({ fillOpacity: 0.02, opacity: 0.15, weight: 0.5 });
      }
    });
  }
  function layerDot(label, icon, color, active) {
    return h('div', { 'data-layer-name': label, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px', cursor: 'pointer' },
      onclick: function(e) {
        var dot = e.currentTarget.querySelector('.ldot');
        var iconEl = e.currentTarget.querySelector('.material-icons-round');
        var labelEl = e.currentTarget.querySelectorAll('span')[1];
        if (!dot) return;
        var isOn = dot.style.background !== 'transparent';
        // Toggle visual
        dot.style.background = isOn ? 'transparent' : color;
        dot.style.borderColor = isOn ? '#475569' : color;
        if (iconEl) iconEl.style.color = isOn ? '#475569' : color;
        if (labelEl) labelEl.style.color = isOn ? '#64748b' : '#e2e8f0';
        // Toggle actual layer
        toggleLayer(label, !isOn);
      }
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('span', { className: 'material-icons-round', style: { fontSize: '14px', color: active ? color : '#475569' } }, icon),
        h('span', { style: { fontSize: '11px', fontWeight: '500', color: active ? '#e2e8f0' : '#64748b' } }, label)
      ),
      h('div', { className: 'ldot', style: { width: '12px', height: '12px', borderRadius: '50%', background: active ? color : 'transparent', border: '2px solid ' + (active ? color : '#475569'), transition: 'all 0.2s', flexShrink: '0' } })
    );
  }

  // GIS Layer cache + references
  var gisLayers = {};  // name → L.geoJSON layer
  var gisLayerCache = {}; // name → geojson data
  var gisLayerLoading = {}; // name → boolean

  // Layer config: maps UI name → proxy service + styling
  var GIS_LAYER_CONFIG = {
    'Soils (SSURGO)':        { service: 'soils',      color: '#4CAF50', fillOpacity: 0.25, weight: 1 },
    'Zoning':                { service: 'zoning',     color: '#AB47BC', fillOpacity: 0.20, weight: 1.5 },
    'Overlay Districts':     { service: 'overlay',    color: '#5C6BC0', fillOpacity: 0.18, weight: 1.5 },
    'Future Land Use':       { service: 'futurelu',   color: '#F57F17', fillOpacity: 0.22, weight: 1 },
    'Water Bodies & Streams':{ service: 'hydrology',  color: '#1E88E5', fillOpacity: 0.35, weight: 2 },
    'Flood Zones':           { service: 'floodplain', color: '#2196F3', fillOpacity: 0.25, weight: 1.5 },
    'Wetlands (NWI)':        { service: 'wetlands',   color: '#00897B', fillOpacity: 0.30, weight: 1 },
    'Building Footprints':   { service: 'buildings',  color: '#FF6B35', fillOpacity: 0.35, weight: 1.5 },
    'Elevation (DEM)':       { service: 'contours',   color: '#66BB6A', fillOpacity: 0,    weight: 1.5 }
  };

  // Earth Engine tile layers (slope, aspect)
  var EE_TILE_CONFIG = {
    'Slope Analysis': { layer: 'slope',  opacity: 0.6 },
    'Sun Exposure':   { layer: 'aspect', opacity: 0.6 }
  };
  var eeTileLayers = {}; // name → L.tileLayer
  var eeTileLoading = {};

  function toggleEETileLayer(name, show) {
    var config = EE_TILE_CONFIG[name];
    if (!config) return;
    if (!show) {
      if (eeTileLayers[name]) { mapInstance.removeLayer(eeTileLayers[name]); }
      return;
    }
    if (eeTileLayers[name]) { eeTileLayers[name].addTo(mapInstance); return; }
    if (eeTileLoading[name]) return;

    eeTileLoading[name] = true;
    showToast('Loading ' + name + ' (Earth Engine)...', 'info');

    var bounds = mapInstance.getBounds();
    var bbox = bounds.getWest().toFixed(6) + ',' + bounds.getSouth().toFixed(6) + ',' + bounds.getEast().toFixed(6) + ',' + bounds.getNorth().toFixed(6);

    fetch('/.netlify/functions/ee-proxy?layer=' + config.layer + '&bbox=' + bbox)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        eeTileLoading[name] = false;
        if (data.error) {
          showToast(name + ': ' + (data.message || data.error), 'warn');
          return;
        }
        if (data.tileUrl) {
          eeTileLayers[name] = L.tileLayer(data.tileUrl, { opacity: config.opacity, maxZoom: 18 }).addTo(mapInstance);
          showToast(name + ' loaded', 'success');
        }
      })
      .catch(function(err) {
        eeTileLoading[name] = false;
        showToast(name + ' failed — ' + err.message, 'warn');
      });
  }

  function toggleLayer(name, show) {
    if (!mapInstance) return;
    switch(name) {
      case 'Clean Satellite':
        labelsVisible = !show;
        if (show && labelsLayer) { mapInstance.removeLayer(labelsLayer); }
        if (!show && labelsLayer) { labelsLayer.addTo(mapInstance); }
        break;
      case 'Parcels':
        parcelsVisible = show;
        if (show && realParcelLayer) { realParcelLayer.addTo(mapInstance); }
        if (!show && realParcelLayer) { mapInstance.removeLayer(realParcelLayer); }
        if (show && farmPinsLayer) { farmPinsLayer.addTo(mapInstance); }
        if (!show && farmPinsLayer) { mapInstance.removeLayer(farmPinsLayer); }
        break;
      default:
        // Check if it's a real GIS layer (GeoJSON)
        if (GIS_LAYER_CONFIG[name]) {
          toggleGISLayer(name, show);
        // Check if it's an Earth Engine tile layer
        } else if (EE_TILE_CONFIG[name]) {
          toggleEETileLayer(name, show);
        } else {
          showToast(name + ' — coming soon', 'info');
        }
        break;
    }
  }

  function toggleGISLayer(name, show) {
    var config = GIS_LAYER_CONFIG[name];
    if (!config) return;

    // If hiding, just remove
    if (!show) {
      if (gisLayers[name]) {
        mapInstance.removeLayer(gisLayers[name]);
      }
      return;
    }

    // If already loaded, just add back
    if (gisLayers[name]) {
      gisLayers[name].addTo(mapInstance);
      return;
    }

    // If already loading, skip
    if (gisLayerLoading[name]) return;

    // Fetch from proxy
    gisLayerLoading[name] = true;
    showToast('Loading ' + name + '...', 'info');

    var bounds = mapInstance.getBounds();
    var bbox = bounds.getWest().toFixed(6) + ',' + bounds.getSouth().toFixed(6) + ',' + bounds.getEast().toFixed(6) + ',' + bounds.getNorth().toFixed(6);

    fetch('/.netlify/functions/gis-proxy?service=' + config.service + '&bbox=' + bbox)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        gisLayerLoading[name] = false;
        if (data.error) {
          showToast(name + ': ' + (data.message || data.error), 'warn');
          return;
        }
        if (!data.features || data.features.length === 0) {
          showToast(name + ': No data in view — try zooming in', 'warn');
          return;
        }

        gisLayerCache[name] = data;

        // Build label field for tooltips
        gisLayers[name] = L.geoJSON(data, {
          style: function(feature) {
            var fillColor = config.color;
            var p = feature.properties || {};

            // Soils: color by drainage class — brown/earth tones
            if (name === 'Soils (SSURGO)' && p.drclassdcd) {
              var dc = (p.drclassdcd || '').toLowerCase();
              if (dc.indexOf('excessively') >= 0)          fillColor = '#D7CCC8'; // pale sand — drains too fast
              else if (dc.indexOf('well') >= 0 && dc.indexOf('poor') < 0 && dc.indexOf('moderate') < 0) fillColor = '#A1887F'; // warm brown — ideal
              else if (dc.indexOf('moderately well') >= 0) fillColor = '#BCAAA4'; // light brown
              else if (dc.indexOf('somewhat poorly') >= 0) fillColor = '#8D6E63'; // medium brown
              else if (dc.indexOf('poorly') >= 0 && dc.indexOf('very') < 0) fillColor = '#6D4C41'; // dark brown
              else if (dc.indexOf('very poorly') >= 0)     fillColor = '#4E342E'; // deep umber — wetland
              else fillColor = '#90A4AE'; // gray — unknown
            } else if (name === 'Soils (SSURGO)' && p.hydgrpdcd) {
              // Fallback: color by hydrologic group
              var hg = (p.hydgrpdcd || '').toUpperCase();
              if (hg === 'A')      fillColor = '#D7CCC8'; // sandy, fast drain
              else if (hg === 'B') fillColor = '#A1887F'; // moderate
              else if (hg === 'C') fillColor = '#8D6E63'; // slow drain
              else if (hg === 'D') fillColor = '#4E342E'; // clay, very slow
              else                 fillColor = '#90A4AE';
            }

            return {
              color: name === 'Soils (SSURGO)' ? 'rgba(0,0,0,0.3)' : config.color,
              weight: config.weight,
              fillColor: fillColor,
              fillOpacity: name === 'Soils (SSURGO)' ? 0.55 : config.fillOpacity,
              opacity: 0.7
            };
          },
          onEachFeature: function(feature, layer) {
            var p = feature.properties || {};
            var label = buildLayerTooltip(name, p);
            if (label) {
              layer.bindTooltip(label, { sticky: true, className: 'gis-layer-tooltip', direction: 'top' });
            }
          }
        }).addTo(mapInstance);

        showToast(name + ': ' + data.features.length + ' features loaded', 'success');
      })
      .catch(function(err) {
        gisLayerLoading[name] = false;
        showToast(name + ' failed — ' + err.message, 'warn');
      });
  }

  // Build tooltip HTML based on layer type
  function buildLayerTooltip(layerName, p) {
    var html = '<div style="font-family:Inter,sans-serif;min-width:140px;font-size:11px;">';
    switch(layerName) {
      case 'Soils (SSURGO)':
        html += '<b style="color:#2E7D32;">' + (p.musym || p.MUSYM || p.muname || 'Soil Unit') + '</b>';
        if (p.muname || p.MUNAME) html += '<br>' + (p.muname || p.MUNAME);
        if (p.drclassdcd) html += '<br><span style="color:#1565C0;">Drainage: ' + p.drclassdcd + '</span>';
        if (p.hydgrpdcd) html += '<br>Hydro Group: ' + p.hydgrpdcd;
        break;
      case 'Zoning':
        html += '<b style="color:#AB47BC;">' + (p.ZONE_DESC || p.ZONING || p.zone || p.Zone || p.ZONE || p.zonedesc || 'Zone') + '</b>';
        if (p.ZONE_CODE || p.ZONECODE || p.zonecode) html += '<br>Code: ' + (p.ZONE_CODE || p.ZONECODE || p.zonecode);
        break;
      case 'Overlay Districts':
        html += '<b style="color:#5C6BC0;">' + (p.NAME || p.DIST_NAME || p.OVERLAY || p.name || 'Overlay') + '</b>';
        break;
      case 'Future Land Use':
        html += '<b style="color:#F57F17;">' + (p.CATEGORY || p.FLU || p.LANDUSE || p.NAME || p.name || 'Future LU') + '</b>';
        break;
      case 'Water Bodies & Streams':
        html += '<b style="color:#1E88E5;">' + (p.GNIS_NAME || p.NAME || p.name || p.FTYPE || p.ftype || 'Water') + '</b>';
        if (p.FCODE_DESC || p.FTYPE) html += '<br>' + (p.FCODE_DESC || p.FTYPE);
        break;
      case 'Flood Zones':
        html += '<b style="color:#2196F3;">Zone ' + (p.FLD_ZONE || p.ZONE || p.zone || 'N/A') + '</b>';
        if (p.ZONE_SUBTY || p.SFHA_TF) html += '<br>' + (p.ZONE_SUBTY || (p.SFHA_TF === 'T' ? 'Special Flood Hazard' : ''));
        break;
      case 'Wetlands (NWI)':
        html += '<b style="color:#00897B;">' + (p.WETLAND_TYPE || p.ATTRIBUTE || p.attribute || 'Wetland') + '</b>';
        if (p.ACRES || p.Shape_Area) html += '<br>' + parseFloat(p.ACRES || (p.Shape_Area * 0.000247105)).toFixed(1) + ' ac';
        break;
      case 'Building Footprints':
        html += '<b style="color:#FF6B35;">' + (p.name || p.building || 'Building') + '</b>';
        if (p.addr) html += '<br>' + p.addr;
        break;
      case 'Elevation (DEM)':
        html += '<b style="color:#66BB6A;">Contour ' + (p.CONTOURELE || p.contourele || p.ELEV || '') + ' ft</b>';
        if (p.CONTOURTAG || p.contourtag) html += '<br>' + (p.CONTOURTAG || p.contourtag);
        break;
      default:
        html += '<b>' + JSON.stringify(p).substring(0, 100) + '</b>';
    }
    html += '</div>';
    return html;
  }

  /* ── Map Init ── */
  function initMap() {
    var container = document.getElementById('nc-farm-map');
    if (!container) return;
    if (!window.L) return;

    if (mapInstance) { try { mapInstance.remove(); } catch(e) {} mapInstance = null; }

    mapInstance = L.map(container, { zoomControl: false, attributionControl: false }).setView([36.07, -79.79], 13);
    window._ncMapInstance = mapInstance;

    // Store layer refs so toggles can control them
    satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { maxZoom: 21 }).addTo(mapInstance);
    labelsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', { maxZoom: 21, opacity: 0.4 }).addTo(mapInstance);
    // Use MarkerClusterGroup if available, fallback to plain layerGroup
    if (L.markerClusterGroup) {
      farmPinsLayer = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 15
      }).addTo(mapInstance);
    } else {
      farmPinsLayer = L.layerGroup().addTo(mapInstance);
    }

    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
    parcelPolygonGroup = L.layerGroup().addTo(mapInstance);

    // Debounced parcel fetch — prevents glitchy rapid re-fetches during pan/zoom
    var fetchDebounceTimer = null;
    mapInstance.on('moveend', function() {
      // Don't re-fetch parcels while a popup is open (autoPan triggers moveend)
      if (mapInstance._popup && mapInstance._popup.isOpen && mapInstance._popup.isOpen()) return;
      clearTimeout(fetchDebounceTimer);
      fetchDebounceTimer = setTimeout(fetchRealParcels, 300);
    });

    // Show/hide farm pins based on zoom
    mapInstance.on('zoomend', function() {
      updateFarmPinsVisibility();
    });

    setTimeout(function() {
      if (mapInstance) {
        mapInstance.invalidateSize();
        fetchRealParcels();
        fetchDynamicFarms(); // Load farm pins from NC OneMap
      }
    }, 400);
  }

  // Farm pins: show at wide zoom, hide when parcels are visible
  var knownFarmPinsAdded = false;
  var dynamicFarms = []; // populated from proxy farm query

  // Fetch farm parcels from NC OneMap via proxy — covers entire visible area
  function fetchDynamicFarms() {
    if (!mapInstance) return;
    // Use a wide bbox covering Guilford County area
    var bbox = '-80.1,35.9,-79.5,36.25';
    var proxyUrl = '/.netlify/functions/gis-proxy?service=farms&bbox=' + bbox;
    
    fetch(proxyUrl)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.features) { console.warn('[NCSmall Map] No farm features'); return; }
        dynamicFarms = [];
        data.features.forEach(function(f) {
          var p = f.properties || {};
          var geom = f.geometry;
          if (!geom || !geom.coordinates) return;
          
          // Centroids come as Point geometry from proxy
          var lng = geom.coordinates[0];
          var lat = geom.coordinates[1];
          if (!lat || !lng) return;
          
          var addr = p.address || '';
          if (addr && p.city) addr += ', ' + p.city;
          if (!addr) addr = (p.county || 'Guilford') + ' County';
          
          dynamicFarms.push({
            name: p.owner || 'Unknown',
            addr: addr,
            lat: lat, lng: lng,
            acres: p.acres || 0,
            type: p.usedesc || 'Farm',
            pin: p.parno || ''
          });
        });
        
        // Calculate total acreage
        totalDynamicFarmAcres = 0;
        dynamicFarms.forEach(function(f) { totalDynamicFarmAcres += parseFloat(f.acres) || 0; });
        totalDynamicFarmCount = dynamicFarms.length;
        
        console.log('[NCSmall Map] Dynamic farms loaded: ' + totalDynamicFarmCount + ' (' + Math.round(totalDynamicFarmAcres).toLocaleString() + ' acres)');
        showToast(totalDynamicFarmCount.toLocaleString() + ' farms · ' + Math.round(totalDynamicFarmAcres).toLocaleString() + ' acres discovered', 'success');
        updateFarmPinsVisibility();
        updateDashboardBanner();
        renderDirectoryList();
        

      })
      .catch(function(err) {
        console.warn('[NCSmall Map] Farm discovery failed:', err.message);
      });
  }

  function updateFarmPinsVisibility() {
    if (!mapInstance || !farmPinsLayer) return;
    var zoom = mapInstance.getZoom();
    farmPinsLayer.clearLayers();

    // Show dynamic farm pins from NC OneMap query (always visible)
    dynamicFarms.forEach(function(farm) {
      var marker = L.marker([farm.lat, farm.lng], {
        icon: L.divIcon({
          className: 'known-farm-pin',
          html: '<div style="background:#2E7D32;color:white;border-radius:50%;width:' + (zoom >= 14 ? '12' : '24') + 'px;height:' + (zoom >= 14 ? '12' : '24') + 'px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);font-size:12px;cursor:pointer;">'
            + (zoom < 14 ? '<span class="material-icons-round" style="font-size:14px;">eco</span>' : '')
            + '</div>',
          iconSize: zoom >= 14 ? [12, 12] : [24, 24],
          iconAnchor: zoom >= 14 ? [6, 6] : [12, 24]
        })
      });
      var acStr = farm.acres ? parseFloat(farm.acres).toFixed(1) + ' ac' : '';
      var tip = '<div style="font-family:Inter,sans-serif;min-width:180px;">'
        + '<div style="font-weight:900;font-size:13px;color:#2E7D32;">' + farm.name + '</div>'
        + '<div style="font-size:10px;color:#64748b;margin:2px 0;">' + farm.addr + '</div>'
        + '<div style="font-size:10px;font-weight:600;color:#4CAF50;">' + farm.type + (acStr ? ' · ' + acStr : '') + '</div>'
        + (farm.pin ? '<div style="font-size:9px;color:#94a3b8;">PIN: ' + farm.pin + '</div>' : '')
        + '</div>';
      marker.bindTooltip(tip, { direction: 'top', className: 'farm-tooltip', offset: [0, -10] });
      marker.on('click', function() {
        mapInstance.setView([farm.lat, farm.lng], 16);
      });
      farmPinsLayer.addLayer(marker);
    });

  }

  /* ── Address Geocoding (ArcGIS World Geocoder — free) ──── */
  let searchMarker = null;

  function geocodeAddress(query) {
    if (!mapInstance) return;
    showToast('Searching: ' + query + '...', 'info');

    // Bias search to Guilford County, NC area
    var searchUrl = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'
      + '?f=json'
      + '&singleLine=' + encodeURIComponent(query)
      + '&location=-79.79,36.07'  // Guilford County center
      + '&distance=50000'          // 50km search radius
      + '&maxLocations=1'
      + '&outFields=Addr_type,Match_addr,StAddr,City,Region';

    fetch(searchUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.candidates || !data.candidates.length) {
          showToast('No results found for "' + query + '"', 'error');
          return;
        }

        var result = data.candidates[0];
        var lat = result.location.y;
        var lon = result.location.x;
        var matchAddr = result.attributes?.Match_addr || result.address || query;

        // Drop a search pin
        if (searchMarker) { mapInstance.removeLayer(searchMarker); }
        searchMarker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'search-pin',
            html: '<div style="background:#e53e3e;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;"><span class="material-icons-round" style="font-size:18px;">location_on</span></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          })
        }).addTo(mapInstance);
        searchMarker.bindPopup('<div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;">' + matchAddr + '</div>').openPopup();

        // Fly to the location at parcel-visible zoom
        mapInstance.flyTo([lat, lon], 16, { duration: 1.5 });
        showToast('Found: ' + matchAddr, 'success');
      })
      .catch(function(err) {
        console.error('[Geocode]', err);
        showToast('Search failed — try a different address', 'error');
      });
  }

  /* ── Fetch REAL parcel polygons from gis-proxy ── */
  var lastZoomToast = 0;

  function fetchRealParcels() {
    if (!mapInstance || isFetchingParcels) return;
    var zoom = mapInstance.getZoom();
    if (zoom < 12) {
      if (realParcelLayer) { mapInstance.removeLayer(realParcelLayer); realParcelLayer = null; }
      // Only show "zoom in" toast once per 5 seconds to avoid spam
      if (Date.now() - lastZoomToast > 5000) {
        showToast('Zoom in to load parcel boundaries', 'info');
        lastZoomToast = Date.now();
      }
      return;
    }

    var bounds = mapInstance.getBounds();
    var bbox = bounds.getWest().toFixed(6) + ',' + bounds.getSouth().toFixed(6) + ',' +
               bounds.getEast().toFixed(6) + ',' + bounds.getNorth().toFixed(6);

    if (bbox === lastBbox) return;
    lastBbox = bbox;
    isFetchingParcels = true;

    var w = bounds.getWest().toFixed(6);
    var s = bounds.getSouth().toFixed(6);
    var e = bounds.getEast().toFixed(6);
    var n = bounds.getNorth().toFixed(6);

    fetch('/.netlify/functions/gis-proxy?service=parcels&bbox=' + w + ',' + s + ',' + e + ',' + n,
      { signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined })
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(geojson) {
        isFetchingParcels = false;
        if (!geojson || !geojson.features || !geojson.features.length) {
          showToast('No parcels found in this area', 'info');
          return;
        }
        totalRealParcelsInView = geojson.features.length;
        renderParcelGeoJSON(geojson);
        showToast(geojson.features.length + ' parcels loaded', 'success');
      })
      .catch(function(err) {
        isFetchingParcels = false;
        console.warn('[NCSmall Map] Parcel fetch failed:', err.message);
        showToast('Parcel loading failed — try again', 'warn');
      });
  }

  // tryFetchParcels removed — direct single-proxy fetch above handles everything

  function renderParcelGeoJSON(geojson) {
    // Build new layer FIRST, then swap — prevents flash/disappear on pan
    var oldLayer = realParcelLayer;

    // Pre-classify all features once (avoids 3x calls per feature)
    geojson.features.forEach(function(f) {
      var p = f.properties || {};
      var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || '';
      var useCode = p.usecode || p.parusecode || p.LAND_USE_CODE || p.LUSECODE || '';
      var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || p.ACREAGE || p.Acres || p.totalacres || p.TOTALACRES || p.lotsize || (p.Shape_Area ? (p.Shape_Area * 0.000247105).toFixed(2) : null) || (p.SHAPE_AREA ? (p.SHAPE_AREA * 0.000247105).toFixed(2) : null) || '0';
      f._ncClass = classifyParcel(landUse, acres, useCode);
    });

    var classCounts = { 'confirmed-farm': 0, 'likely-farm': 0, 'potential-farm': 0, 'non-agricultural': 0 };
    var farmAcres = 0;

    realParcelLayer = L.geoJSON(geojson, {
      style: function(feature) {
        var cls = feature._ncClass;
        var fc = FARM_CLASS[cls];
        if (cls === 'non-agricultural') {
          return { color: '#78909C', weight: 0.8, fillColor: '#78909C', fillOpacity: 0.03, opacity: 0.3 };
        }
        return {
          color: '#FDB927',
          weight: 2.5,
          fillColor: fc.color,
          fillOpacity: 0.4,
          opacity: 0.9
        };
      },
      onEachFeature: function(feature, layer) {
        var p = feature.properties || {};
        var cls = feature._ncClass;
        var fc = FARM_CLASS[cls];

        // Broad field name search
        var owner = p.owner || p.ownname || p.OWNER_NAME || p.OWNER || p.OWNERNM || p.ownname1 || p.OWNER1 || p.owname || p.OWN_NAME || 'Unknown Owner';
        var pin = p.parcelnumb || p.parno || p.PARCEL_ID || p.PIN || p.PARID || p.pin || p.pid || p.PID || p.parcel_id || '';
        var county = p.cntyname || p.COUNTY || p.county || '';
        
        // Address: check proxy-assembled 'address' FIRST, then try raw fields
        var addr = p.address || p.siteadd || p.mailadd || '';
        if (!addr || !String(addr).trim() || addr === 'null') {
          // Build from site address components (NC OneMap fields)
          var parts = [];
          if (p.saddno) parts.push(String(p.saddno).trim());
          if (p.saddstname) parts.push(String(p.saddstname).trim());
          if (p.saddsttyp) parts.push(String(p.saddsttyp).trim());
          if (parts.length >= 2) {
            addr = parts.join(' ');
            if (p.scity) addr += ', ' + p.scity;
          } else {
            var cty = p.county || p.cntyname || 'Guilford';
            addr = cty + ' County';
            if (pin) addr += ' · PIN ' + pin;
          }
        }
        
        var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || p.ACREAGE || p.Acres || p.calcacres || p.totalacres || p.TOTALACRES || p.lotsize || (p.Shape_Area ? (p.Shape_Area * 0.000247105).toFixed(2) : null) || (p.SHAPE_AREA ? (p.SHAPE_AREA * 0.000247105).toFixed(2) : null) || '0';
        var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || p.landuse || p.LANDUSE || p.proptype || p.PROPTYPE || 'Unknown';

        classCounts[cls]++;
        if (cls === 'confirmed-farm' || cls === 'likely-farm') farmAcres += parseFloat(acres) || 0;

        var badge = '<span style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:700;'
          + 'background:' + fc.color + '22;color:' + fc.color + ';border:1px solid ' + fc.color + '44;">' + fc.label + '</span>';
        
        var safeOwner = owner.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var safeAddr = addr.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        var popupContent = '<div id="popup-' + pin + '" style="min-width:280px;font-family:Inter,sans-serif;padding:12px;">'
          + '<div style="font-weight:900;color:#f8fafc;font-size:15px;margin-bottom:2px;">' + owner + '</div>'
          + '<div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">' + addr + '</div>'
          + '<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;">' + badge
          + (pin ? '<span style="font-size:10px;color:#64748b;">PIN: ' + pin + '</span>' : '') + '</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'
          + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Acreage</div><div style="font-weight:800;font-size:14px;color:#f8fafc;">' + parseFloat(acres).toFixed(2) + ' ac</div></div>'
          + '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Land Use</div><div style="font-size:11px;font-weight:600;color:' + fc.color + ';">' + landUse + '</div></div>'
          + '</div>';

        // ── Bona Fide Farm Eligibility (instant, from parcel data) ──
        var bffQuick = bonaFideEligibility(acres, landUse, '', '', null);
        if (bffQuick.level !== 'ineligible') {
          popupContent += '<div style="margin-bottom:12px; padding:10px; background:' + bffQuick.color + '15; border-left:4px solid ' + bffQuick.color + '; border-radius:4px;">'
            + '<div style="font-size:11px; font-weight:800; color:' + bffQuick.color + '; margin-bottom:3px; display:flex; align-items:center; gap:4px;">'
            + '<span class="material-icons-round" style="font-size:15px;">' + bffQuick.icon + '</span> Bona Fide Farm Eligibility</div>'
            + '<span style="padding:2px 7px; border-radius:4px; font-size:10px; font-weight:700; background:' + bffQuick.color + '22; color:' + bffQuick.color + '; border:1px solid ' + bffQuick.color + '44;">' + bffQuick.label + '</span>';
          if (bffQuick.classes.length > 0) {
            popupContent += '<div style="font-size:9px; color:#cbd5e1; margin-top:5px;">Qualifies as: ' + bffQuick.classes.join(', ') + '</div>';
          }
          popupContent += '<div style="font-size:8px; color:#94a3b8; margin-top:3px;">Per NCGS §153A-340 · Exempt from zoning & some building codes</div>'
            + '<a href="https://www.guilfordcountync.gov/our-county/departments-services-p-z/planning-development" target="_blank" '
            + 'style="display:block; text-align:center; padding:6px; margin-top:6px; background:' + bffQuick.color + '; color:white; border-radius:5px; font-size:10px; font-weight:700; text-decoration:none;">'
            + '📋 Apply for Bona Fide Farm Status</a></div>';
        }

        popupContent += '<div id="tax-data-' + pin + '" style="margin-bottom:12px; padding: 8px; background: rgba(255,255,255,0.06); border-radius: 6px;">'
          + '<div style="font-size:11px;color:#94a3b8;display:flex;align-items:center;gap:4px;"><span class="material-icons-round" style="font-size:14px;">sync</span> Loading tax data...</div>'
          + '</div>'
          + '<div style="display:flex;gap:6px;margin-bottom:12px;">'
          + '<a href="https://gisdv.guilfordcountync.gov/Guilford/?pin=' + pin + '" target="_blank" style="flex:1;text-align:center;padding:6px;background:rgba(255,255,255,0.1);color:#f8fafc;border-radius:4px;font-size:10px;font-weight:bold;text-decoration:none;border:1px solid rgba(255,255,255,0.15);">View on County GIS</a>'
          + '<a href="https://lrcpwa.ncptscloud.com/guilford/" target="_blank" style="flex:1;text-align:center;padding:6px;background:rgba(255,255,255,0.1);color:#f8fafc;border-radius:4px;font-size:10px;font-weight:bold;text-decoration:none;border:1px solid rgba(255,255,255,0.15);">View Tax Record</a>'
          + '</div>'
          + '<button onclick="window.openIntakeForm(\'' + pin + '\', \'' + safeOwner + '\', \'' + safeAddr + '\', \'' + acres + '\')" style="width:100%;padding:10px;background:#3B7A57;color:white;border:none;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 4px 12px rgba(59,122,87,0.3);">🌱 This Is My Farm — Start Assessment</button>'
          + '</div>';
          
        layer.bindPopup(popupContent, {
          maxWidth: 340,
          maxHeight: 600,
          autoPan: true,
          autoPanPadding: [60, 60],
          autoPanPaddingTopLeft: [60, 140],
          autoPanPaddingBottomRight: [60, 60],
          keepInView: false,
          closeOnClick: false,
          className: 'ncsmall-popup'
        });

        layer.on('popupopen', function() {
           if (pin) fetchEnrichedTaxData(pin, acres, landUse);
        });

        // Correct mouseout style per classification
        layer._ncClass = cls;
        layer.on('mouseover', function() {
          this.setStyle({ weight: 4, fillOpacity: 0.55, color: '#FFD700' });
        });
        layer.on('mouseout', function() {
          if (this._ncClass === 'non-agricultural') {
            this.setStyle({ color: '#78909C', weight: 0.8, fillOpacity: 0.03, opacity: 0.3 });
          } else {
            this.setStyle({ weight: 2.5, fillOpacity: 0.4, color: '#FDB927' });
          }
        });
      }
    }).addTo(mapInstance);

    // NOW remove old layer (after new one is on map — no flash)
    if (oldLayer) { mapInstance.removeLayer(oldLayer); }

    updateClassCounts(classCounts, farmAcres);

    // Build farm pin data for wide-zoom markers
    farmPinData = [];
    geojson.features.forEach(function(f) {
      if (f._ncClass === 'non-agricultural') return;
      var p = f.properties || {};
      var landUse = p.usedesc || p.parusedesc || p.LAND_USE || p.parusecode || 'Farm';
      var acres = p.GISACRES || p.gisacres || p.acres || p.CALCACRES || '0';
      // Compute centroid from geometry
      try {
        var coords = f.geometry.coordinates;
        var ring = f.geometry.type === 'MultiPolygon' ? coords[0][0] : coords[0];
        var sumLat = 0, sumLng = 0, n = ring.length;
        for (var i = 0; i < n; i++) { sumLng += ring[i][0]; sumLat += ring[i][1]; }
        farmPinData.push({ lat: sumLat / n, lng: sumLng / n, cls: f._ncClass, landUse: landUse, acres: parseFloat(acres).toFixed(1) });
      } catch(e) {}
    });
    updateFarmPinsVisibility();
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
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Assessed Value</div><div style="font-weight:800;font-size:13px;color:#FDB927;">' + valFmt(data.assessedValue) + '</div></div>';
            
            if (data.deferredValue && Number(data.deferredValue) > 0) {
               html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Deferred (PVU)</div><div style="font-weight:800;font-size:13px;color:#2E7D32;">' + valFmt(data.deferredValue) + '</div><div style="font-size:9px;color:#4CAF50;font-weight:bold;">✓ PVU Enrolled</div></div>';
            } else {
               html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Property Type</div><div style="font-weight:600;font-size:12px;color:#f8fafc;">' + (data.propertyType || 'N/A') + '</div></div>';
            }
            html += '</div>';

            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">';
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Year Built</div><div style="font-size:11px;font-weight:600;color:#f8fafc;">' + (data.yearBuilt || 'N/A') + '</div></div>';
            html += '<div><div style="font-size:9px;color:#94a3b8;text-transform:uppercase;">Structure Size</div><div style="font-size:11px;font-weight:600;color:#f8fafc;">' + (data.structureSize ? Number(data.structureSize).toLocaleString() + ' sqft' : 'N/A') + '</div></div>';
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

            // ── Bona Fide Farm Eligibility Card (NCGS 153A-340) ──
            var bffZoning = data.zoning || data.zoningCode || '';
            var bffMisc = data.miscImprovements || data.buildingType || data.propertyType || '';
            var bff = bonaFideEligibility(acres, landUse, bffZoning, bffMisc, data.deferredValue);

            if (bff.level !== 'ineligible') {
              html += '<div style="margin-top: 12px; padding: 12px; background: ' + bff.color + '15; border-left: 4px solid ' + bff.color + '; border-radius: 4px;">';
              html += '<div style="font-size:12px; font-weight:800; color:' + bff.color + '; margin-bottom:4px; display:flex; align-items:center; gap:4px;">'
                + '<span class="material-icons-round" style="font-size:16px;">' + bff.icon + '</span> Bona Fide Farm Status</div>';
              html += '<div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">'
                + '<span style="padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; background:' + bff.color + '22; color:' + bff.color + '; border:1px solid ' + bff.color + '44;">' + bff.label + '</span></div>';

              if (bff.classes.length > 0) {
                html += '<div style="font-size:10px; color:#cbd5e1; margin-bottom:6px;">Qualifying under NCGS 153A-340:</div>';
                html += '<ul style="margin:0; padding-left:16px; font-size:10px; color:#f8fafc; margin-bottom:8px;">';
                bff.classes.forEach(function(c) { html += '<li>' + c + '</li>'; });
                html += '</ul>';
              }

              html += '<div style="font-size:9px; color:#94a3b8; margin-bottom:8px; line-height:1.4;">Bona Fide Farms are exempt from zoning regulations and some NC Building Code requirements.</div>';
              html += '<a href="https://www.guilfordcountync.gov/our-county/departments-services-p-z/planning-development" target="_blank" '
                + 'style="display:block; text-align:center; padding:8px; background:' + bff.color + '; color:white; border-radius:6px; font-size:11px; font-weight:700; text-decoration:none; font-family:Inter,sans-serif;">'
                + '📋 Apply for Bona Fide Farm Status</a>';
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

  /* ── Dashboard Banner ─────────────────────────────────────── */
  function updateDashboardBanner() {
    var countEl = document.getElementById('dash-farm-count');
    var acresEl = document.getElementById('dash-total-acres');
    var avgEl = document.getElementById('dash-avg-size');
    
    if (countEl) countEl.textContent = totalDynamicFarmCount.toLocaleString();
    if (acresEl) acresEl.textContent = Math.round(totalDynamicFarmAcres).toLocaleString();
    if (avgEl && totalDynamicFarmCount > 0) {
      avgEl.textContent = (totalDynamicFarmAcres / totalDynamicFarmCount).toFixed(1) + ' ac';
    }
  }

  /* ── Farm Directory Panel ─────────────────────────────────── */
  function toggleDirectoryPanel() {
    var panel = document.getElementById('farm-directory-panel');
    var btn = document.getElementById('directory-toggle-btn');
    if (!panel) return;
    
    if (directoryVisible) {
      panel.classList.remove('collapsed');
      if (btn) btn.style.display = 'none';
    } else {
      panel.classList.add('collapsed');
      if (btn) btn.style.display = 'flex';
    }
  }

  function renderDirectoryList() {
    var listEl = document.getElementById('farm-directory-list');
    var summaryEl = document.getElementById('directory-summary');
    if (!listEl) return;

    var query = (directorySearchText || '').toLowerCase().trim();
    
    // Filter farms by search text
    var filtered = dynamicFarms;
    if (query) {
      filtered = dynamicFarms.filter(function(f) {
        return (f.name || '').toLowerCase().includes(query) ||
               (f.addr || '').toLowerCase().includes(query) ||
               (f.type || '').toLowerCase().includes(query) ||
               (f.pin || '').toLowerCase().includes(query);
      });
    }

    // Sort by acreage descending
    filtered.sort(function(a, b) { return (parseFloat(b.acres) || 0) - (parseFloat(a.acres) || 0); });

    // Update summary
    if (summaryEl) {
      var totalFilteredAcres = 0;
      filtered.forEach(function(f) { totalFilteredAcres += parseFloat(f.acres) || 0; });
      summaryEl.textContent = filtered.length.toLocaleString() + ' farms · ' + Math.round(totalFilteredAcres).toLocaleString() + ' acres' + (query ? ' (filtered)' : '');
    }

    // Render list (limit to 200 for performance)
    var displayCount = Math.min(filtered.length, 200);
    var html = '';
    
    for (var i = 0; i < displayCount; i++) {
      var farm = filtered[i];
      var acStr = farm.acres ? parseFloat(farm.acres).toFixed(1) + ' ac' : '';
      var typeLabel = (farm.type || 'Farm').replace(/FARM DEFERRED/i, 'Farm Deferred').replace(/AGRI\/HORT/i, 'Agri/Hort');
      
      html += '<div class="farm-directory-item" data-farm-idx="' + i + '" onclick="window._zoomToFarm(' + farm.lat + ',' + farm.lng + ')">'
        + '<div class="farm-name">' + (farm.name || 'Unknown Owner') + '</div>'
        + '<div class="farm-meta">'
        + '<span class="farm-acres">' + acStr + '</span>'
        + '<span class="farm-type">' + typeLabel + '</span>'
        + '</div>'
        + '<div style="font-size:9px;color:#64748b;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (farm.addr || '') + '</div>'
        + '</div>';
    }

    if (filtered.length > 200) {
      html += '<div style="padding:12px;text-align:center;font-size:10px;color:#94a3b8;">Showing 200 of ' + filtered.length.toLocaleString() + ' — use search to narrow</div>';
    }

    if (filtered.length === 0) {
      html = '<div style="padding:20px;text-align:center;font-size:12px;color:#64748b;">No farms match your search</div>';
    }

    listEl.innerHTML = html;
  }

  // Global zoom-to-farm function for directory clicks
  window._zoomToFarm = function(lat, lng) {
    if (mapInstance) {
      mapInstance.flyTo([lat, lng], 16, { duration: 1.2 });
    }
  };

})();

