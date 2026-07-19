/* ==========================================================================
   NC Small Farm Platform V.2 — ESP Dashboard (Full 10‑Step)
   Admin-only Environmental Scanning Process dashboard
   NC Cooperative Extension · Guilford County
   ========================================================================== */

window.renderESPDashboard = function () {
  var h = window.h;

  // ── Local ESP State ──────────────────────────────────────────────────────
  var espState = window._espState || (window._espState = {
    currentStep: 1,
    county: 'Guilford',
    issues: [],
    stakeholderResponses: [],
    citizenResponses: [],
    priorities: [],
    assets: [],
    completedSteps: [],
    auditChecks: {}
  });

  // ── Theme Tokens ─────────────────────────────────────────────────────────
  var GOLD   = '#FDB927';
  var GREEN  = '#3B7A57';
  var BLUE   = '#004684';
  var BG_CARD = 'rgba(255,255,255,0.04)';
  var BORDER  = 'rgba(255,255,255,0.08)';
  var GLASS   = 'rgba(10,14,23,0.92)';
  var GLASS_BORDER = 'rgba(255,255,255,0.10)';
  var TEXT    = '#f8fafc';
  var TEXT2   = '#cbd5e1';
  var TEXT3   = '#94a3b8';
  var RADIUS  = '12px';
  var FONT   = 'Inter, sans-serif';

  // ── Helpers ──────────────────────────────────────────────────────────────
  function icon(name, extra) {
    return h('span', Object.assign({ className: 'material-icons-round', style: { fontSize: '20px', verticalAlign: 'middle' } }, extra || {}), name);
  }

  function showToast(msg) {
    var t = document.createElement('div');
    Object.assign(t.style, {
      position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
      background: GREEN, color: '#fff', padding: '12px 28px', borderRadius: '10px',
      fontFamily: FONT, fontSize: '14px', fontWeight: '600', zIndex: '9999',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', opacity: '0', transition: 'opacity 0.3s'
    });
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 350);
    }, 2600);
  }

  function goStep(n) {
    espState.currentStep = n;
    window.render();
  }

  function markComplete(n) {
    if (espState.completedSteps.indexOf(n) === -1) espState.completedSteps.push(n);
  }

  // ── Shared Styles ────────────────────────────────────────────────────────
  var cardStyle = {
    background: BG_CARD, border: '1px solid ' + BORDER, borderRadius: RADIUS,
    padding: '24px', marginBottom: '16px'
  };

  var inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
    fontFamily: FONT, border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)', color: TEXT, outline: 'none',
    boxSizing: 'border-box'
  };

  var btnPrimary = {
    padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px', fontFamily: FONT,
    background: GREEN, color: '#fff', transition: 'all 0.2s'
  };

  var btnGold = {
    padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px', fontFamily: FONT,
    background: GOLD, color: '#0a0e17', transition: 'all 0.2s'
  };

  var btnOutline = {
    padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '14px', fontFamily: FONT,
    background: 'transparent', color: TEXT2, border: '1px solid ' + BORDER,
    transition: 'all 0.2s'
  };

  function sectionLabel(txt) {
    return h('p', { style: { fontSize: '13px', color: TEXT3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' } }, txt);
  }

  // ── Step Meta ────────────────────────────────────────────────────────────
  var STEPS = [
    { num: 1,  title: 'Situational Analysis',     icon: 'analytics' },
    { num: 2,  title: 'Key Issues',               icon: 'report_problem' },
    { num: 3,  title: 'Stakeholder Input',         icon: 'groups' },
    { num: 4,  title: 'County Mapping',            icon: 'map' },
    { num: 5,  title: 'Citizen Data Collection',   icon: 'ballot' },
    { num: 6,  title: 'Triangulation',             icon: 'hub' },
    { num: 7,  title: 'Asset Mapping',             icon: 'location_city' },
    { num: 8,  title: 'Priority Dashboard',        icon: 'leaderboard' },
    { num: 9,  title: 'Executive Dashboard',       icon: 'dashboard' },
    { num: 10, title: 'Database & ERP',            icon: 'storage' }
  ];

  // ══════════════════════════════════════════════════════════════════════════
  //  HEADER — Title + Progress Bar
  // ══════════════════════════════════════════════════════════════════════════
  var completePct = Math.round((espState.completedSteps.length / 10) * 100);
  var header = h('div', { style: { marginBottom: '32px' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px', flexWrap: 'wrap' } },
      icon('eco', { style: { fontSize: '32px', color: GREEN } }),
      h('h1', { style: { fontSize: '1.6rem', fontWeight: '800', color: TEXT, margin: '0', lineHeight: '1.2' } },
        'Environmental Scanning Dashboard — ' + espState.county + ' County'
      )
    ),
    h('p', { style: { fontSize: '13px', color: TEXT3, margin: '4px 0 16px 0' } },
      'NC Cooperative Extension · 10‑Step Environmental Scanning Process'
    ),
    // Progress bar
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
      h('div', { style: { flex: '1', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' } },
        h('div', { style: { width: completePct + '%', height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg,' + GREEN + ',' + GOLD + ')', transition: 'width 0.5s ease' } })
      ),
      h('span', { style: { fontSize: '13px', fontWeight: '700', color: GOLD, minWidth: '50px', textAlign: 'right' } },
        espState.completedSteps.length + '/10'
      )
    )
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  STEP NAVIGATOR — Horizontal Pills
  // ══════════════════════════════════════════════════════════════════════════
  var stepNav = h('div', { style: {
    display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px',
    marginBottom: '28px', WebkitOverflowScrolling: 'touch'
  } },
    STEPS.map(function (s) {
      var isActive   = espState.currentStep === s.num;
      var isComplete = espState.completedSteps.indexOf(s.num) !== -1;
      var pillBg = isActive ? GOLD : isComplete ? GREEN : 'rgba(255,255,255,0.06)';
      var pillColor = isActive ? '#0a0e17' : isComplete ? '#fff' : TEXT3;

      var pill = h('button', {
        style: {
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '24px', border: 'none',
          background: pillBg, color: pillColor, fontFamily: FONT,
          fontSize: '12px', fontWeight: '700', cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.25s', flexShrink: '0',
          boxShadow: isActive ? '0 4px 16px rgba(253,185,39,0.3)' : 'none'
        },
        onclick: function () { goStep(s.num); },
        onmouseenter: function () {
          if (!isActive) { this.style.background = 'rgba(255,255,255,0.12)'; this.style.color = TEXT; }
        },
        onmouseleave: function () {
          if (!isActive) { this.style.background = pillBg; this.style.color = pillColor; }
        }
      },
        isComplete && !isActive
          ? icon('check_circle', { style: { fontSize: '16px', color: '#fff' } })
          : h('span', { style: { fontWeight: '800', fontSize: '13px' } }, String(s.num)),
        s.title
      );
      return pill;
    })
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  STEP CONTENT BUILDERS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Step 1: Situational Analysis ─────────────────────────────────────────
  function renderStep1() {
    var categories = [
      { label: 'Demographics',   source: 'US Census ACS 5‑Year' },
      { label: 'Economic',       source: 'BLS QCEW / BEA' },
      { label: 'Health / Social', source: 'County Health Rankings' },
      { label: 'Education',      source: 'NCES / NC DPI' },
      { label: 'Agriculture',    source: 'USDA NASS Census' },
      { label: 'Environmental',  source: 'EPA / NC DEQ' },
      { label: 'Opportunity',    source: 'USDA ERS Atlas' }
    ];

    var thStyle = {
      textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: '0.06em', color: TEXT3,
      borderBottom: '1px solid ' + BORDER, whiteSpace: 'nowrap'
    };
    var tdStyle = {
      padding: '10px 12px', fontSize: '13px', color: TEXT2,
      borderBottom: '1px solid rgba(255,255,255,0.04)'
    };

    var thead = h('tr', null,
      ['Data Category', 'Source', 'State Avg', 'My County', 'Neighbor 1', 'Neighbor 2'].map(function (col) {
        return h('th', { style: thStyle }, col);
      })
    );

    var tbody = categories.map(function (cat, i) {
      return h('tr', {
        style: { background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }
      },
        h('td', { style: Object.assign({}, tdStyle, { fontWeight: '600', color: TEXT }) }, cat.label),
        h('td', { style: tdStyle }, cat.source),
        h('td', { style: Object.assign({}, tdStyle, { textAlign: 'center' }) }, '—'),
        h('td', { style: Object.assign({}, tdStyle, { textAlign: 'center', color: GOLD, fontWeight: '700' }) }, '—'),
        h('td', { style: Object.assign({}, tdStyle, { textAlign: 'center' }) }, '—'),
        h('td', { style: Object.assign({}, tdStyle, { textAlign: 'center' }) }, '—')
      );
    });

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('analytics', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 1 — Situational Analysis')
      ),
      sectionLabel('County data comparison matrix'),
      h('div', { style: { overflowX: 'auto', borderRadius: RADIUS, border: '1px solid ' + BORDER, background: BG_CARD } },
        h('table', { style: { width: '100%', borderCollapse: 'collapse', minWidth: '650px' } },
          h('thead', null, thead),
          h('tbody', null, tbody)
        )
      ),
      h('div', { style: { display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' } },
        h('button', {
          style: btnPrimary,
          onclick: function () { showToast('Census data pull initiated — check back in 30s'); }
        }, icon('download', { style: { fontSize: '16px', marginRight: '6px' } }), 'Load Census Data'),
        h('button', {
          style: btnGold,
          onclick: function () { showToast('USDA NASS Agriculture Census loading…'); }
        }, icon('agriculture', { style: { fontSize: '16px', marginRight: '6px' } }), 'Load NASS Data'),
        h('button', {
          style: btnOutline,
          onclick: function () { markComplete(1); showToast('Step 1 marked complete ✓'); window.render(); }
        }, 'Mark Complete')
      )
    );
  }

  // ── Step 2: Key Issues ───────────────────────────────────────────────────
  function renderStep2() {
    var cats = ['Agriculture', 'Economic Development', 'Health & Wellness', 'Youth & Families', 'Environment', 'Food Access', 'Infrastructure'];

    function saveIssues() {
      var els = document.querySelectorAll('.esp-issue-input');
      var selects = document.querySelectorAll('.esp-issue-cat');
      espState.issues = [];
      els.forEach(function (el, i) {
        if (el.value.trim()) {
          espState.issues.push({ text: el.value.trim(), category: selects[i] ? selects[i].value : cats[0] });
        }
      });
      if (espState.issues.length > 0) {
        markComplete(2);
        showToast(espState.issues.length + ' issue(s) saved');
        window.render();
      } else {
        showToast('Enter at least one area of concern');
      }
    }

    var fields = [];
    for (var i = 0; i < 5; i++) {
      (function (idx) {
        var existing = espState.issues[idx] || { text: '', category: cats[0] };
        var row = h('div', { style: { display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' } },
          h('input', {
            className: 'esp-issue-input', type: 'text', placeholder: 'Area of Concern ' + (idx + 1),
            value: existing.text,
            style: Object.assign({}, inputStyle, { flex: '1', minWidth: '200px' }),
            onfocus: function () { this.style.borderColor = GOLD; },
            onblur: function () { this.style.borderColor = 'rgba(255,255,255,0.15)'; }
          }),
          h('select', {
            className: 'esp-issue-cat',
            style: Object.assign({}, inputStyle, { width: 'auto', minWidth: '160px', cursor: 'pointer' })
          },
            cats.map(function (c) {
              return h('option', { value: c, style: { background: '#1a1f2e', color: TEXT } }, c);
            })
          )
        );
        fields.push(row);
      })(i);
    }

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('report_problem', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 2 — Key Issues Identification')
      ),
      sectionLabel('Identify up to 5 areas of concern from your situational analysis'),
      h('div', { style: cardStyle }, fields),
      espState.issues.length > 0
        ? h('div', { style: Object.assign({}, cardStyle, { marginTop: '4px' }) },
            sectionLabel('Saved Issues'),
            espState.issues.map(function (iss, idx) {
              return h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } },
                h('span', { style: { background: GREEN, color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: '0' } }, String(idx + 1)),
                h('span', { style: { color: TEXT, fontSize: '14px', flex: '1' } }, iss.text),
                h('span', { style: { fontSize: '11px', color: GOLD, fontWeight: '700', background: 'rgba(253,185,39,0.12)', padding: '3px 10px', borderRadius: '12px' } }, iss.category)
              );
            })
          )
        : null,
      h('div', { style: { marginTop: '16px' } },
        h('button', { style: btnPrimary, onclick: saveIssues },
          icon('save', { style: { fontSize: '16px', marginRight: '6px' } }), 'Save Issues'
        )
      )
    );
  }

  // ── Step 3: Stakeholder Input ────────────────────────────────────────────
  function renderStep3() {
    var groups = [
      { name: 'Elected Officials',     icon: 'gavel',          color: BLUE },
      { name: 'Business Leaders',      icon: 'business_center', color: '#7c3aed' },
      { name: 'Faith‑Based Orgs',      icon: 'church',         color: '#db2777' },
      { name: 'Educators / Schools',   icon: 'school',         color: '#0891b2' },
      { name: 'Health Professionals',  icon: 'local_hospital', color: '#059669' },
      { name: 'Agricultural Leaders',  icon: 'agriculture',    color: GOLD }
    ];

    function getCount(name) {
      return espState.stakeholderResponses.filter(function (r) { return r.group === name; }).length;
    }

    var cards = groups.map(function (g) {
      var count = getCount(g.name);
      return h('div', {
        style: Object.assign({}, cardStyle, {
          textAlign: 'center', padding: '28px 20px', position: 'relative',
          transition: 'transform 0.2s, border-color 0.2s', cursor: 'default'
        }),
        onmouseenter: function () { this.style.transform = 'translateY(-4px)'; this.style.borderColor = g.color; },
        onmouseleave: function () { this.style.transform = 'none'; this.style.borderColor = BORDER; }
      },
        // Badge
        count > 0
          ? h('span', { style: {
              position: 'absolute', top: '10px', right: '10px',
              background: GREEN, color: '#fff', borderRadius: '50%',
              width: '26px', height: '26px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '800'
            } }, String(count))
          : null,
        h('div', { style: {
          width: '52px', height: '52px', borderRadius: '50%',
          background: g.color + '22', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px'
        } },
          icon(g.icon, { style: { fontSize: '26px', color: g.color } })
        ),
        h('p', { style: { color: TEXT, fontSize: '14px', fontWeight: '700', margin: '0 0 14px' } }, g.name),
        h('button', {
          style: Object.assign({}, btnPrimary, { padding: '8px 18px', fontSize: '12px' }),
          onclick: function () {
            espState.stakeholderResponses.push({ group: g.name, date: new Date().toISOString(), notes: '' });
            if (espState.stakeholderResponses.length >= 3) markComplete(3);
            showToast('Response added for ' + g.name);
            window.render();
          }
        }, icon('add', { style: { fontSize: '14px', marginRight: '4px' } }), 'Add Response')
      );
    });

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('groups', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 3 — Stakeholder Input')
      ),
      sectionLabel('Collect responses from 6 key stakeholder groups'),
      h('div', { style: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      } }, cards),
      h('p', { style: { fontSize: '12px', color: TEXT3, marginTop: '16px' } },
        'Total responses: ' + espState.stakeholderResponses.length
      )
    );
  }

  // ── Step 4: County Mapping ───────────────────────────────────────────────
  function renderStep4() {
    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('map', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 4 — County Mapping')
      ),
      sectionLabel('Geospatial view of community resources & data layers'),
      h('div', { style: Object.assign({}, cardStyle, {
        textAlign: 'center', padding: '60px 28px',
        background: 'linear-gradient(135deg, rgba(0,70,132,0.15), rgba(59,122,87,0.10))'
      }) },
        h('div', { style: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,70,132,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' } },
          icon('explore', { style: { fontSize: '40px', color: BLUE } })
        ),
        h('h3', { style: { color: TEXT, fontSize: '1.1rem', fontWeight: '700', margin: '0 0 8px' } }, espState.county + ' County Interactive Map'),
        h('p', { style: { color: TEXT2, fontSize: '14px', margin: '0 0 28px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' } },
          'View farm locations, food deserts, broadband coverage, soil types, and community resource distribution on the interactive county map.'
        ),
        h('button', {
          style: Object.assign({}, btnGold, { padding: '14px 36px', fontSize: '15px' }),
          onclick: function () {
            markComplete(4);
            if (window.setView) window.setView('map');
          }
        },
          icon('open_in_new', { style: { fontSize: '18px', marginRight: '8px' } }),
          'Open County Map →'
        )
      )
    );
  }

  // ── Step 5: Citizen Data Collection ──────────────────────────────────────
  function renderStep5() {
    var modes = [
      {
        title: 'Electronic',
        icon: 'devices',
        color: '#3b82f6',
        desc: 'Online surveys via Qualtrics, Google Forms, or SurveyMonkey distributed through email, social media, and website embeds.',
        stat: espState.citizenResponses.filter(function (r) { return r.mode === 'electronic'; }).length
      },
      {
        title: 'Digital In‑Person',
        icon: 'tablet_android',
        color: '#8b5cf6',
        desc: 'Tablet-based surveys at community events, farmers markets, and Extension office walk‑ins with real‑time data sync.',
        stat: espState.citizenResponses.filter(function (r) { return r.mode === 'digital'; }).length
      },
      {
        title: 'Physical',
        icon: 'description',
        color: '#f59e0b',
        desc: 'Paper surveys with prepaid return envelopes for households without broadband access. Scanned and digitized for analysis.',
        stat: espState.citizenResponses.filter(function (r) { return r.mode === 'physical'; }).length
      }
    ];

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('ballot', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 5 — Citizen Data Collection')
      ),
      sectionLabel('Three collection modes ensure inclusive participation'),
      h('div', { style: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px'
      } },
        modes.map(function (m) {
          return h('div', {
            style: Object.assign({}, cardStyle, { padding: '28px', transition: 'transform 0.2s, border-color 0.2s' }),
            onmouseenter: function () { this.style.transform = 'translateY(-4px)'; this.style.borderColor = m.color; },
            onmouseleave: function () { this.style.transform = 'none'; this.style.borderColor = BORDER; }
          },
            h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' } },
              h('div', { style: { width: '48px', height: '48px', borderRadius: '14px', background: m.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                icon(m.icon, { style: { fontSize: '24px', color: m.color } })
              ),
              h('span', { style: { fontSize: '28px', fontWeight: '800', color: m.color } }, String(m.stat))
            ),
            h('h3', { style: { color: TEXT, fontSize: '15px', fontWeight: '700', margin: '0 0 8px' } }, m.title),
            h('p', { style: { color: TEXT3, fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px' } }, m.desc),
            h('button', {
              style: Object.assign({}, btnOutline, { width: '100%', borderColor: m.color + '40', color: m.color }),
              onclick: function () {
                espState.citizenResponses.push({ mode: m.title.toLowerCase().replace(/[^a-z]/g, ''), date: new Date().toISOString() });
                if (espState.citizenResponses.length >= 5) markComplete(5);
                showToast('Response logged — ' + m.title);
                window.render();
              }
            }, icon('add', { style: { fontSize: '16px', marginRight: '4px' } }), 'Log Response')
          );
        })
      ),
      h('p', { style: { fontSize: '12px', color: TEXT3, marginTop: '16px' } },
        'Total citizen responses: ' + espState.citizenResponses.length
      )
    );
  }

  // ── Step 6: Triangulation ────────────────────────────────────────────────
  function renderStep6() {
    var sources = [
      { title: 'Secondary Data', icon: 'database', color: '#3b82f6', items: ['Census / ACS', 'USDA NASS', 'County Health Rankings', 'BLS Employment'] },
      { title: 'Stakeholder Input', icon: 'record_voice_over', color: '#8b5cf6', items: ['Elected Officials', 'Business Leaders', 'Educators', 'Health Providers'] },
      { title: 'Citizen Surveys', icon: 'people', color: '#f59e0b', items: ['Electronic responses', 'In‑person digital', 'Paper surveys', 'Focus groups'] }
    ];

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('hub', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 6 — Triangulation')
      ),
      sectionLabel('Cross-source issue validation — confirming patterns across all 3 data streams'),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' } },
        sources.map(function (src) {
          return h('div', { style: Object.assign({}, cardStyle, { padding: '24px' }) },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' } },
              h('div', { style: { width: '40px', height: '40px', borderRadius: '12px', background: src.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                icon(src.icon, { style: { fontSize: '22px', color: src.color } })
              ),
              h('h3', { style: { color: TEXT, fontSize: '14px', fontWeight: '700', margin: '0' } }, src.title)
            ),
            src.items.map(function (item) {
              return h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } },
                icon('check', { style: { fontSize: '14px', color: GREEN } }),
                h('span', { style: { fontSize: '13px', color: TEXT2 } }, item)
              );
            })
          );
        })
      ),
      h('div', { style: { marginTop: '20px' } },
        h('button', {
          style: btnPrimary,
          onclick: function () { markComplete(6); showToast('Triangulation matrix validated ✓'); window.render(); }
        }, icon('verified', { style: { fontSize: '16px', marginRight: '6px' } }), 'Validate Triangulation')
      )
    );
  }

  // ── Step 7: Asset Mapping (ABCD-Informed) ──────────────────────────────
  function renderStep7() {
    // ABCD categories with icons, colors, and seed examples
    var categories = [
      { key: 'individual',   label: 'Individual Gifts & Skills', icon: 'person',          color: '#4CAF50', examples: ['Master Gardener — J. Williams', 'Soil Conservation Expert — R. Davis'] },
      { key: 'association',  label: 'Local Associations',        icon: 'groups',           color: '#29B6F6', examples: ['Guilford County Farm Bureau', 'Piedmont Triad Farmers Market Co-op'] },
      { key: 'institution',  label: 'Institutions',              icon: 'account_balance',  color: '#AB47BC', examples: ['NC A&T CES Office', 'Guilford County Health Dept', 'NRCS Greensboro'] },
      { key: 'physical',     label: 'Physical Assets',           icon: 'home_work',        color: '#FF7043', examples: ['Community Garden — E. Market St', 'Extension Meeting Hall'] },
      { key: 'economic',     label: 'Economic Assets',           icon: 'payments',         color: '#FDB927', examples: ['Piedmont Land Conservancy', 'United Way of Greater Greensboro'] }
    ];

    // Initialize assets by category if empty
    if (espState.assets.length === 0) {
      categories.forEach(function(cat) {
        cat.examples.forEach(function(ex) {
          espState.assets.push({ name: ex, category: cat.key, added: true });
        });
      });
    }

    function addAsset(catKey) {
      var input = document.getElementById('esp-asset-' + catKey);
      if (input && input.value.trim()) {
        espState.assets.push({ name: input.value.trim(), category: catKey, added: true });
        markComplete(7);
        showToast('Asset added');
        window.render();
      }
    }

    function removeAsset(idx) {
      espState.assets.splice(idx, 1);
      window.render();
    }

    // Count assets per category
    var catCounts = {};
    categories.forEach(function(cat) { catCounts[cat.key] = 0; });
    espState.assets.forEach(function(a) { if (catCounts[a.category] !== undefined) catCounts[a.category]++; });
    var filledCats = Object.values(catCounts).filter(function(c) { return c > 0; }).length;

    // Build category cards
    var categoryCards = categories.map(function(cat) {
      var catAssets = espState.assets.filter(function(a) { return a.category === cat.key; });
      
      return h('div', { style: Object.assign({}, cardStyle, { marginBottom: '16px' }) },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' } },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            h('span', { style: { background: cat.color + '22', color: cat.color, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
              icon(cat.icon, { style: { fontSize: '18px' } })
            ),
            h('div', null,
              h('div', { style: { fontSize: '13px', fontWeight: '700', color: TEXT } }, cat.label),
              h('div', { style: { fontSize: '10px', color: TEXT3 } }, catAssets.length + ' mapped')
            )
          ),
          h('span', { style: { background: cat.color + '33', color: cat.color, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' } }, String(catAssets.length))
        ),
        catAssets.length > 0 ? h('div', { style: { marginBottom: '10px' } },
          catAssets.map(function(asset) {
            var globalIdx = espState.assets.indexOf(asset);
            return h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' } },
              h('span', { style: { color: TEXT2, fontSize: '12px' } }, asset.name),
              h('button', {
                style: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', opacity: '0.5' },
                onclick: function() { removeAsset(globalIdx); }
              }, icon('close', { style: { fontSize: '14px', color: '#ef4444' } }))
            );
          })
        ) : h('div', { style: { fontSize: '11px', color: TEXT3, fontStyle: 'italic', padding: '6px 0' } }, 'No assets mapped yet'),
        h('div', { style: { display: 'flex', gap: '8px' } },
          h('input', {
            id: 'esp-asset-' + cat.key, type: 'text',
            placeholder: 'Add ' + cat.label.toLowerCase() + '...',
            style: Object.assign({}, inputStyle, { flex: '1', fontSize: '11px', padding: '6px 10px' }),
            onfocus: function() { this.style.borderColor = cat.color; },
            onblur: function() { this.style.borderColor = 'rgba(255,255,255,0.15)'; },
            onkeydown: function(e) { if (e.key === 'Enter') addAsset(cat.key); }
          }),
          h('button', {
            style: Object.assign({}, btnPrimary, { padding: '6px 10px', fontSize: '11px' }),
            onclick: function() { addAsset(cat.key); }
          }, icon('add', { style: { fontSize: '16px' } }))
        )
      );
    });

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' } },
        icon('location_city', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 7 — Community Asset Mapping')
      ),
      sectionLabel('Map what your community already has — organized by type'),
      h('div', { style: Object.assign({}, cardStyle, { marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }) },
        icon('check_circle', { style: { fontSize: '20px', color: filledCats === 5 ? GREEN : GOLD } }),
        h('div', { style: { flex: '1' } },
          h('div', { style: { fontSize: '12px', fontWeight: '700', color: TEXT, marginBottom: '4px' } }, 'Asset Coverage: ' + filledCats + ' of 5 categories'),
          h('div', { style: { height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' } },
            h('div', { style: { height: '100%', width: (filledCats * 20) + '%', background: filledCats === 5 ? GREEN : GOLD, borderRadius: '2px', transition: 'width 0.3s' } })
          )
        ),
        h('span', { style: { fontSize: '11px', color: TEXT3 } }, espState.assets.length + ' total')
      ),
      h('div', null, categoryCards),
      h('div', { style: Object.assign({}, cardStyle, { borderLeft: '3px solid ' + (filledCats < 5 ? '#ef4444' : GREEN) }) },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' } },
          icon(filledCats < 5 ? 'warning' : 'verified', { style: { fontSize: '18px', color: filledCats < 5 ? '#ef4444' : GREEN } }),
          h('div', { style: { fontSize: '13px', fontWeight: '700', color: TEXT } }, 'Gap Analysis')
        ),
        filledCats < 5 ?
          h('div', null,
            h('div', { style: { fontSize: '11px', color: TEXT2, marginBottom: '6px' } }, 'Categories with no assets mapped:'),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
              categories.filter(function(cat) { return catCounts[cat.key] === 0; }).map(function(cat) {
                return h('span', { style: { background: '#ef444422', color: '#ef4444', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' } }, cat.label);
              })
            )
          ) :
          h('div', { style: { fontSize: '11px', color: GREEN, fontWeight: '600' } }, 'All 5 asset categories covered — excellent!')
      )
    );
  }

  // ── Step 8: Priority Dashboard ───────────────────────────────────────────
  function renderStep8() {
    if (espState.priorities.length === 0 && espState.issues.length > 0) {
      espState.priorities = espState.issues.map(function (iss, i) {
        return { text: iss.text, category: iss.category, score: 5 - i, rank: i + 1 };
      });
    }

    if (espState.priorities.length === 0) {
      espState.priorities = [
        { text: 'Broadband access for rural farms', category: 'Infrastructure', score: 5, rank: 1 },
        { text: 'Youth ag-career pipeline', category: 'Youth & Families', score: 4, rank: 2 },
        { text: 'Soil health education', category: 'Agriculture', score: 3, rank: 3 }
      ];
    }

    function moveUp(idx) {
      if (idx === 0) return;
      var tmp = espState.priorities[idx];
      espState.priorities[idx] = espState.priorities[idx - 1];
      espState.priorities[idx - 1] = tmp;
      espState.priorities.forEach(function (p, i) { p.rank = i + 1; });
      window.render();
    }

    function moveDown(idx) {
      if (idx >= espState.priorities.length - 1) return;
      var tmp = espState.priorities[idx];
      espState.priorities[idx] = espState.priorities[idx + 1];
      espState.priorities[idx + 1] = tmp;
      espState.priorities.forEach(function (p, i) { p.rank = i + 1; });
      window.render();
    }

    function updateScore(idx, delta) {
      espState.priorities[idx].score = Math.max(0, Math.min(10, espState.priorities[idx].score + delta));
      window.render();
    }

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('leaderboard', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 8 — Priority Ranking Dashboard')
      ),
      sectionLabel('Drag, reorder, and score issues by community priority'),
      h('div', { style: cardStyle },
        espState.priorities.map(function (p, idx) {
          var barWidth = (p.score / 10) * 100;
          return h('div', { style: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)'
          } },
            // Rank
            h('span', { style: { fontWeight: '800', fontSize: '18px', color: idx === 0 ? GOLD : TEXT3, width: '30px', textAlign: 'center', flexShrink: '0' } }, '#' + (idx + 1)),
            // Content
            h('div', { style: { flex: '1', minWidth: '0' } },
              h('p', { style: { color: TEXT, fontSize: '14px', fontWeight: '600', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, p.text),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                h('div', { style: { flex: '1', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' } },
                  h('div', { style: { width: barWidth + '%', height: '100%', borderRadius: '3px', background: barWidth > 60 ? GREEN : barWidth > 30 ? GOLD : '#ef4444', transition: 'width 0.3s' } })
                ),
                h('span', { style: { fontSize: '12px', fontWeight: '800', color: GOLD, minWidth: '28px' } }, p.score + '/10')
              )
            ),
            // Score controls
            h('div', { style: { display: 'flex', gap: '4px', flexShrink: '0' } },
              h('button', {
                style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex' },
                onclick: function () { updateScore(idx, -1); }, title: 'Score −1'
              }, icon('remove', { style: { fontSize: '16px', color: '#ef4444' } })),
              h('button', {
                style: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex' },
                onclick: function () { updateScore(idx, 1); }, title: 'Score +1'
              }, icon('add', { style: { fontSize: '16px', color: GREEN } }))
            ),
            // Arrows
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: '0' } },
              h('button', {
                style: { background: 'transparent', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px', opacity: idx === 0 ? '0.25' : '1' },
                onclick: function () { moveUp(idx); }, title: 'Move up'
              }, icon('keyboard_arrow_up', { style: { fontSize: '20px', color: TEXT2 } })),
              h('button', {
                style: { background: 'transparent', border: 'none', cursor: idx >= espState.priorities.length - 1 ? 'default' : 'pointer', padding: '2px', opacity: idx >= espState.priorities.length - 1 ? '0.25' : '1' },
                onclick: function () { moveDown(idx); }, title: 'Move down'
              }, icon('keyboard_arrow_down', { style: { fontSize: '20px', color: TEXT2 } }))
            )
          );
        })
      ),
      h('button', {
        style: btnPrimary,
        onclick: function () { markComplete(8); showToast('Priorities locked ✓'); window.render(); }
      }, icon('lock', { style: { fontSize: '16px', marginRight: '6px' } }), 'Lock Priorities')
    );
  }

  // ── Step 9: Executive Dashboard ──────────────────────────────────────────
  function renderStep9() {
    var stats = [
      { label: 'Steps Complete',      value: espState.completedSteps.length + '/10', icon: 'task_alt',     color: GREEN },
      { label: 'Issues Identified',   value: String(espState.issues.length),        icon: 'flag',          color: '#ef4444' },
      { label: 'Stakeholder Inputs',  value: String(espState.stakeholderResponses.length), icon: 'groups', color: BLUE },
      { label: 'Citizen Responses',   value: String(espState.citizenResponses.length), icon: 'people',     color: '#8b5cf6' },
      { label: 'Community Assets',    value: String(espState.assets.length),         icon: 'location_city', color: '#f59e0b' },
      { label: 'Priority Issues',     value: String(espState.priorities.length),     icon: 'leaderboard',   color: GOLD }
    ];

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('dashboard', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 9 — Executive Summary Dashboard')
      ),
      sectionLabel(espState.county + ' County Environmental Scan — Summary Metrics'),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' } },
        stats.map(function (s) {
          return h('div', {
            style: Object.assign({}, cardStyle, {
              textAlign: 'center', padding: '24px 16px',
              transition: 'transform 0.2s, border-color 0.2s'
            }),
            onmouseenter: function () { this.style.transform = 'translateY(-3px)'; this.style.borderColor = s.color; },
            onmouseleave: function () { this.style.transform = 'none'; this.style.borderColor = BORDER; }
          },
            h('div', { style: { width: '44px', height: '44px', borderRadius: '50%', background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' } },
              icon(s.icon, { style: { fontSize: '22px', color: s.color } })
            ),
            h('p', { style: { fontSize: '28px', fontWeight: '800', color: TEXT, margin: '0 0 4px' } }, s.value),
            h('p', { style: { fontSize: '12px', color: TEXT3, fontWeight: '600', margin: '0' } }, s.label)
          );
        })
      ),
      // Top priorities summary
      espState.priorities.length > 0
        ? h('div', { style: Object.assign({}, cardStyle, { marginBottom: '20px' }) },
            sectionLabel('Top Priorities'),
            espState.priorities.slice(0, 3).map(function (p, i) {
              return h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } },
                h('span', { style: { background: i === 0 ? GOLD : GREEN, color: i === 0 ? '#0a0e17' : '#fff', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: '0' } }, String(i + 1)),
                h('span', { style: { color: TEXT, fontSize: '14px', flex: '1' } }, p.text),
                h('span', { style: { fontSize: '13px', fontWeight: '800', color: GOLD } }, p.score + '/10')
              );
            })
          )
        : null,
      h('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
        h('button', {
          style: btnGold,
          onclick: function () { markComplete(9); showToast('Executive report generated — downloading PDF…'); window.render(); }
        }, icon('picture_as_pdf', { style: { fontSize: '16px', marginRight: '6px' } }), 'Generate Report'),
        h('button', {
          style: btnOutline,
          onclick: function () { showToast('Dashboard shared via email'); }
        }, icon('share', { style: { fontSize: '16px', marginRight: '6px' } }), 'Share Dashboard')
      )
    );
  }

  // ── Step 10: Database & ERP ──────────────────────────────────────────────
  function renderStep10() {
    var checks = [
      { key: 'data_backup',    label: 'All survey data backed up to cloud' },
      { key: 'report_filed',   label: 'County Report filed with State Office' },
      { key: 'erp_synced',     label: 'ERP system synced with NIFA reporting' },
      { key: 'stakeholder_ack', label: 'Stakeholder acknowledgment letters sent' },
      { key: 'budget_aligned', label: 'Budget aligned to priority areas' },
      { key: 'timeline_set',   label: 'Implementation timeline established' },
      { key: 'staff_assigned', label: 'Staff/agent assignments documented' },
      { key: 'eval_metrics',   label: 'Evaluation metrics and KPIs defined' },
      { key: 'public_release', label: 'Public-facing summary released' },
      { key: 'next_cycle',     label: 'Next scanning cycle date set' }
    ];

    var allChecked = checks.every(function (c) { return espState.auditChecks[c.key]; });

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' } },
        icon('storage', { style: { fontSize: '28px', color: GOLD } }),
        h('h2', { style: { fontSize: '1.35rem', fontWeight: '800', color: TEXT, margin: '0' } }, 'Step 10 — Database & ERP Audit')
      ),
      sectionLabel('Final checklist — complete all items to close the scanning cycle'),
      h('div', { style: cardStyle },
        checks.map(function (c) {
          var isChecked = !!espState.auditChecks[c.key];
          return h('label', {
            style: {
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
              transition: 'background 0.15s'
            },
            onmouseenter: function () { this.style.background = 'rgba(255,255,255,0.03)'; },
            onmouseleave: function () { this.style.background = 'transparent'; }
          },
            // Custom checkbox
            h('div', {
              style: {
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: '0',
                border: isChecked ? 'none' : '2px solid rgba(255,255,255,0.2)',
                background: isChecked ? GREEN : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', cursor: 'pointer'
              },
              onclick: function (e) {
                e.preventDefault();
                espState.auditChecks[c.key] = !espState.auditChecks[c.key];
                var nowAll = checks.every(function (ch) { return espState.auditChecks[ch.key]; });
                if (nowAll) markComplete(10);
                window.render();
              }
            },
              isChecked ? icon('check', { style: { fontSize: '16px', color: '#fff' } }) : null
            ),
            h('span', { style: { color: isChecked ? TEXT : TEXT2, fontSize: '14px', fontWeight: isChecked ? '600' : '400', textDecoration: isChecked ? 'line-through' : 'none', transition: 'all 0.2s' } }, c.label)
          );
        })
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' } },
        h('span', { style: { fontSize: '13px', color: TEXT3 } },
          Object.keys(espState.auditChecks).filter(function (k) { return espState.auditChecks[k]; }).length + '/' + checks.length + ' items complete'
        ),
        allChecked
          ? h('span', { style: { fontSize: '13px', fontWeight: '700', color: GREEN, display: 'flex', alignItems: 'center', gap: '4px' } },
              icon('verified', { style: { fontSize: '16px', color: GREEN } }), 'Audit Complete'
            )
          : null
      )
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STEP CONTENT ROUTER
  // ══════════════════════════════════════════════════════════════════════════
  var stepRenderers = {
    1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4,
    5: renderStep5, 6: renderStep6, 7: renderStep7, 8: renderStep8,
    9: renderStep9, 10: renderStep10
  };

  var currentStepContent = (stepRenderers[espState.currentStep] || renderStep1)();

  // ── Step footer nav ──────────────────────────────────────────────────────
  var stepFooter = h('div', { style: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '32px', paddingTop: '24px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  } },
    espState.currentStep > 1
      ? h('button', {
          style: Object.assign({}, btnOutline, { display: 'flex', alignItems: 'center', gap: '6px' }),
          onclick: function () { goStep(espState.currentStep - 1); }
        }, icon('arrow_back', { style: { fontSize: '18px' } }), 'Step ' + (espState.currentStep - 1))
      : h('span'),
    h('span', { style: { fontSize: '13px', color: TEXT3, fontWeight: '600' } },
      'Step ' + espState.currentStep + ' of 10'
    ),
    espState.currentStep < 10
      ? h('button', {
          style: Object.assign({}, btnPrimary, { display: 'flex', alignItems: 'center', gap: '6px' }),
          onclick: function () { goStep(espState.currentStep + 1); }
        }, 'Step ' + (espState.currentStep + 1), icon('arrow_forward', { style: { fontSize: '18px' } }))
      : h('button', {
          style: Object.assign({}, btnGold, { display: 'flex', alignItems: 'center', gap: '6px' }),
          onclick: function () { showToast('Environmental Scan cycle complete! 🎉'); }
        }, icon('celebration', { style: { fontSize: '18px' } }), 'Complete Scan')
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  ASSEMBLE & RETURN
  // ══════════════════════════════════════════════════════════════════════════
  return h('div', {
    className: 'esp-dashboard',
    style: {
      padding: '2rem', maxWidth: '1100px', margin: '0 auto',
      fontFamily: FONT, color: TEXT, minHeight: '100vh'
    }
  },
    // Outer glass panel
    h('div', { style: {
      background: GLASS, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid ' + GLASS_BORDER, borderRadius: '20px',
      padding: '36px', boxShadow: '0 16px 64px rgba(0,0,0,0.6)'
    } },
      header,
      stepNav,
      currentStepContent,
      stepFooter
    )
  );
};
