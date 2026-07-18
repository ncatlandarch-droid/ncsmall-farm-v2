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
    
    if (st.mode === 'professional') {
        window.loadCesium();
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
  };

  // --- Initialization ---
  window.initApp = function() {
    // Determine mode based on auth role
    const setModeFromUser = (user) => {
        if (!user) {
            st.mode = 'community';
        } else {
            const role = user.role || 'community';
            if (role === 'planner') {
                st.mode = 'professional';
            } else if (role === 'admin') {
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
