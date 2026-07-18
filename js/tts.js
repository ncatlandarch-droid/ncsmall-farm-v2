/* ==========================================================================
   NC Small Farm Platform V.2 — TTS (Text-to-Speech)
   Gemini Neural TTS — Photorealistic Voices Only
   ========================================================================== */

(function() {
  const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
  const FEMALE_VOICES = ['Aoede','Leda','Callirrhoe','Autonoe','Despina','Erinome','Laomedeia','Achernar','Schedar','Pulcherrima','Achird','Vindemiatrix','Sadachbia'];

  function createWavBuffer(pcmData, sampleRate) {
    const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(wavBuffer);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); view.setUint32(4, 32 + pcmData.length * 2, true);
    ws(8, 'WAVE'); ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
    return wavBuffer;
  }

  /**
   * Speak text using Gemini Neural TTS (photorealistic voices).
   * @param {string} text - Text to speak
   * @param {string} voiceName - Gemini voice name (e.g., 'Enceladus', 'Aoede')
   * @returns {Promise<void>}
   */
  let _currentAudio = null;

  window.stopTTS = function() {
    if (_currentAudio) { _currentAudio.pause(); _currentAudio.currentTime = 0; _currentAudio = null; }
  };

  window.callTTS = async function(text, voiceName = 'Puck') {
    window.stopTTS();
    const apiKey = window.GEMINI_API_KEY;
    if (!apiKey) { console.warn('TTS: No API key — cannot use neural voices'); return; }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
      }
    };

    try {
      const res = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.error) { console.warn('TTS API error:', data.error.message); return; }

      const audioPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (audioPart) {
        const byteChars = atob(audioPart.inlineData.data);
        const byteNums = new Int16Array(byteChars.length / 2);
        for (let i = 0; i < byteNums.length; i++) byteNums[i] = byteChars.charCodeAt(i*2) | (byteChars.charCodeAt(i*2+1) << 8);
        const wavBuf = createWavBuffer(byteNums, 24000);
        _currentAudio = new Audio(URL.createObjectURL(new Blob([wavBuf], { type: 'audio/wav' })));

        await new Promise(resolve => {
          _currentAudio.onended = resolve;
          _currentAudio.onerror = resolve;
          _currentAudio.play().catch(e => { console.warn('Audio play blocked:', e.message); resolve(); });
        });
        _currentAudio = null;
      }
    } catch (e) { console.error('TTS Error:', e); }
  };
})();
