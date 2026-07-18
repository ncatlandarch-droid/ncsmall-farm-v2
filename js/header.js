/* ==========================================================================
   NCSmall.Farm V.2 — Header
   Matches original ncsmall-farm-platform.netlify.app nav style:
   Clean text tabs, active = solid blue pill, ncsmall.farm logo
   ========================================================================== */

(function() {

  window.renderHeader = function() {
    const st = window.st;

    const navItems = [
      { label: 'HOME',      view: 'onboarding' },
      { label: 'MAP',       view: 'map' },
      { label: 'CALENDAR',  view: 'calendar' },
      { label: 'ABOUT',     view: 'about' },
      { label: 'FAQ',       view: 'faq' },
      { label: 'CONTACT',   view: 'contact' },
      { label: 'RESOURCES', view: 'resources' }
    ];

    if (st.mode === 'admin') {
      navItems.push({ label: 'ESP DASHBOARD', view: 'esp-dashboard' });
    }

    // Desktop nav tabs — text only, active = blue pill (matches original)
    const tabs = h('nav', { style: { display: 'flex', alignItems: 'center', gap: '4px' }, className: 'hidden md:flex' },
      navItems.map(tab => {
        const isActive = st.view === tab.view;
        const btn = h('button', {
          style: {
            padding: '6px 14px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.02em',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
            background: isActive ? '#004684' : 'transparent',
            color: isActive ? '#ffffff' : '#334155'
          },
          onclick: () => window.setView(tab.view),
          onmouseenter: function() { if (!isActive) this.style.background = '#f1f5f9'; },
          onmouseleave: function() { if (!isActive) this.style.background = 'transparent'; }
        }, tab.label);
        return btn;
      })
    );

    // TTS toggle (speaker icon — matches original)
    const ttsBtn = h('button', {
      style: { padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' },
      onclick: () => { st.voiceOn = !st.voiceOn; window.render(); },
      title: 'Toggle Voice'
    }, h('span', { className: 'material-icons-round', style: { fontSize: '20px', color: st.voiceOn ? '#004684' : '#94a3b8' } }, st.voiceOn ? 'volume_up' : 'volume_off'));

    // Language selector (matches original "usEN" style)
    const langBtn = h('button', {
      style: { display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#334155', fontFamily: 'Inter, sans-serif' },
      onclick: () => { const nl = st.language === 'en' ? 'es' : 'en'; if (window.changeLang) window.changeLang(nl); }
    },
      h('span', { style: { fontSize: '11px', color: '#94a3b8' } }, 'us'),
      h('span', { style: { fontWeight: '800' } }, st.language.toUpperCase())
    );

    // Login button
    const authBtn = h('button', {
      style: {
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 16px', borderRadius: '4px',
        background: st.user ? 'transparent' : '#004684',
        color: st.user ? '#004684' : '#ffffff',
        border: st.user ? '1px solid #004684' : 'none',
        fontSize: '12px', fontWeight: '700', cursor: 'pointer',
        fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em',
        transition: 'all 0.2s'
      },
      onclick: () => {
        if (st.user) {
          if (window.signOut) window.signOut();
          else { st.user = null; st.mode = 'community'; window.render(); }
        } else {
          st.showLogin = true;
          window.render();
        }
      }
    },
      h('span', { className: 'material-icons-round', style: { fontSize: '16px' } }, st.user ? 'logout' : 'login'),
      st.user ? 'LOGOUT' : 'LOGIN'
    );

    // Mobile hamburger
    const hamburger = h('button', {
      className: 'md:hidden',
      style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '32px', height: '32px', gap: '5px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' },
      onclick: () => { st.mobileMenuOpen = !st.mobileMenuOpen; window.render(); }
    },
      h('span', { style: { display: 'block', width: '20px', height: '2px', background: '#334155', borderRadius: '1px', transition: 'all 0.2s', transform: st.mobileMenuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none' } }),
      h('span', { style: { display: 'block', width: '20px', height: '2px', background: '#334155', borderRadius: '1px', transition: 'all 0.2s', opacity: st.mobileMenuOpen ? '0' : '1' } }),
      h('span', { style: { display: 'block', width: '20px', height: '2px', background: '#334155', borderRadius: '1px', transition: 'all 0.2s', transform: st.mobileMenuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none' } })
    );

    // Mobile dropdown menu
    const mobileMenu = st.mobileMenuOpen ? h('div', { style: { position: 'absolute', top: '100%', left: '0', width: '100%', background: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', borderTop: '1px solid #e2e8f0', zIndex: '50', display: 'flex', flexDirection: 'column', padding: '8px 0' }, className: 'md:hidden' },
      navItems.map(tab => {
        const isActive = st.view === tab.view;
        return h('button', {
          style: { width: '100%', textAlign: 'left', padding: '12px 24px', border: 'none', background: isActive ? '#f0f7ff' : 'transparent', color: isActive ? '#004684' : '#334155', fontSize: '13px', fontWeight: isActive ? '800' : '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
          onclick: () => window.setView(tab.view)
        }, tab.label);
      })
    ) : null;

    // ── Build Header ──
    return h('header', { style: { position: 'sticky', top: '0', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', zIndex: '40', borderBottom: '1px solid #e2e8f0' } },
      h('div', { style: { maxWidth: '1280px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },

        // LEFT: Logo (larger, matches original)
        h('div', {
          style: { cursor: 'pointer', flexShrink: '0' },
          onclick: () => window.setView('onboarding')
        },
          h('img', { src: 'images/cropped-ncsmall-letterhead-cropped-213x94.png', alt: 'ncsmall.farm', style: { height: '50px', width: 'auto' } })
        ),

        // CENTER: Nav tabs
        tabs,

        // RIGHT: Controls
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          ttsBtn,
          langBtn,
          authBtn,
          hamburger
        )
      ),
      mobileMenu
    );
  };

})();
