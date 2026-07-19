/* ==========================================================================
   NCSmall.Farm V.2 — Onboarding / Landing Page
   Aggie hero navigator + 4 Cooperative Extension assistants + intro video
   ========================================================================== */

(function() {

  window.renderWaveform = function(isGold = false) {
    return h('div', { className: 'waveform absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10' },
      h('div', { className: `wavebar ${isGold ? 'wavebar-gold' : ''}` }),
      h('div', { className: `wavebar ${isGold ? 'wavebar-gold' : ''}` }),
      h('div', { className: `wavebar ${isGold ? 'wavebar-gold' : ''}` }),
      h('div', { className: `wavebar ${isGold ? 'wavebar-gold' : ''}` }),
      h('div', { className: `wavebar ${isGold ? 'wavebar-gold' : ''}` })
    );
  };

  window.handleTriageSubmit = async function() {
    const st = window.st;
    if (!st.inputText.trim()) return;
    if (window.stopTTS) window.stopTTS();
    st.speakingAvatarId = null;

    st.isThinking = true;
    render();

    const userQuestion = st.inputText;
    const greeting = `Thanks for your question! I can help with that. Let me look into "${userQuestion}" for you.`;

    st.inputText = '';
    st.isThinking = false;
    st.selectedAvatarId = 'kenji';
    st.view = 'chat';
    st.layoutView = 'avatar';

    if (st.chatNavigator) {
      st.chatNavigator.push({ text: greeting, sender: 'avatar' });
    }

    render();

    if (st.voiceOn) {
      st.speakingAvatarId = 'kenji';
      render();
      await window.callTTS(greeting, window.getAvatar('kenji').voiceName);
      st.speakingAvatarId = null;
      render();
    }
  };

  function toggleAvatarVoice(avatar) {
    const st = window.st;
    if (st.speakingAvatarId === avatar.id) {
      window.stopTTS && window.stopTTS();
      st.speakingAvatarId = null;
      render();
      return;
    }
    if (!st.voiceOn) return;
    if (st.speakingAvatarId) {
      window.stopTTS && window.stopTTS();
      st.speakingAvatarId = null;
    }
    st.speakingAvatarId = avatar.id;
    render();
    window.callTTS(`Hi, I'm ${avatar.name}. ${avatar.desc}. Click me to get started!`, avatar.voiceName)
      .then(() => { st.speakingAvatarId = null; render(); });
  }

  window.renderOnboarding = function() {
    const st = window.st;
    const kenji = window.getAvatar('kenji');

    const calEvents = [
      { date: 'Jul 15, 2026', title: 'Small Farm Field Day' },
      { date: 'Jul 22, 2026', title: 'EQIP Application Workshop' },
      { date: 'Aug 5, 2026', title: 'GAP Certification Training' },
      { date: 'Aug 19, 2026', title: 'Community Asset Mapping' }
    ];

    return h('div', { className: 'w-full max-w-5xl mx-auto space-y-8 fade-in' },
      h('div', {
        className: 'glass rounded-2xl p-8 flex flex-col items-center border-t-4 border-aggie-blue shadow-xl',
        style: {
          position: 'relative',
          overflow: 'hidden'
        }
      },
        // Ken Burns hero background
        h('div', {
          style: {
            position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
            backgroundImage: 'url("images/nc-farm-hero.png")',
            backgroundSize: 'cover', backgroundPosition: 'center',
            animation: 'kenBurns 25s ease-in-out infinite alternate',
            zIndex: '0'
          }
        }),
        // Dark gradient overlay for readability
        h('div', {
          style: {
            position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
            background: 'linear-gradient(180deg, rgba(0,46,84,0.72) 0%, rgba(0,46,84,0.82) 40%, rgba(0,46,84,0.92) 100%)',
            zIndex: '1'
          }
        }),
        h('div', {
          className: 'relative flex-shrink-0 mb-4',
          style: { width: '280px', height: '280px', cursor: 'pointer', position: 'relative', zIndex: '2' },
          title: st.speakingAvatarId === 'kenji' ? 'Stop speaking' : 'Click to hear Aggie',
          onClick: () => toggleAvatarVoice(kenji)
        },
          h('img', { src: kenji.img, style: { width: '280px', height: '280px', objectFit: 'cover', borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }, className: 'avatar-img' }),
          st.speakingAvatarId === 'kenji' ? renderWaveform(true) : null,
          h('div', {
            style: { position: 'absolute', bottom: '8px', right: '8px', width: '36px', height: '36px', borderRadius: '50%', background: st.speakingAvatarId === 'kenji' ? 'var(--aggie-gold)' : 'rgba(0,70,132,0.15)', color: st.speakingAvatarId === 'kenji' ? '#fff' : 'var(--aggie-blue)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }
          }, st.speakingAvatarId === 'kenji' ? h('span', { className: 'material-icons-round' }, 'stop') : (st.voiceOn ? h('span', { className: 'material-icons-round' }, 'volume_up') : h('span', { className: 'material-icons-round' }, 'volume_off')))
        ),
        h('h1', { style: { fontSize: '2.75rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.03em', textAlign: 'center', position: 'relative', zIndex: '2', textShadow: '0 2px 8px rgba(0,0,0,0.3)' } }, 'NCSmall.Farm'),
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '0.5rem 0 0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: '2' } },
          h('img', { src: 'images/sfric-logo-horizontal.png', alt: 'SFRIC — Small Farm Research & Innovation Center', style: { height: '94px', filter: 'brightness(1.1)' } }),
          h('img', { src: 'images/nc-coop-ext-doublestack.jpg', alt: 'NC Cooperative Extension', style: { height: '78px', filter: 'brightness(1.2)' } })
        ),
        h('p', { style: { fontSize: '1.1rem', lineHeight: '1.7', color: 'rgba(255,255,255,0.85)', maxWidth: '520px', textAlign: 'center', margin: '0 auto 1rem', position: 'relative', zIndex: '2' } },
          'How can we help you today? Ask me anything about agriculture, nutrition, community resources, or upcoming events.'
        ),
        
        // Combined smart input — address OR question
        h('div', { style: { width: '100%', maxWidth: '560px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.9)', borderRadius: '14px', padding: '6px 6px 6px 12px', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', position: 'relative', zIndex: '2' } },
          h('span', { className: 'material-icons-round', style: { color: 'var(--text-muted)', fontSize: '22px' } }, 'agriculture'),
          h('input', {
            type: 'text',
            id: 'smart-input',
            style: { flex: '1', border: 'none', outline: 'none', background: 'transparent', fontSize: '1.05rem', padding: '10px 8px', fontFamily: 'Inter, sans-serif' },
            placeholder: 'Enter a farm address or ask a question...',
            value: st.inputText,
            onInput: function(e) {
              st.inputText = e.target.value;
              // Toggle button label based on input content
              var btn = document.getElementById('smart-btn');
              var icon = document.getElementById('smart-btn-icon');
              if (!btn) return;
              var v = e.target.value.trim();
              var isAddress = /\d/.test(v) && /(rd|st|ave|dr|ln|hwy|way|blvd|road|street|nc|farm|church|mill)/i.test(v);
              if (isAddress) {
                btn.textContent = '';
                btn.appendChild(icon);
                icon.textContent = 'map';
                btn.appendChild(document.createTextNode(' Explore Map'));
              } else {
                btn.textContent = '';
                btn.appendChild(icon);
                icon.textContent = 'send';
                btn.appendChild(document.createTextNode(' Ask Aggie'));
              }
            },
            onKeyDown: function(e) {
              if (e.key !== 'Enter') return;
              var v = e.target.value.trim();
              var isAddress = /\d/.test(v) && /(rd|st|ave|dr|ln|hwy|way|blvd|road|street|nc|farm|church|mill)/i.test(v);
              if (isAddress) {
                window.st.address = v;
                window.st.view = 'map';
                window.render();
              } else {
                handleTriageSubmit();
              }
            }
          }),
          h('button', {
            id: 'smart-btn',
            className: 'btn-federal px-5 py-3 rounded-lg font-bold flex items-center gap-2',
            style: { whiteSpace: 'nowrap', fontSize: '0.95rem' },
            onClick: function() {
              var v = (st.inputText || '').trim();
              var isAddress = /\d/.test(v) && /(rd|st|ave|dr|ln|hwy|way|blvd|road|street|nc|farm|church|mill)/i.test(v);
              if (isAddress) {
                window.st.address = v;
                window.st.view = 'map';
                window.render();
              } else {
                handleTriageSubmit();
              }
            },
            disabled: st.isThinking
          },
            h('span', { id: 'smart-btn-icon', className: 'material-icons-round', style: { fontSize: '18px' } }, 'send'),
            st.isThinking ? ' Thinking...' : ' Ask Aggie'
          )
        )
      ),

      h('div', { className: 'glass rounded-2xl p-6 shadow-lg', style: { borderTop: '4px solid var(--aggie-gold)' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' } },
          h('h2', { className: 'flex items-center gap-2', style: { fontSize: '1.3rem', fontWeight: '900', color: 'var(--aggie-blue)', margin: 0 } }, h('span', { className: 'material-icons-round' }, 'event'), 'Upcoming Events'),
          h('button', {
            className: 'btn-federal px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2',
            style: { backgroundColor: 'var(--aggie-gold)', color: '#1a1a1a' },
            onClick: () => {
              window.open('https://docs.google.com/forms/d/e/ncsmall-event-submit/viewform', '_blank');
            }
          }, h('span', { className: 'material-icons-round', style: { fontSize: '1.2rem' } }, 'edit'), 'Submit an Event')
        ),
        h('div', { style: { maxHeight: '280px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-light)' } },
          ...calEvents.map(evt =>
            h('div', {
              style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'background 0.2s' },
              onMouseOver: function() { this.style.background = 'rgba(0,70,132,0.04)'; },
              onMouseOut: function() { this.style.background = 'transparent'; },
              onClick: () => { window.st.view = 'calendar'; window.render(); }
            },
              h('span', { className: 'material-icons-round', style: { fontSize: '1.5rem', color: 'var(--aggie-blue)', flexShrink: 0 } }, 'event_note'),
              h('div', { style: { flex: 1 } },
                h('div', { style: { fontWeight: '700', fontSize: '0.9rem', color: 'var(--aggie-blue)' } }, evt.title),
                h('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' } }, evt.date)
              ),
              h('span', { className: 'material-icons-round', style: { fontSize: '1.2rem', color: 'var(--text-muted)' } }, 'chevron_right')
            )
          )
        ),
        h('div', { style: { textAlign: 'center', marginTop: '12px' } },
          h('button', {
            className: 'text-sm font-bold flex items-center justify-center gap-1 mx-auto',
            style: { color: 'var(--aggie-blue)', background: 'none', border: 'none', cursor: 'pointer' },
            onClick: () => { window.st.view = 'calendar'; window.render(); }
          }, 'View Full Calendar', h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'arrow_forward'))
        )
      ),

      h('div', { className: 'glass rounded-2xl p-6 shadow-lg text-center', style: { borderTop: '4px solid var(--nrcs-green)' } },
        h('h2', { style: { fontSize: '1.5rem', fontWeight: '900', color: 'var(--aggie-blue)', marginBottom: '8px' } }, 'About SFRIC'),
        h('p', { style: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' } },
          'Learn how the Small Farm Research & Innovation Center connects farmers, researchers, and communities through NC A&T.'
        ),
        h('div', { style: { position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } },
          h('iframe', {
            src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
            allowfullscreen: 'true',
            allow: 'autoplay; encrypted-media',
            title: 'About SFRIC — Small Farm Research & Innovation Center'
          })
        ),
        h('p', { style: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' } }, 'Placeholder — SFRIC video URL needed from Charlie')
      )
    );
  };

})();
