window.renderESPDashboard = function() {
  const h = window.h;

  // Initialize state
  const st = window._espState || (window._espState = {
    currentStep: 1,
    county: 'Guilford',
    issues: [],
    stakeholderResponses: [],
    citizenResponses: [],
    priorities: [],
    assets: []
  });

  // Global styles
  const theme = {
    bgDark: 'rgba(10,14,23,0.9)',
    cardBg: 'rgba(255,255,255,0.04)',
    cardBorder: '1px solid rgba(255,255,255,0.08)',
    primary: '#3B7A57',
    gold: '#FDB927',
    blue: '#004684',
    textLight: '#ffffff',
    textMuted: 'rgba(255,255,255,0.6)',
    fontFamily: '"Inter", sans-serif'
  };

  const cardStyle = `background: ${theme.cardBg}; border: ${theme.cardBorder}; border-radius: 12px; padding: 20px; backdrop-filter: blur(16px);`;
  const inputStyle = `background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 14px; border-radius: 8px; width: 100%; font-family: ${theme.fontFamily};`;
  const btnPrimaryStyle = `background: ${theme.primary}; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: ${theme.fontFamily};`;
  const btnGoldStyle = `background: ${theme.gold}; color: #111; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: ${theme.fontFamily};`;

  // Root container
  const container = h('div', {
    className: 'esp-dashboard',
    style: `display: flex; flex-direction: column; gap: 24px; padding: 24px; color: ${theme.textLight}; font-family: ${theme.fontFamily}; min-height: 100vh;`
  });

  // Main render loop
  function render() {
    container.innerHTML = '';

    // Header
    const progressPercent = (st.currentStep / 10) * 100;
    const header = h('div', { style: 'display: flex; flex-direction: column; gap: 12px;' },
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
        h('h1', { style: 'margin: 0; font-size: 24px; font-weight: 700;' }, `Environmental Scanning Dashboard — ${st.county} County`),
        h('div', { style: `color: ${theme.gold}; font-weight: 600;` }, `Step ${st.currentStep} of 10`)
      ),
      h('div', { style: `height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;` },
        h('div', { style: `height: 100%; width: ${progressPercent}%; background: ${theme.gold}; transition: width 0.3s ease;` })
      )
    );

    // Step Navigator
    const steps = [
      'Situational Analysis', 'Key Issues', 'Stakeholder Input', 'County Mapping',
      'Citizen Data Collection', 'Triangulation', 'Asset Mapping', 'Priority Dashboard',
      'Executive Dashboard', 'Database & ERP'
    ];

    const navigator = h('div', { style: 'display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;' },
      ...steps.map((name, idx) => {
        const stepNum = idx + 1;
        const isActive = st.currentStep === stepNum;
        const isCompleted = stepNum < st.currentStep;
        
        let bg = 'rgba(255,255,255,0.05)';
        let color = theme.textMuted;
        let border = '1px solid transparent';
        
        if (isActive) {
          bg = theme.gold;
          color = '#111';
        } else if (isCompleted) {
          bg = 'rgba(59, 122, 87, 0.2)';
          color = theme.primary;
          border = `1px solid ${theme.primary}`;
        }

        return h('button', {
          style: `white-space: nowrap; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; background: ${bg}; color: ${color}; border: ${border}; cursor: pointer; transition: 0.2s;`,
          onclick: () => { st.currentStep = stepNum; render(); }
        }, 
        isCompleted && !isActive ? h('span', { style: 'margin-right: 6px;' }, '✓ ') : null,
        `${stepNum}. ${name}`);
      })
    );

    // Step Content Wrapper
    const contentArea = h('div', { style: 'flex-grow: 1;' });

    // Render logic per step
    switch (st.currentStep) {
      case 1: contentArea.appendChild(renderStep1()); break;
      case 2: contentArea.appendChild(renderStep2()); break;
      case 3: contentArea.appendChild(renderStep3()); break;
      case 4: contentArea.appendChild(renderStep4()); break;
      case 5: contentArea.appendChild(renderStep5()); break;
      case 6: contentArea.appendChild(renderStep6()); break;
      case 7: contentArea.appendChild(renderStep7()); break;
      case 8: contentArea.appendChild(renderStep8()); break;
      case 9: contentArea.appendChild(renderStep9()); break;
      case 10: contentArea.appendChild(renderStep10()); break;
    }

    container.appendChild(header);
    container.appendChild(navigator);
    container.appendChild(contentArea);
  }

  function showToast(msg) {
    const toast = h('div', {
      style: `position: fixed; bottom: 20px; right: 20px; background: ${theme.primary}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999; animation: fadeInOut 3s forwards;`
    }, msg);
    
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.innerHTML = `@keyframes fadeInOut { 0% { opacity: 0; transform: translateY(10px); } 10% { opacity: 1; transform: translateY(0); } 90% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(10px); } }`;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ==== STEP RENDERERS ====

  function renderStep1() {
    const categories = ['Demographics', 'Economic', 'Health/Social', 'Education', 'Agriculture', 'Environmental', 'Opportunity'];
    
    const thStyle = `text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); color: ${theme.textMuted}; font-weight: 500;`;
    const tdStyle = `padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);`;

    const table = h('table', { style: 'width: 100%; border-collapse: collapse; margin-top: 16px;' },
      h('thead', {}, 
        h('tr', {},
          h('th', { style: thStyle }, 'Data Category'),
          h('th', { style: thStyle }, 'Source'),
          h('th', { style: thStyle }, 'State Average'),
          h('th', { style: thStyle }, 'My County'),
          h('th', { style: thStyle }, 'Neighbor 1'),
          h('th', { style: thStyle }, 'Neighbor 2')
        )
      ),
      h('tbody', {},
        ...categories.map(cat => h('tr', {},
          h('td', { style: `${tdStyle} font-weight: 600; color: ${theme.gold};` }, cat),
          h('td', { style: tdStyle }, 'US Census / NASS'),
          h('td', { style: tdStyle }, '—'),
          h('td', { style: tdStyle }, '—'),
          h('td', { style: tdStyle }, '—'),
          h('td', { style: tdStyle }, '—')
        ))
      )
    );

    return h('div', { style: cardStyle },
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' },
        h('h2', { style: 'margin: 0; font-size: 18px;' }, 'Situational Analysis Data'),
        h('div', { style: 'display: flex; gap: 12px;' },
          h('button', { style: btnPrimaryStyle, onclick: () => showToast('API integration coming soon') }, 'Load Census Data'),
          h('button', { style: btnPrimaryStyle, onclick: () => showToast('API integration coming soon') }, 'Load NASS Data')
        )
      ),
      table
    );
  }

  function renderStep2() {
    const categories = ['Demographics', 'Economic', 'Health', 'Education', 'Agriculture', 'Environmental'];
    
    const formRows = Array.from({ length: 5 }).map((_, i) => {
      return h('div', { style: 'display: flex; gap: 16px; margin-bottom: 16px;' },
        h('input', { style: `${inputStyle} flex: 2;`, placeholder: `Area of Concern ${i + 1}`, id: `concern-${i}` }),
        h('select', { style: `${inputStyle} flex: 1;` }, 
          ...categories.map(c => h('option', { value: c }, c))
        )
      );
    });

    return h('div', { style: cardStyle },
      h('h2', { style: 'margin: 0 0 16px 0; font-size: 18px;' }, 'Key Issues Identification'),
      h('p', { style: `color: ${theme.textMuted}; margin-bottom: 24px;` }, 'Based on your situational analysis, identify the top 5 areas of concern for your county.'),
      ...formRows,
      h('button', { 
        style: `${btnGoldStyle} margin-top: 16px;`, 
        onclick: () => showToast('Issues saved to state.') 
      }, 'Save Issues')
    );
  }

  function renderStep3() {
    const groups = [
      'Advisory Leadership Council', 'County Officials', 'Non-profit Leaders', 
      'Local Business Owners', 'Residents & Property Owners', 'Other'
    ];

    const grid = h('div', { style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 20px;' },
      ...groups.map(g => h('div', { style: `${cardStyle} display: flex; flex-direction: column; justify-content: space-between; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1);` },
        h('div', { style: 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;' },
          h('h3', { style: 'margin: 0; font-size: 16px; font-weight: 600;' }, g),
          h('span', { style: `background: rgba(253, 185, 39, 0.2); color: ${theme.gold}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 700;` }, '0 Responses')
        ),
        h('button', { style: btnPrimaryStyle, onclick: () => showToast(`Opening form for ${g}...`) }, '+ Add Response')
      ))
    );

    return h('div', {},
      h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px;' }, 'Stakeholder Input'),
      h('p', { style: `color: ${theme.textMuted}; margin: 0;` }, 'Record qualitative feedback from key county stakeholder groups.'),
      grid
    );
  }

  function renderStep4() {
    return h('div', { style: cardStyle },
      h('div', { style: 'text-align: center; padding: 40px 20px;' },
        h('div', { style: `font-size: 48px; margin-bottom: 16px;` }, '🗺️'),
        h('h2', { style: 'margin: 0 0 16px 0; font-size: 24px;' }, 'County GIS Mapping'),
        h('p', { style: `color: ${theme.textMuted}; max-width: 600px; margin: 0 auto 32px auto; line-height: 1.6;` }, 
          'The county map provides real-time GIS analysis of farm parcels, soils, zoning, flood zones, wetlands, and more. Use this spatial data to validate geographic disparities and opportunities.'
        ),
        h('button', { 
          style: `${btnGoldStyle} font-size: 16px; padding: 12px 32px;`,
          onclick: () => {
            if (window.setView) window.setView('map');
            else showToast('Map view triggered');
          }
        }, 'Open County Map →')
      )
    );
  }

  function renderStep5() {
    const modes = [
      { title: 'Electronic Survey', desc: 'Shareable link for online distribution', count: 142 },
      { title: 'Digital In-Person', desc: 'Interviewer tablet collection', count: 38 },
      { title: 'Physical', desc: 'Paper forms (requires manual data entry)', count: 12 }
    ];

    const cards = h('div', { style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px;' },
      ...modes.map(m => h('div', { style: cardStyle },
        h('h3', { style: 'margin: 0 0 8px 0; font-size: 16px;' }, m.title),
        h('p', { style: `color: ${theme.textMuted}; font-size: 13px; margin: 0 0 16px 0; min-height: 32px;` }, m.desc),
        h('div', { style: 'display: flex; align-items: baseline; gap: 8px;' },
          h('span', { style: 'font-size: 32px; font-weight: 700;' }, m.count),
          h('span', { style: `color: ${theme.textMuted}; font-size: 13px;` }, 'records')
        )
      ))
    );

    const gapAnalysis = h('div', { style: `${cardStyle} margin-top: 24px; border-left: 4px solid ${theme.gold};` },
      h('h3', { style: 'margin: 0 0 12px 0; font-size: 16px;' }, 'Demographic Gap Analysis'),
      h('p', { style: `color: ${theme.textMuted}; font-style: italic; margin: 0;` }, 'Placeholder: Compare citizen response demographics against county census baselines to identify underrepresented populations.')
    );

    return h('div', {},
      h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px;' }, 'Citizen Data Collection'),
      h('p', { style: `color: ${theme.textMuted}; margin: 0;` }, 'Track responses from broad citizen engagement efforts.'),
      cards,
      gapAnalysis
    );
  }

  function renderStep6() {
    const colStyle = `flex: 1; ${cardStyle}`;
    const headerStyle = `font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${theme.textMuted}; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);`;
    
    const validatedBadge = h('div', { style: `margin-top: 12px; background: rgba(253, 185, 39, 0.15); border: 1px solid ${theme.gold}; color: ${theme.gold}; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;` }, '★ Validated Priority');

    const issueItem = (text, isValidated = false) => h('div', { style: 'background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 12px;' },
      h('div', { style: 'font-weight: 500;' }, text),
      isValidated ? validatedBadge : null
    );

    return h('div', {},
      h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px;' }, 'Triangulation'),
      h('p', { style: `color: ${theme.textMuted}; margin: 0 0 24px 0;` }, 'Issues appearing across multiple data sources become validated priorities.'),
      h('div', { style: 'display: flex; gap: 16px;' },
        h('div', { style: colStyle },
          h('h3', { style: headerStyle }, 'Secondary Data Issues'),
          issueItem('Aging Farm Operator Demographics', true),
          issueItem('Food Desert Expansion in Rural Zones')
        ),
        h('div', { style: colStyle },
          h('h3', { style: headerStyle }, 'Stakeholder Issues'),
          issueItem('Youth Retention in Agriculture'),
          issueItem('Aging Farm Operator Demographics', true)
        ),
        h('div', { style: colStyle },
          h('h3', { style: headerStyle }, 'Citizen Issues'),
          issueItem('Aging Farm Operator Demographics', true),
          issueItem('Limited Access to High-Speed Internet')
        )
      )
    );
  }

  function renderStep7() {
    return h('div', { style: cardStyle },
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;' },
        h('h2', { style: 'margin: 0; font-size: 18px;' }, 'Community Asset Mapping'),
        h('button', { style: btnPrimaryStyle }, '+ Add Asset')
      ),
      h('input', { style: `${inputStyle} margin-bottom: 16px;`, placeholder: 'Search assets and partners...' }),
      h('table', { style: 'width: 100%; border-collapse: collapse; text-align: left;' },
        h('thead', {},
          h('tr', { style: `border-bottom: 1px solid rgba(255,255,255,0.1); color: ${theme.textMuted};` },
            h('th', { style: 'padding: 12px;' }, 'Name'),
            h('th', { style: 'padding: 12px;' }, 'Type'),
            h('th', { style: 'padding: 12px;' }, 'Contact'),
            h('th', { style: 'padding: 12px;' }, 'Services'),
            h('th', { style: 'padding: 12px; width: 50px;' }, '')
          )
        ),
        h('tbody', {},
          h('tr', { style: 'border-bottom: 1px solid rgba(255,255,255,0.05);' },
            h('td', { style: 'padding: 12px; font-weight: 500;' }, 'Guilford County Soil & Water'),
            h('td', { style: 'padding: 12px;' }, 'Government'),
            h('td', { style: 'padding: 12px;' }, 'Jane Doe (jdoe@...)'),
            h('td', { style: 'padding: 12px;' }, 'Conservation Planning, Grants'),
            h('td', { style: 'padding: 12px; text-align: center;' }, h('button', { style: 'background: transparent; border: none; color: #ff4444; cursor: pointer;' }, '✕'))
          )
        )
      ),
      h('div', { style: `margin-top: 32px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 4px solid ${theme.primary};` },
        h('h4', { style: 'margin: 0 0 8px 0;' }, 'Asset Gap Analysis'),
        h('p', { style: `color: ${theme.textMuted}; margin: 0; font-size: 14px;` }, 'Review the resources needed to address your validated priorities. Identify missing partnerships required to execute your plan.')
      )
    );
  }

  function renderStep8() {
    const listStyle = `background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; display: flex; align-items: center; gap: 16px; margin-bottom: 8px;`;
    
    return h('div', { style: cardStyle },
      h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px;' }, 'Priority Dashboard'),
      h('p', { style: `color: ${theme.textMuted}; margin: 0 0 24px 0;` }, 'Rank the validated issues by severity and strategic alignment to form your top focus areas.'),
      
      h('div', { style: `${listStyle} border-left: 4px solid ${theme.gold};` },
        h('div', { style: 'display: flex; flex-direction: column; gap: 4px; color: rgba(255,255,255,0.5); cursor: pointer;' },
          h('span', {}, '▲'), h('span', {}, '▼')
        ),
        h('div', { style: 'flex: 1;' },
          h('h4', { style: 'margin: 0 0 4px 0; font-size: 16px;' }, '1. Aging Farm Operator Demographics'),
          h('div', { style: `color: ${theme.textMuted}; font-size: 12px;` }, 'Freq: High | Urgency: Critical')
        ),
        h('label', { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;' },
          h('input', { type: 'checkbox', checked: true }),
          'Strategic Alignment'
        )
      ),
      h('div', { style: listStyle },
        h('div', { style: 'display: flex; flex-direction: column; gap: 4px; color: rgba(255,255,255,0.5); cursor: pointer;' },
          h('span', {}, '▲'), h('span', {}, '▼')
        ),
        h('div', { style: 'flex: 1;' },
          h('h4', { style: 'margin: 0 0 4px 0; font-size: 16px;' }, '2. Broadband Infrastructure Gaps'),
          h('div', { style: `color: ${theme.textMuted}; font-size: 12px;` }, 'Freq: Med | Urgency: High')
        ),
        h('label', { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;' },
          h('input', { type: 'checkbox', checked: false }),
          'Strategic Alignment'
        )
      )
    );
  }

  function renderStep9() {
    const summaryCards = [
      { label: 'Total Issues Identified', value: '24' },
      { label: 'Validated Priorities', value: '5', highlight: theme.gold },
      { label: 'Community Assets', value: '18' },
      { label: 'Stakeholder Groups Engaged', value: '6' }
    ];

    return h('div', {},
      h('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;' },
        h('h2', { style: 'margin: 0; font-size: 20px;' }, 'Executive Summary'),
        h('button', { style: btnGoldStyle }, 'Generate Official Report PDF')
      ),
      h('div', { style: 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;' },
        ...summaryCards.map(s => h('div', { style: cardStyle },
          h('div', { style: `color: ${s.highlight || theme.textLight}; font-size: 36px; font-weight: 700; margin-bottom: 8px;` }, s.value),
          h('div', { style: `color: ${theme.textMuted}; font-size: 14px; font-weight: 500;` }, s.label)
        ))
      ),
      h('div', { style: `${cardStyle} min-height: 300px; display: flex; align-items: center; justify-content: center;` },
        h('span', { style: `color: ${theme.textMuted}; font-style: italic;` }, '[ Chart Visualization Area ]')
      )
    );
  }

  function renderStep10() {
    const checks = [
      'Process documented internally',
      'Process improvements identified',
      'Priorities routed to CES system',
      'Ag tech priorities routed to SFRIC (Small Farm Research & Innovation Center)',
      'ABCD (Asset-Based Community Development) plan created'
    ];

    return h('div', { style: cardStyle },
      h('h2', { style: 'margin: 0 0 8px 0; font-size: 18px;' }, 'Database & ERP Handoff'),
      h('p', { style: `color: ${theme.textMuted}; margin: 0 0 24px 0;` }, 'Ensure the environmental scanning process is properly closed out and outputs are fed into operational systems.'),
      
      h('div', { style: 'display: flex; flex-direction: column; gap: 16px;' },
        ...checks.map(c => h('label', { style: `display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; transition: 0.2s;` },
          h('input', { type: 'checkbox', style: 'width: 18px; height: 18px; cursor: pointer; accent-color: #3B7A57;' }),
          h('span', { style: 'font-weight: 500; font-size: 15px;' }, c)
        ))
      ),
      h('div', { style: 'margin-top: 32px; display: flex; justify-content: flex-end;' },
        h('button', { style: `${btnPrimaryStyle} background: ${theme.blue}; padding: 12px 32px; font-size: 16px;`, onclick: () => showToast('Process Finalized!') }, 'Finalize Process & Sync to ERP')
      )
    );
  }

  // Initial render
  render();
  
  return container;
};
