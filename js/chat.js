/* ==========================================================================
   NCSmall.Farm V.2 — Avatar Chat View
   Chat interface, AI response handling, gamification
   ========================================================================== */

(function() {

  const QUICK_CHIPS = {
    agriculture: ['How do I start a conservation plan?', 'Best cover crops for NC clay soil?', 'Rotational grazing schedule for goats?'],
    families:    ['Healthy meal plans with local produce?', 'How do I get GAP certified?', 'SNAP-Ed resources for my county?'],
    community:   ['Am I eligible for EQIP funding?', 'How to write a strong grant narrative?', 'How to start a community garden partnership?'],
    events:      ['Upcoming extension workshops near me?', 'How do I submit an event to the calendar?', 'Current funding opportunities for small farms?']
  };

  window.addXP = function(amount) {
    const st = window.st;
    st.xp += amount;
    st.milestones.forEach(m => { if (!m.earned && st.xp >= m.xp) { m.earned = true; st.badges.push(m.label); } });
    render();
  };

  window.handleAvatarChat = async function() {
    const st = window.st;
    if (!st.chatInput.trim()) return;
    const avatar = window.getAvatar(st.selectedAvatarId);
    const chatKey = `chat${avatar.role.charAt(0).toUpperCase() + avatar.role.slice(1)}`;
    const userMsg = st.chatInput;
    st[chatKey].push({ text: userMsg, sender: 'user' });
    st.chatInput = '';
    st.isThinking = true;
    render();

    const apiKey = window.GEMINI_API_KEY;
    const steps = window.PERSONA_STEPS[avatar.role] || [];
    const currentStep = steps.find(s => s.id === st.progressStep);
    const sysPrompt = `You are ${avatar.name}, ${avatar.desc} at NC A&T's Small Farm Research and Innovation Center (NC Cooperative Extension). Your specialty: ${avatar.subtitle}. Current pathway step: "${currentStep?.title || 'General'}" — ${currentStep?.desc || ''}. Respond in 2-3 concise sentences helping the user with their question. Use practical, actionable language. Reference specific NRCS programs, practice codes, or resources when relevant.`;

    let reply = `I'm ${avatar.name}. I can help with that! Let me look into it for you.`;
    if (apiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: sysPrompt }] }, contents: [{ parts: [{ text: userMsg }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 512 } })
        });
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || reply;
      } catch(e) { console.error('Chat error:', e); }
    }

    st[chatKey].push({ text: reply, sender: 'avatar' });
    st.isThinking = false;
    addXP(10);
    render();
    const chatEl = document.getElementById('chat-scroll');
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;

    if (st.chatVoiceOn) {
      if (st.speakingAvatarId && window.stopTTS) window.stopTTS();
      st.speakingAvatarId = avatar.id;
      render();
      await window.callTTS(reply, avatar.voiceName);
      st.speakingAvatarId = null;
      render();
    }
  };

  window.renderAvatarChat = function() {
    const st = window.st;
    const avatar = window.getAvatar(st.selectedAvatarId);
    const steps = window.PERSONA_STEPS[avatar.role] || [];
    const chatKey = `chat${avatar.role.charAt(0).toUpperCase() + avatar.role.slice(1)}`;
    const messages = st[chatKey] || [];

    const nextMilestone = st.milestones.find(m => !m.earned) || st.milestones[st.milestones.length - 1];
    const xpProgress = nextMilestone ? Math.min(100, (st.xp / nextMilestone.xp) * 100) : 100;

    function toggleVoice(e) {
      e.stopPropagation();
      if (st.speakingAvatarId === avatar.id) {
        window.stopTTS && window.stopTTS();
        st.speakingAvatarId = null; render();
      } else if (st.voiceOn) {
        if (st.speakingAvatarId) { window.stopTTS && window.stopTTS(); }
        st.speakingAvatarId = avatar.id; render();
        window.callTTS(`Hi, I'm ${avatar.name}. ${avatar.desc} How can I help you today?`, avatar.voiceName)
          .then(() => { st.speakingAvatarId = null; render(); });
      }
    }

    function useChip(text) {
      st.chatInput = text;
      handleAvatarChat();
    }

    return h('div', { className: 'w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in' },
      h('div', { className: 'lg:col-span-4 space-y-4' },
        h('div', { className: 'glass rounded-2xl p-6 text-center shadow-lg border-t-4 border-aggie-gold', style: { position: 'relative' } },
          h('button', {
            style: { position: 'absolute', top: '16px', left: '16px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: st.chatVoiceOn ? 'rgba(46,125,50,0.15)' : 'rgba(200,0,0,0.1)', color: st.chatVoiceOn ? '#2e7d32' : '#c62828', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
            title: st.chatVoiceOn ? 'Auto-voice ON — responses are spoken aloud' : 'Auto-voice OFF — text only',
            onClick: () => { st.chatVoiceOn = !st.chatVoiceOn; st.voiceOn = st.chatVoiceOn; render(); }
          }, st.chatVoiceOn ? h('span', { className: 'material-icons-round' }, 'mic') : h('span', { className: 'material-icons-round' }, 'mic_off')),
          h('div', {
            className: 'relative mx-auto mb-3',
            style: { width: '280px', height: '280px', cursor: 'pointer' },
            title: st.speakingAvatarId === avatar.id ? 'Stop speaking' : `Click to hear ${avatar.name}`,
            onClick: toggleVoice
          },
            h('img', { src: avatar.img, style: { width: '280px', height: '280px', objectFit: 'cover', borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }, className: 'avatar-img' }),
            st.speakingAvatarId === avatar.id ? renderWaveform(true) : null,
            h('div', {
              style: { position: 'absolute', bottom: '8px', right: '8px', width: '36px', height: '36px', borderRadius: '50%', background: st.speakingAvatarId === avatar.id ? 'var(--aggie-gold)' : 'rgba(0,70,132,0.15)', color: st.speakingAvatarId === avatar.id ? '#fff' : 'var(--aggie-blue)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }
            }, st.speakingAvatarId === avatar.id ? h('span', { className: 'material-icons-round' }, 'stop') : (st.voiceOn ? h('span', { className: 'material-icons-round' }, 'volume_up') : h('span', { className: 'material-icons-round' }, 'volume_off')))
          ),
          h('h2', { style: { fontSize: '1.5rem', fontWeight: '900', color: 'var(--aggie-blue)' } }, avatar.name),
          h('p', { style: { fontSize: '0.85rem', color: 'var(--nrcs-green)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' } }, avatar.subtitle)
        ),
        h('div', { className: 'glass rounded-xl p-4 shadow-md' },
          h('div', { className: 'flex justify-between items-center mb-2' },
            h('span', { className: 'flex items-center gap-1', style: { fontSize: '0.8rem', fontWeight: '700', color: 'var(--aggie-blue)' } }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'bolt'), `${st.xp} XP`),
            h('span', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, nextMilestone ? `Next: ${nextMilestone.label}` : 'Max Level!')
          ),
          h('div', { style: { height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' } },
            h('div', { style: { width: `${xpProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--nrcs-green), var(--aggie-gold))', borderRadius: '4px', transition: 'width 0.5s ease' } })
          ),
          st.badges.length > 0 ? h('div', { className: 'flex flex-wrap gap-1 mt-2' },
            ...st.badges.map(b => h('span', { style: { fontSize: '0.7rem', background: 'var(--aggie-gold)', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontWeight: '700' } }, b))
          ) : null
        ),
        h('div', { className: 'glass rounded-xl p-4 shadow-md' },
          h('h3', { className: 'font-bold text-xs text-text-muted uppercase tracking-widest mb-3 flex items-center gap-1' }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'format_list_bulleted'), 'Pathway'),
          h('div', { className: 'space-y-2' },
            ...steps.map(step => {
              const done = st.progressStep > step.id, active = st.progressStep === step.id;
              return h('button', {
                style: { width: '100%', textAlign: 'left', border: 'none', cursor: active ? 'pointer' : 'default', background: done ? 'rgba(46,125,50,0.08)' : active ? 'rgba(253,185,39,0.12)' : '#fff', borderLeft: `4px solid ${done ? '#2e7d32' : active ? 'var(--aggie-gold)' : '#e0e0e0'}`, padding: '8px 10px', borderRadius: '6px', opacity: !done && !active ? 0.5 : 1, transition: 'all 0.2s' },
                onClick: () => {
                  if (active) {
                    st.progressStep++;
                    addXP(25);
                    const msg = `Completed: ${step.title}! +25 XP`;
                    st[chatKey].push({ text: msg, sender: 'avatar', type: 'milestone' });
                    if (steps[step.id]) {
                      st[chatKey].push({ text: `Next step: ${steps[step.id].title} — ${steps[step.id].desc}`, sender: 'avatar', type: 'info' });
                    }
                    render();
                  }
                }
              },
                h('div', { style: { fontSize: '0.85rem', fontWeight: '700', color: done ? '#2e7d32' : 'var(--aggie-blue)' } }, `${done ? '✓' : step.id + '.'} ${step.title}`),
                active ? h('p', { style: { fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' } }, step.desc) : null,
                active ? h('span', { style: { fontSize: '0.65rem', color: 'var(--aggie-gold)', fontWeight: '700' } }, '▶ Click to complete') : null
              );
            })
          )
        )
      ),
      h('div', { className: 'lg:col-span-8 flex flex-col glass rounded-2xl shadow-xl overflow-hidden', style: { height: '650px' } },
        h('div', { style: { background: 'var(--aggie-blue)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          h('button', {
            style: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
            onClick: () => { window.st.view = 'navigator'; window.render(); }
          }, h('span', { className: 'material-icons-round' }, 'arrow_back'), 'All Assistants'),
          h('span', { style: { color: '#fff', fontWeight: '700', fontSize: '0.9rem' } }, `Chat with ${avatar.name}`)
        ),
        h('div', { id: 'chat-scroll', className: 'flex-1 overflow-auto p-6 space-y-4 custom-scrollbar bg-muted' },
          messages.length <= 1 ? h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' } },
            messages.length === 0 ? h('div', { className: 'bg-white p-5 rounded-xl shadow-sm border border-light', style: { maxWidth: '85%' } },
              h('div', { style: { fontWeight: '700', fontSize: '0.75rem', color: 'var(--nrcs-green)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, `${avatar.name} · ${avatar.subtitle}`),
              h('p', { style: { color: 'var(--text-primary)', fontSize: '1rem', lineHeight: '1.7' } }, `Hi! I'm ${avatar.name}. ${avatar.desc} How can I help you today?`)
            ) : null,
            (QUICK_CHIPS[avatar.role] ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '85%' } },
              ...QUICK_CHIPS[avatar.role].map(chip =>
                h('button', {
                  className: 'flex items-center gap-1',
                  style: { background: 'rgba(0,70,132,0.06)', border: '1px solid rgba(0,70,132,0.15)', borderRadius: '20px', padding: '8px 16px', fontSize: '0.85rem', color: 'var(--aggie-blue)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
                  onClick: () => useChip(chip),
                  onMouseOver: e => { e.target.style.background = 'rgba(0,70,132,0.12)'; e.target.style.borderColor = 'var(--aggie-blue)'; },
                  onMouseOut: e => { e.target.style.background = 'rgba(0,70,132,0.06)'; e.target.style.borderColor = 'rgba(0,70,132,0.15)'; }
                }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'chat'), chip)
              )
            ) : null)
          ) : null,
          ...messages.map(m => {
            const isMilestone = m.type === 'milestone';
            const isInfo = m.type === 'info';
            return h('div', { className: m.sender === 'user' ? 'flex justify-end' : 'flex justify-start' },
              h('div', {
                style: {
                  maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)',
                  background: m.sender === 'user' ? 'var(--aggie-blue)' : isMilestone ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' : isInfo ? 'linear-gradient(135deg, #e3f2fd, #bbdefb)' : '#fff',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6',
                  boxShadow: isMilestone ? '0 2px 8px rgba(46,125,50,0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
                }
              },
                m.sender === 'avatar' ? h('div', { style: { fontWeight: '700', fontSize: '0.7rem', color: isMilestone ? '#2e7d32' : isInfo ? '#1565c0' : 'var(--text-muted)', marginBottom: '4px' } }, isMilestone ? 'Achievement' : isInfo ? avatar.name : avatar.name) : null,
                h('p', null, m.text)
              )
            );
          }),
          st.isThinking ? h('div', { className: 'flex justify-start' }, h('div', { className: 'bg-white p-4 rounded-xl shadow-sm border border-light', style: { color: 'var(--text-muted)' } }, '● ● ●')) : null
        ),
        h('div', { className: 'p-4 bg-white border-t border-light flex items-center gap-3' },
          h('input', {
            type: 'text',
            className: 'flex-1 bg-muted border border-light rounded-lg px-4 py-3 outline-none focus:border-aggie-blue',
            style: { fontSize: '1rem' },
            placeholder: `Ask ${avatar.name} anything...`,
            value: st.chatInput,
            onInput: e => st.chatInput = e.target.value,
            onKeyDown: e => e.key === 'Enter' && handleAvatarChat()
          }),
          h('button', { className: 'btn-federal px-6 py-3 rounded-lg font-bold', onClick: handleAvatarChat, disabled: st.isThinking }, st.isThinking ? '...' : 'Send')
        )
      )
    );
  };

})();
