/* ==========================================================================
   NCSmall.Farm V.2 — Core Application
   State object, h() DOM helper, view routing, render dispatcher
   ========================================================================== */

(function() {
  // --- Core State ---
  window.st = {
    view: 'onboarding',
    layoutView: 'page',
    mode: 'community',
    user: null,
    avatar: 'kenji',
    chatHistory: [],
    selectedParcel: null,
    currentParcel: null,
    mapLayers: {},
    language: 'en',
    mobileMenuOpen: false,
    voiceOn: false,
    showLogin: false,
    inputText: '',
    isThinking: false,
    xp: 0,
    badges: [],
    milestones: [],
    chatNavigator: [],
    selectedAvatarId: 'kenji',
    speakingAvatarId: null,
    chatInput: '',
    address: '',
    progressStep: 0,
    chatVoiceOn: false,
    langMenuOpen: false,
    savedPlans: []
  };

  // --- Virtual DOM Helper ---
  window.h = function(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k.startsWith('on') && typeof v === 'function') {
          el.addEventListener(k.substring(2).toLowerCase(), v);
        } else if (k === 'className') {
          el.className = v;
        } else if (k === 'style' && typeof v === 'object') {
          Object.assign(el.style, v);
        } else {
          el.setAttribute(k, v);
        }
      }
    }
    children.forEach(child => {
      if (Array.isArray(child)) {
          child.forEach(c => {
             if (c instanceof Node) el.appendChild(c);
             else if (c !== null && c !== undefined && c !== false) el.appendChild(document.createTextNode(String(c)));
          });
      } else {
          if (child instanceof Node) el.appendChild(child);
          else if (child !== null && child !== undefined && child !== false) el.appendChild(document.createTextNode(String(child)));
      }
    });
    return el;
  };

  // --- Navigation ---
  window.setView = function(view) {
    st.view = view;
    st.mobileMenuOpen = false;
    render();
  };

  window.changeLang = function(code) {
    st.language = code;
    st.langMenuOpen = false;
    render();
  };

  // --- Lazy Load CesiumJS ---
  window.loadCesium = function() {
    if (window.Cesium) return Promise.resolve();
    if (window._cesiumLoading) return window._cesiumLoading;

    window._cesiumLoading = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.107/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.107/Build/Cesium/Cesium.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window._cesiumLoading;
  };

  // --- Main Render Dispatcher ---
  window.render = function() {
    const appNode = document.getElementById('app');
    if (!appNode) return;
    
    // Set mode on body
    document.body.setAttribute('data-mode', st.mode);
    
    if (st.mode === 'admin') {
        // CesiumJS will lazy-load in future design phase, not on mode switch
    }

    // Destroy Leaflet before DOM wipe (innerHTML='' kills the container)
    if (st.view !== 'map' || !document.getElementById('nc-farm-map')) {
      if (window._ncMapInstance) {
        try { window._ncMapInstance.remove(); } catch(e) {}
        window._ncMapInstance = null;
      }
    }

    appNode.innerHTML = '';

    // Route to the correct view renderer
    let mainView;
    switch (st.view) {
      case 'onboarding':      mainView = typeof renderOnboarding === 'function' ? renderOnboarding() : h('div', {className: 'p-8'}, 'Onboarding View'); break;
      case 'chat':            mainView = typeof renderAvatarChat === 'function' ? renderAvatarChat() : h('div', {className: 'p-8'}, 'Chat View'); break;
      case 'map':             mainView = typeof renderMapView === 'function' ? renderMapView() : h('div', {className: 'p-8'}, 'Map View'); break;
      case 'calendar':        mainView = typeof renderCalendar === 'function' ? renderCalendar() : h('div', {className: 'p-8'}, 'Calendar View'); break;
      case 'about':           mainView = typeof renderAbout === 'function' ? renderAbout() : h('div', {className: 'p-8'}, 'About View'); break;
      case 'faq':             mainView = typeof renderFAQ === 'function' ? renderFAQ() : h('div', {className: 'p-8'}, 'FAQ View'); break;
      case 'contact':         mainView = typeof renderContact === 'function' ? renderContact() : h('div', {className: 'p-8'}, 'Contact View'); break;
      case 'resources':       mainView = typeof renderResources === 'function' ? renderResources() : h('div', {className: 'p-8'}, 'Resources View'); break;
      case 'esp-dashboard':   mainView = typeof renderESPDashboard === 'function' ? renderESPDashboard() : h('div', {className: 'p-8'}, 'ESP Dashboard'); break;
      case 'farm-assessment': mainView = typeof renderFarmAssessment === 'function' ? renderFarmAssessment() : h('div', {className: 'p-8'}, 'Farm Assessment'); break;
      default:                mainView = h('div', {className: 'p-8'}, 'View Not Found'); break;
    }

    const wrapper = h('div', { className: 'flex flex-col min-h-screen' },
      typeof renderHeader === 'function' ? renderHeader() : h('header', null, 'Header Placeholder'),
      h('main', { className: 'main-content flex-grow' }, mainView),
      typeof renderFooter === 'function' ? renderFooter() : h('footer', null, '')
    );

    appNode.appendChild(wrapper);

    // ── Login / Role Selection Modal ──
    if (st.showLogin) {
      var roles = [
        { id: 'community', icon: 'groups', label: 'Community Explorer', desc: 'View farm map, resources, and learn about Bona Fide Farm eligibility.', color: '#3B7A57', mode: 'community' },
        { id: 'agent', icon: 'support_agent', label: 'Extension Agent', desc: 'NC A&T / Cooperative Extension staff. Manage farm assessments and ESP reports.', color: '#004684', mode: 'admin' },
        { id: 'admin', icon: 'admin_panel_settings', label: 'Administrator', desc: 'Planning officials and research leads. Full platform access and data export.', color: '#7B1FA2', mode: 'admin' }
      ];

      var overlay = h('div', {
        id: 'login-modal-overlay',
        style: { position: 'fixed', inset: '0', zIndex: '9999', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' },
        onclick: function(e) { if (e.target.id === 'login-modal-overlay') { st.showLogin = false; render(); } }
      },
        h('div', { style: { width: '420px', maxWidth: '92vw', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', fontFamily: 'Inter, sans-serif' } },

          // Header
          h('div', { style: { textAlign: 'center', marginBottom: '24px' } },
            h('div', { style: { fontSize: '28px', fontWeight: '900', color: '#f8fafc', marginBottom: '4px' } }, 'ncsmall.farm'),
            h('div', { style: { fontSize: '12px', color: '#94a3b8' } }, 'Select your role to continue')
          ),

          // Role cards
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' } },
            roles.map(function(r) {
              return h('button', {
                key: r.id,
                style: {
                  display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s'
                },
                onmouseenter: function() { this.style.background = r.color + '22'; this.style.borderColor = r.color + '44'; },
                onmouseleave: function() { this.style.background = 'rgba(255,255,255,0.04)'; this.style.borderColor = 'rgba(255,255,255,0.08)'; },
                onclick: function() {
                  st.user = { displayName: r.label, role: r.id, email: r.id + '@ncsmall.farm' };
                  st.mode = r.mode;
                  st.showLogin = false;
                  window.render();
                }
              },
                h('div', { style: { width: '44px', height: '44px', borderRadius: '12px', background: r.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' } },
                  h('span', { className: 'material-icons-round', style: { fontSize: '22px', color: r.color } }, r.icon)
                ),
                h('div', { style: { flex: '1' } },
                  h('div', { style: { fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '2px' } }, r.label),
                  h('div', { style: { fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' } }, r.desc)
                ),
                h('span', { className: 'material-icons-round', style: { fontSize: '18px', color: '#475569' } }, 'arrow_forward')
              );
            })
          ),

          // Divider
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' } },
            h('div', { style: { flex: '1', height: '1px', background: 'rgba(255,255,255,0.08)' } }),
            h('span', { style: { fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Coming Soon'),
            h('div', { style: { flex: '1', height: '1px', background: 'rgba(255,255,255,0.08)' } })
          ),

          // Future auth options (disabled)
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('button', { style: { flex: '1', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: '11px', fontWeight: '600', cursor: 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }, disabled: true },
              h('img', { src: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg', style: { width: '14px', height: '14px', opacity: '0.4' } }),
              'Google SSO'
            ),
            h('button', { style: { flex: '1', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: '11px', fontWeight: '600', cursor: 'not-allowed', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }, disabled: true },
              h('span', { className: 'material-icons-round', style: { fontSize: '14px', opacity: '0.4' } }, 'email'),
              'Email Login'
            )
          ),

          // Footer
          h('div', { style: { textAlign: 'center', marginTop: '16px', fontSize: '9px', color: '#475569' } },
            'NC A&T State University · Cooperative Extension · Think! Design & Planning'
          )
        )
      );

      appNode.appendChild(overlay);
    }
  };

  // --- Initialization ---
  window.initApp = function() {
    // Determine mode based on auth role
    const setModeFromUser = (user) => {
        if (!user) {
            st.mode = 'community';
        } else {
            const role = user.role || 'community';
            if (role === 'planner' || role === 'admin') {
                st.mode = 'admin';
            } else {
                st.mode = 'community';
            }
        }
    };

    // Always render immediately for community mode
    setModeFromUser(null);
    render();

    // Then try Firebase auth (will update mode if user logs in)
    if (window.initAuth) {
      try {
        window.initAuth((user) => {
          st.user = user;
          setModeFromUser(user);
          render();
        });
      } catch(e) { console.log('Auth init skipped:', e.message); }
    }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
  } else {
    window.initApp();
  }

})();
