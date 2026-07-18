/* ==========================================================================
   NC Small Farm Platform V.2 — ESP Dashboard
   Admin-only Environmental Scanning Process dashboard
   ========================================================================== */

window.renderESPDashboard = function() {
  return window.h('div', { className: 'esp-dashboard', style: { padding: '3rem', maxWidth: '800px', margin: '0 auto', color: 'white', textAlign: 'center', fontFamily: 'Inter, sans-serif' } }, [
    window.h('h1', { style: { fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', color: '#f8fafc' } }, ['ESP Dashboard — Guilford County Environmental Scan']),
    
    window.h('div', { className: 'glass-card', style: { background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(16px)', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } }, [
      window.h('span', { className: 'material-icons-round', style: { fontSize: '48px', color: '#FDB927', marginBottom: '1rem', display: 'block' } }, ['dashboard_customize']),
      window.h('p', { style: { fontSize: '1.1rem', color: '#cbd5e1', lineHeight: '1.6' } }, [
        'ESP Dashboard will be populated with real farm assessment data as farmers complete their profiles.'
      ])
    ])
  ]);
};
