/* ==========================================================================
   NCSmall.Farm V.2 — Farm Assessment View
   ========================================================================== */

(function() {

  let miniMapInstance = null;

  window.renderFarmAssessment = function() {
    const st = window.st || {};
    const parcel = st.selectedParcel;

    if (!parcel) {
      return h('div', { className: 'p-8 text-center' },
        h('p', { className: 'text-gray-500 mb-4' }, 'No parcel selected.'),
        h('button', {
          className: 'btn-federal px-4 py-2 rounded-lg font-bold text-sm',
          onclick: () => {
            if (window.setView) window.setView('map-view');
            else { st.view = 'map-view'; window.render(); }
          }
        }, 'Back to Map')
      );
    }

    // Initialize mini map after DOM updates
    setTimeout(() => initMiniMap(parcel), 100);

    return h('div', { className: 'w-full max-w-6xl mx-auto p-4 md:p-8 fade-in space-y-6', style: { minHeight: '80vh' } },
      
      // Header & Actions
      h('div', { className: 'flex flex-col md:flex-row justify-between items-start md:items-center gap-4' },
        h('div', null,
          h('div', { className: 'inline-flex items-center gap-2 mb-2' },
            h('span', { 
              className: `px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-white ${
                parcel.priorityLevel === 'high' ? 'bg-red-500' :
                parcel.priorityLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`
            }, `${parcel.priorityLevel} Priority`),
            h('span', { className: 'text-xs font-bold text-gray-400 uppercase tracking-widest' }, `ID: ${parcel.id}`)
          ),
          h('h1', { className: 'text-2xl md:text-3xl font-black text-aggie-blue tracking-tight' }, parcel.owner),
          h('p', { className: 'text-gray-500 font-medium mt-1 flex items-center gap-1' },
            h('span', { className: 'material-icons-round text-sm' }, 'location_on'),
            parcel.address
          )
        ),
        h('div', { className: 'flex flex-wrap gap-2' },
          h('button', {
            className: 'flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm',
            onclick: () => {
              if (window.setView) window.setView('map-view');
              else { st.view = 'map-view'; window.render(); }
            }
          }, h('span', { className: 'material-icons-round text-sm' }, 'arrow_back'), 'Back to Map'),
          
          h('button', {
            className: 'flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm',
            onclick: () => alert('CesiumJS 3D view — available in Professional Mode')
          }, h('span', { className: 'material-icons-round text-sm text-aggie-gold' }, '3d_rotation'), 'View in 3D'),
          
          h('button', {
            className: 'flex items-center gap-2 px-4 py-2 bg-aggie-blue text-white rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors shadow-md',
            onclick: () => generateFarmReport(parcel)
          }, h('span', { className: 'material-icons-round text-sm' }, 'picture_as_pdf'), 'Download PDF')
        )
      ),

      // Main Grid
      h('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
        
        // Left Column
        h('div', { className: 'lg:col-span-2 space-y-6' },
          
          // Resource Concerns
          h('div', { className: 'glass p-6 rounded-2xl shadow-lg border-t border-white/40' },
            h('h2', { className: 'flex items-center gap-2 text-lg font-bold text-gray-800 mb-4' },
              h('span', { className: 'material-icons-round text-red-500' }, 'warning'), 'Resource Concerns Detected'
            ),
            h('div', { className: 'space-y-3' },
              ...parcel.concerns.map(c => 
                h('div', { className: 'p-3 bg-red-50 rounded-lg border-l-4 border-red-500 text-gray-800 font-medium flex items-start gap-3' },
                  h('span', { className: 'material-icons-round text-red-500 text-sm mt-0.5' }, 'priority_high'),
                  c
                )
              )
            )
          ),

          // Practices
          h('div', { className: 'glass p-6 rounded-2xl shadow-lg border-t border-white/40' },
            h('h2', { className: 'flex items-center gap-2 text-lg font-bold text-gray-800 mb-4' },
              h('span', { className: 'material-icons-round text-nrcs-green' }, 'eco'), 'Recommended NRCS Practices'
            ),
            h('div', { className: 'space-y-3' },
              ...parcel.practices.map(p => 
                h('div', { className: 'p-3 bg-green-50 rounded-lg border-l-4 border-nrcs-green flex items-center justify-between gap-4' },
                  h('div', null,
                    h('span', { className: 'inline-block bg-nrcs-green text-white text-xs font-bold px-2 py-0.5 rounded mr-2' }, p.code),
                    h('span', { className: 'text-gray-800 font-bold' }, p.name)
                  ),
                  h('span', { 
                    className: `text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      p.priority === 'high' ? 'bg-red-100 text-red-700' :
                      p.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`
                  }, p.priority)
                )
              )
            )
          ),

          // Next Steps
          h('div', { className: 'glass p-6 rounded-2xl shadow-lg border-t border-white/40' },
            h('h2', { className: 'flex items-center gap-2 text-lg font-bold text-gray-800 mb-4' },
              h('span', { className: 'material-icons-round text-aggie-blue' }, 'format_list_numbered'), 'Next Steps'
            ),
            h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              createNextStep(1, 'Contact NRCS', 'Schedule a consultation with your local field office.'),
              createNextStep(2, 'Review EQIP', 'Verify eligibility and ranking criteria for funding.'),
              createNextStep(3, 'Find a TSP', 'Locate a Technical Service Provider for plan creation.'),
              createNextStep(4, 'Complete AgLearn', 'Take free modules on recommended practices.')
            )
          )
        ),

        // Right Column
        h('div', { className: 'space-y-6' },
          
          // Mini Map
          h('div', { className: 'glass p-1 rounded-2xl shadow-lg border-t border-white/40 overflow-hidden' },
            h('div', { id: 'mini-farm-map', className: 'w-full h-64 rounded-xl z-0' })
          ),

          // EQIP Funding
          h('div', { className: 'glass p-6 rounded-2xl shadow-lg border-t border-white/40 bg-gradient-to-br from-white to-blue-50' },
            h('h2', { className: 'flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest mb-4' },
              h('span', { className: 'material-icons-round text-aggie-gold' }, 'monetization_on'), 'EQIP Funding Potential'
            ),
            h('div', { className: 'text-3xl font-black text-aggie-blue mb-2' }, parcel.eqipEstimate),
            h('div', { className: 'inline-flex items-center gap-1 text-sm font-bold text-nrcs-green bg-green-100 px-3 py-1 rounded-full' },
              h('span', { className: 'material-icons-round text-sm' }, 'check_circle'), 'Eligible for Assessment'
            )
          ),

          // Property Details
          h('div', { className: 'glass p-6 rounded-2xl shadow-lg border-t border-white/40' },
            h('h2', { className: 'text-sm font-bold text-gray-500 uppercase tracking-widest mb-4' }, 'Property Details'),
            h('div', { className: 'space-y-3' },
              createDetailRow('Acreage', parcel.acreage + ' ac'),
              createDetailRow('Soil Type', parcel.soilType),
              createDetailRow('Drainage', parcel.soilDrainage),
              createDetailRow('Slope', parcel.slopePct),
              createDetailRow('Flood Zone', parcel.floodZone),
              createDetailRow('Wetlands', parcel.wetlands ? 'Present' : 'None detected'),
              createDetailRow('Stream Proximity', parcel.streamProximity)
            )
          )
        )
      )
    );
  };

  function createNextStep(num, title, desc) {
    return h('div', { className: 'flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm' },
      h('div', { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-aggie-blue text-white flex items-center justify-center font-black text-sm' }, num),
      h('div', null,
        h('div', { className: 'font-bold text-gray-800 text-sm' }, title),
        h('div', { className: 'text-xs text-gray-500 mt-1' }, desc)
      )
    );
  }

  function createDetailRow(label, value) {
    return h('div', { className: 'flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0' },
      h('span', { className: 'text-sm text-gray-500 font-medium' }, label),
      h('span', { className: 'text-sm font-bold text-gray-800 text-right max-w-[60%]' }, value)
    );
  }

  function initMiniMap(parcel) {
    if (!window.L) return;
    const container = document.getElementById('mini-farm-map');
    if (!container) return;

    if (miniMapInstance) {
      miniMapInstance.remove();
      miniMapInstance = null;
    }

    miniMapInstance = L.map('mini-farm-map', {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false
    }).setView([parcel.lat, parcel.lon], 15);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri'
    }).addTo(miniMapInstance);

    L.circleMarker([parcel.lat, parcel.lon], {
      radius: 12,
      fillColor: '#FDB927', // Aggie Gold
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(miniMapInstance);
  }

  function generateFarmReport(parcel) {
    const now = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    
    const concernsHtml = parcel.concerns.map(c =>
      `<li style="margin:6px 0;padding:8px 12px;background:#fff5f5;border-radius:8px;border-left:4px solid #e53e3e;">${c}</li>`
    ).join('');
    
    const practicesHtml = parcel.practices.map(p =>
      `<li style="margin:6px 0;padding:8px 12px;background:#f0fff4;border-radius:8px;border-left:4px solid #3B7A57;"><strong>[${p.code}]</strong> ${p.name} <span class="badge" style="float:right;background:#e2e8f0;color:#475569;">${p.priority}</span></li>`
    ).join('');

    const mapImg = `<img src="https://static-maps.yandex.ru/v1?ll=${parcel.lon},${parcel.lat}&z=15&size=600,300&l=sat" onerror="this.style.display='none'" style="width:100%;border-radius:12px;margin:16px 0;object-fit:cover;height:250px;" alt="Site Map">`;

    const html = `<!DOCTYPE html><html><head><title>Farm Assessment — ${parcel.id}</title>
<style>
  *{margin:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1e293b}
  .header{background:linear-gradient(135deg,#004684,#002D56);color:white;padding:32px;border-radius:16px;margin-bottom:32px}
  h1{font-size:28px;margin-bottom:4px}
  h2{font-size:18px;margin:24px 0 12px;color:#004684;text-transform:uppercase;letter-spacing:1px;font-weight:900}
  ul{list-style:none;padding:0}
  .section{background:#f8fafc;padding:24px;border-radius:12px;margin:16px 0;border:1px solid #e2e8f0}
  .badge{display:inline-block;background:#FDB927;color:#004684;font-weight:900;font-size:11px;padding:4px 12px;border-radius:20px;text-transform:uppercase}
  .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px}
  .details-grid div{padding:8px;border-bottom:1px solid #e2e8f0}
  .details-grid span{color:#64748b;font-weight:600;display:block;font-size:12px;text-transform:uppercase}
  .next-step{padding:12px 16px;background:white;border-radius:10px;border:1px solid #e2e8f0;margin:8px 0;display:flex;align-items:center;gap:12px}
  .next-step .num{width:28px;height:28px;background:#004684;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex-shrink:0}
  .rpt-footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center}
  @media print{body{padding:20px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}}
</style></head>
<body>
  <div class="header">
    <div class="badge">NCSmall.Farm Assessment</div>
    <h1 style="margin-top:16px">${parcel.owner}</h1>
    <p style="opacity:.85;margin-top:4px">${parcel.address}</p>
    <p style="opacity:.7;font-size:13px;margin-top:8px">Generated: ${now} | Parcel ID: ${parcel.id}</p>
  </div>
  
  ${mapImg}
  
  <div class="details-grid section" style="margin-bottom:24px">
    <div><span>Acreage</span><strong>${parcel.acreage} ac</strong></div>
    <div><span>Priority Score</span><strong>${parcel.priorityScore} (${parcel.priorityLevel})</strong></div>
    <div><span>Soil Type</span><strong>${parcel.soilType}</strong></div>
    <div><span>Drainage</span><strong>${parcel.soilDrainage}</strong></div>
    <div><span>Slope</span><strong>${parcel.slopePct}</strong></div>
    <div><span>Flood Zone</span><strong>${parcel.floodZone}</strong></div>
  </div>

  <h2>Resource Concerns Detected</h2>
  <div class="section"><ul>${concernsHtml || '<li>No specific concerns identified</li>'}</ul></div>
  
  <h2>Recommended NRCS Practices</h2>
  <div class="section"><ul>${practicesHtml || '<li>No specific practices matched</li>'}</ul></div>
  
  <h2>EQIP Funding Estimate</h2>
  <div class="section">
    <div style="font-size:24px;font-weight:900;color:#004684">${parcel.eqipEstimate}</div>
    <p style="color:#3B7A57;font-size:14px;font-weight:700;margin-top:4px">✓ Eligible for Assessment</p>
  </div>
  
  <h2>Recommended Next Steps</h2>
  <div class="section">
    <div class="next-step"><div class="num">1</div><div><strong>Contact Your Local NRCS Office</strong></div></div>
    <div class="next-step"><div class="num">2</div><div><strong>Review EQIP Eligibility</strong></div></div>
    <div class="next-step"><div class="num">3</div><div><strong>Engage a Technical Service Provider (TSP)</strong></div></div>
    <div class="next-step"><div class="num">4</div><div><strong>Complete AgLearn Training</strong></div></div>
  </div>
  
  <div class="rpt-footer">
    <p>This report was generated by NCSmall.Farm V.2.</p>
    <p style="margin-top:4px">Disclaimer: This is a simulated assessment for planning purposes only. Official assessments require an on-site visit by certified NRCS personnel.</p>
  </div>
  
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#004684;color:white;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2)">Print / Save as PDF</button>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) { 
      win.document.write(html); 
      win.document.close(); 
    }
  }

})();
