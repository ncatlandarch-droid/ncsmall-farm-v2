/* ==========================================================================
   NCSmall.Farm V.2 — Calendar Page
   Extension events, workshops, trainings, and key dates
   ========================================================================== */

(function() {

  const EVENTS = [
    { date: '2026-07-15', title: 'Small Farm Field Day', location: 'CH Moore Agricultural Research Station', type: 'field-day', desc: 'Hands-on demonstrations of conservation practices, cover crops, and soil health for small farms.' },
    { date: '2026-07-22', title: 'EQIP Application Workshop', location: 'Virtual (Zoom)', type: 'workshop', desc: 'Step-by-step guidance on applying for the Environmental Quality Incentives Program (EQIP).' },
    { date: '2026-08-05', title: 'GAP Certification Training', location: 'Guilford County Extension Center', type: 'training', desc: 'Good Agricultural Practices certification training for produce growers and small farmers.' },
    { date: '2026-08-19', title: 'Community Asset Mapping Workshop', location: 'Virtual (Zoom)', type: 'workshop', desc: 'Learn Asset-Based Community Development (ABCD) methods to identify and leverage community strengths.' },
    { date: '2026-09-03', title: 'Farm Financial Planning Seminar', location: 'NC A&T Campus', type: 'workshop', desc: 'Financial literacy for farm families — budgeting, record keeping, and accessing USDA financial resources.' },
    { date: '2026-09-15', title: 'Fall Harvest Festival & Community Day', location: 'CH Moore Agricultural Research Station', type: 'field-day', desc: 'Community celebration with farm tours, local food vendors, and Extension resource tables.' },
    { date: '2026-10-01', title: 'Grant Writing Workshop', location: 'NC A&T Campus', type: 'training', desc: 'Practical grant writing skills for community organizations and small farm cooperatives.' },
    { date: '2026-10-20', title: 'Conservation Planning Basics', location: 'Virtual (Zoom)', type: 'workshop', desc: 'Introduction to NRCS conservation planning process and available technical assistance.' },
    { date: '2026-11-05', title: 'Ag Market Development Workshop', location: 'NC A&T Campus', type: 'workshop', desc: 'Learn strategies for accessing farmers markets, CSA programs, and direct-to-consumer sales channels.' },
    { date: '2026-11-18', title: 'Small Farm Business Planning', location: 'Virtual (Zoom)', type: 'training', desc: 'Business plan development for small and beginning farmers — record keeping, marketing, and financial management.' }
  ];

  const TYPE_COLORS = {
    'training':  { bg: 'rgba(0, 70, 132, 0.08)', border: 'var(--aggie-blue)', badge: 'var(--aggie-blue)', label: 'Training' },
    'workshop':  { bg: 'rgba(59, 122, 87, 0.08)', border: 'var(--nrcs-green)', badge: 'var(--nrcs-green)', label: 'Workshop' },
    'field-day': { bg: 'rgba(253, 185, 39, 0.08)', border: 'var(--aggie-gold)', badge: '#b8860b',         label: 'Field Day' }
  };

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  window.renderCalendar = function() {
    const sorted = [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));

    return h('div', { className: 'w-full mx-auto fade-in', style: { maxWidth: '900px' } },
      h('h1', { style: { fontSize: '2.25rem', fontWeight: '900', color: 'var(--aggie-blue)', marginBottom: '0.5rem', textAlign: 'center' } }, 'Events & Calendar'),
      h('p', { style: { fontSize: '1.05rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem', lineHeight: '1.6' } },
        'Upcoming workshops, trainings, field days, and community events from NC A&T and NC Cooperative Extension.'
      ),
      h('div', { style: { textAlign: 'center', marginBottom: '1.5rem' } },
        h('button', {
          className: 'btn-federal px-5 py-3 rounded-lg font-bold text-sm',
          style: { backgroundColor: 'var(--aggie-gold)', color: '#1a1a1a' },
          onClick: () => window.open('https://docs.google.com/forms/d/e/ncsmall-event-submit/viewform', '_blank')
        }, 'Submit an Event'),
        h('p', { style: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' } },
          'Event submissions route to an approver in OI. ',
          h('a', { href: 'https://cre.openfuturecoalition.org', target: '_blank', style: { color: 'var(--aggie-blue)', fontWeight: '600' } }, 'Self-approve via OI Portal')
        )
      ),

      h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' } },
        ...Object.values(TYPE_COLORS).map(tc =>
          h('span', { style: { fontSize: '0.8rem', fontWeight: '700', color: tc.badge, padding: '4px 12px', borderRadius: '20px', background: tc.bg, border: `1px solid ${tc.border}` } }, tc.label)
        )
      ),

      ...sorted.map(evt => {
        const tc = TYPE_COLORS[evt.type] || TYPE_COLORS['workshop'];
        return h('div', {
          className: 'glass rounded-2xl p-6 shadow-md border mb-5 card-hover',
          style: { borderLeft: `5px solid ${tc.border}`, background: tc.bg }
        },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' } },
            h('div', { style: { flex: '1' } },
              h('h3', { style: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--aggie-blue)', marginBottom: '4px' } }, evt.title),
              h('p', { style: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.6' } }, evt.desc),
              h('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', alignItems: 'center' } },
                h('span', { className: 'flex items-center gap-1' }, h('span', { className: 'material-icons-round' }, 'place'), evt.location),
                h('span', { className: 'flex items-center gap-1' }, h('span', { className: 'material-icons-round' }, 'event'), formatDate(evt.date))
              )
            ),
            h('span', { style: { fontSize: '0.75rem', fontWeight: '700', color: tc.badge, padding: '3px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.8)', border: `1px solid ${tc.border}`, whiteSpace: 'nowrap', flexShrink: 0 } }, tc.label)
          )
        );
      }),

      h('div', { className: 'glass rounded-2xl p-6 shadow-md border border-light mt-4', style: { textAlign: 'center' } },
        h('h2', { style: { fontSize: '1.3rem', fontWeight: '800', color: 'var(--aggie-blue)', marginBottom: '1rem' } }, 'More NC A&T Events'),
        h('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
          h('a', {
            href: 'https://www.ncat.edu/news/events/index.php',
            target: '_blank',
            className: 'btn-federal px-5 py-3 rounded-lg font-bold text-sm',
            style: { textDecoration: 'none', display: 'inline-block' }
          }, 'NC A&T Events'),
          h('a', {
            href: 'https://www.ces.ncsu.edu/events/',
            target: '_blank',
            className: 'btn-federal px-5 py-3 rounded-lg font-bold text-sm',
            style: { textDecoration: 'none', display: 'inline-block', backgroundColor: 'var(--nrcs-green)' }
          }, 'NC Extension Events')
        )
      )
    );
  };

})();
