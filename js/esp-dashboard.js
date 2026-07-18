/* ==========================================================================
   NC Small Farm Platform V.2 — ESP Dashboard
   Admin-only Environmental Scanning Process dashboard
   ========================================================================== */

window.renderESPDashboard = function() {
  const parcels = window.DEMO_PARCELS || [];
  
  const totalParcels = parcels.length;
  const highPriority = parcels.filter(p => p.priorityLevel === 'high').length;
  const eqipEligible = totalParcels; 
  
  let eqipTotal = 0;
  parcels.forEach(p => {
    if (p.eqipEstimate) {
      const parts = p.eqipEstimate.replace(/[^0-9-]/g, '').split('-');
      if (parts.length === 2) {
         eqipTotal += (parseInt(parts[0]) + parseInt(parts[1])) / 2;
      }
    }
  });

  const concernCounts = {};
  parcels.forEach(p => {
    (p.concerns || []).forEach(c => {
      concernCounts[c] = (concernCounts[c] || 0) + 1;
    });
  });

  const rankedConcerns = Object.keys(concernCounts)
    .map(c => ({ name: c, count: concernCounts[c] }))
    .sort((a, b) => b.count - a.count);

  const topConcern = rankedConcerns.length > 0 ? rankedConcerns[0].name : 'None';
  
  const soilCounts = {};
  parcels.forEach(p => {
    if (p.soilType) {
      soilCounts[p.soilType] = (soilCounts[p.soilType] || 0) + 1;
    }
  });
  let topSoil = 'Unknown';
  let maxSoil = 0;
  for (const s in soilCounts) {
    if (soilCounts[s] > maxSoil) { maxSoil = soilCounts[s]; topSoil = s; }
  }

  const highPriorityParcels = parcels
    .filter(p => p.priorityLevel === 'high')
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  return window.h('div', { className: 'esp-dashboard', style: 'padding: 2rem; max-width: 1400px; margin: 0 auto; color: white;' }, [
    window.h('h1', { style: 'font-size: 2rem; font-weight: 700; margin-bottom: 2rem;' }, ['ESP Dashboard — Guilford County Environmental Scan']),
    
    window.h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;' }, [
      createStatCard('Total Parcels Analyzed', totalParcels, 'analytics'),
      createStatCard('High Priority Farms', highPriority, 'warning'),
      createStatCard('EQIP Eligible', eqipEligible, 'check_circle'),
      createStatCard('Total Potential Funding', '$' + eqipTotal.toLocaleString(), 'payments')
    ]),

    window.h('div', { style: 'display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-bottom: 2rem;' }, [
      window.h('div', { className: 'glass-card', style: 'background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid var(--nrcs-green, #3B7A57);' }, [
        window.h('h2', { style: 'font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;' }, ['Priority Issues']),
        window.h('div', { style: 'display: flex; flex-direction: column; gap: 1rem;' }, 
          rankedConcerns.map(c => {
            const pct = Math.round((c.count / totalParcels) * 100) || 0;
            return window.h('div', {}, [
              window.h('div', { style: 'display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.25rem;' }, [
                window.h('span', {}, [c.name]),
                window.h('span', {}, [`${pct}% (${c.count})`])
              ]),
              window.h('div', { style: 'width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; height: 8px; overflow: hidden;' }, [
                window.h('div', { style: `width: ${pct}%; background: var(--aggie-gold, #FDB927); height: 100%;` }, [])
              ])
            ]);
          })
        )
      ]),

      window.h('div', { className: 'glass-card', style: 'background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid var(--aggie-blue, #004684);' }, [
        window.h('h2', { style: 'font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;' }, ['County Overview Snapshot']),
        window.h('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;' }, [
          createQuickStat('Most Common Soil', topSoil),
          createQuickStat('Top Concern', topConcern),
          createQuickStat('Highest Priority Township', 'Monroe'), 
          createQuickStat('Avg. Priority Score', Math.round(parcels.reduce((sum, p) => sum + (p.priorityScore || 0), 0) / (parcels.length || 1)))
        ]),
        window.h('div', { style: 'margin-top: 2rem;' }, [
          window.h('button', { 
            style: 'background: var(--nrcs-green, #3B7A57); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;',
            onclick: () => {
              const win = window.open('', '_blank');
              win.document.write(`
                <html><head><title>ESP Report</title><style>body{font-family: sans-serif; padding: 2rem;}</style></head>
                <body>
                  <h1>Guion 10-Step ESP Summary</h1>
                  <h3>Step 1-2: Secondary Data</h3>
                  <p>Analyzed ${totalParcels} parcels. Top concern: ${topConcern}.</p>
                  <h3>Step 6: Cross-Referenced Issues</h3>
                  <p>Major overlaps found between soil erosion and riparian zone degradation.</p>
                  <h3>Step 7: Assets</h3>
                  <p>Community partnerships, ag extension availability.</p>
                  <h3>Step 8: Prioritized Issues</h3>
                  <ul>${rankedConcerns.map(c => `<li>${c.name} (${c.count} farms)</li>`).join('')}</ul>
                </body></html>
              `);
            }
          }, [
            window.h('span', { className: 'material-icons' }, ['print']),
            'Generate ESP Report'
          ])
        ])
      ])
    ]),

    window.h('div', { className: 'glass-card', style: 'background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);' }, [
      window.h('h2', { style: 'font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;' }, ['High-Priority Outreach List']),
      window.h('div', { style: 'overflow-x: auto;' }, [
        window.h('table', { style: 'width: 100%; border-collapse: collapse; text-align: left;' }, [
          window.h('thead', {}, [
            window.h('tr', { style: 'border-bottom: 1px solid rgba(255,255,255,0.1);' }, [
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Rank']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Owner']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Address']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Acreage']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Top Concern']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['EQIP Est.']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Score']),
              window.h('th', { style: 'padding: 0.75rem; font-weight: 600; color: #aaa;' }, ['Action'])
            ])
          ]),
          window.h('tbody', {}, highPriorityParcels.map((p, index) => {
            return window.h('tr', { style: 'border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;' }, [
              window.h('td', { style: 'padding: 0.75rem;' }, [`#${index + 1}`]),
              window.h('td', { style: 'padding: 0.75rem;' }, [p.owner || 'Unknown']),
              window.h('td', { style: 'padding: 0.75rem;' }, [p.address || 'Unknown']),
              window.h('td', { style: 'padding: 0.75rem;' }, [`${p.acreage || 0} ac`]),
              window.h('td', { style: 'padding: 0.75rem;' }, [(p.concerns && p.concerns[0]) || 'None']),
              window.h('td', { style: 'padding: 0.75rem;' }, [p.eqipEstimate || '$0']),
              window.h('td', { style: 'padding: 0.75rem;' }, [
                window.h('span', { style: 'background: rgba(253,185,39,0.2); color: var(--aggie-gold, #FDB927); padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.85rem;' }, [p.priorityScore || 0])
              ]),
              window.h('td', { style: 'padding: 0.75rem;' }, [
                window.h('button', { 
                  style: 'background: rgba(255,255,255,0.1); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;',
                  onclick: () => {
                    if (window.st) {
                      window.st.currentParcel = p;
                      window.st.view = 'farm-assessment';
                      if (typeof window.render === 'function') window.render();
                    }
                  }
                }, ['View Assessment'])
              ])
            ]);
          }))
        ])
      ])
    ])
  ]);

  function createStatCard(title, value, icon) {
    return window.h('div', { className: 'glass-card stat-card', style: 'background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 1rem;' }, [
      window.h('div', { style: 'background: rgba(59,122,87,0.2); color: var(--nrcs-green, #3B7A57); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center;' }, [
        window.h('span', { className: 'material-icons' }, [icon])
      ]),
      window.h('div', {}, [
        window.h('div', { style: 'font-size: 0.85rem; color: #aaa; margin-bottom: 0.25rem;' }, [title]),
        window.h('div', { style: 'font-size: 1.5rem; font-weight: 700;' }, [String(value)])
      ])
    ]);
  }

  function createQuickStat(label, val) {
    return window.h('div', { style: 'background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;' }, [
      window.h('div', { style: 'font-size: 0.8rem; color: #aaa; margin-bottom: 0.25rem;' }, [label]),
      window.h('div', { style: 'font-weight: 600;' }, [String(val)])
    ]);
  }
};
