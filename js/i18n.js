/**
 * NCSmall.Farm — i18n Translation Engine
 * Runtime translation via Gemini API with localStorage caching.
 * Supports: EN, ES, HMN, MY, VI, FR, AR, ZH
 */
(function() {
  'use strict';

  // ── Supported Languages ──
  window.I18N_LANGUAGES = [
    { code: 'en',  flag: '🇺🇸', label: 'English',    native: 'English' },
    { code: 'es',  flag: '🇲🇽', label: 'Spanish',    native: 'Español' },
    { code: 'hmn', flag: '🇱🇦', label: 'Hmong',      native: 'Hmoob' },
    { code: 'my',  flag: '🇲🇲', label: 'Burmese',    native: 'မြန်မာ' },
    { code: 'vi',  flag: '🇻🇳', label: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'fr',  flag: '🇫🇷', label: 'French',     native: 'Français' },
    { code: 'ar',  flag: '🇸🇦', label: 'Arabic',     native: 'العربية', rtl: true },
    { code: 'zh',  flag: '🇨🇳', label: 'Chinese',    native: '中文' }
  ];

  // ── Core UI Strings (English source of truth) ──
  var UI_STRINGS = {
    'nav.home': 'HOME', 'nav.map': 'MAP', 'nav.calendar': 'CALENDAR',
    'nav.about': 'ABOUT', 'nav.faq': 'FAQ', 'nav.contact': 'CONTACT',
    'nav.resources': 'RESOURCES', 'nav.login': 'LOGIN', 'nav.logout': 'LOGOUT',
    'onboarding.greeting': 'How can we help you today? Ask me anything about agriculture, nutrition, community resources, or upcoming events.',
    'onboarding.placeholder': 'Enter a farm address or ask a question...',
    'onboarding.ask': 'Ask Aggie', 'onboarding.explore': 'Explore Map',
    'onboarding.thinking': 'Thinking...',
    'events.title': 'Upcoming Events', 'events.submit': 'Submit an Event',
    'map.search': 'Search address, owner, or PIN...',
    'map.layers': 'GEOSCOPE LAYERS', 'map.farmDir': 'Farm Directory',
    'map.classification': 'FARM CLASSIFICATION', 'map.criteria': 'IDENTIFICATION CRITERIA',
    'map.allParcels': 'All Parcels', 'map.confirmed': 'Confirmed Farm',
    'map.likely': 'Likely Farm', 'map.potential': 'Potential Farm',
    'map.nonAg': 'Non-Agricultural',
    'common.loading': 'Loading...', 'common.error': 'Something went wrong',
    'common.comingSoon': 'Coming soon', 'common.loaded': 'loaded'
  };

  // ── Translation Cache (localStorage) ──
  var CACHE_KEY = 'ncsmall_i18n_cache';
  var translationCache = {};
  try { var raw = localStorage.getItem(CACHE_KEY); if (raw) translationCache = JSON.parse(raw); } catch(e) {}

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(translationCache)); } catch(e) {}
  }

  // ── Translate a batch of strings via Gemini ──
  function translateBatch(langCode) {
    if (langCode === 'en') return;
    if (translationCache[langCode] && Object.keys(translationCache[langCode]).length >= Object.keys(UI_STRINGS).length) return;

    var toTranslate = {};
    for (var key in UI_STRINGS) {
      if (!translationCache[langCode] || !translationCache[langCode][key]) {
        toTranslate[key] = UI_STRINGS[key];
      }
    }
    if (Object.keys(toTranslate).length === 0) return;

    var langInfo = window.I18N_LANGUAGES.find(function(l) { return l.code === langCode; });
    var langName = langInfo ? langInfo.label : langCode;

    var prompt = 'Translate the following UI strings from English to ' + langName + '. '
      + 'Return ONLY a valid JSON object mapping each key to its translation. '
      + 'Keep translations short and natural for a farming/agriculture platform. '
      + 'Do not translate proper nouns like "Aggie", "SSURGO", "EQIP", "NWI", "DEM", "PIN". '
      + 'Input: ' + JSON.stringify(toTranslate);

    fetch('/.netlify/functions/gis-proxy?layer=gemini-translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.translations) {
        if (!translationCache[langCode]) translationCache[langCode] = {};
        for (var k in data.translations) { translationCache[langCode][k] = data.translations[k]; }
        saveCache();
        if (window.render) window.render();
      }
    })
    .catch(function(err) { console.warn('[i18n] Translation failed:', err.message); });
  }

  // ── Main t() function ──
  window.t = function(key, fallback) {
    var lang = (window.st && window.st.language) || 'en';
    if (lang === 'en') return UI_STRINGS[key] || fallback || key;
    if (translationCache[lang] && translationCache[lang][key]) return translationCache[lang][key];
    return UI_STRINGS[key] || fallback || key;
  };

  // ── Get current language info ──
  window.getCurrentLang = function() {
    var code = (window.st && window.st.language) || 'en';
    return window.I18N_LANGUAGES.find(function(l) { return l.code === code; }) || window.I18N_LANGUAGES[0];
  };

  // ── Enhanced changeLang ──
  window.changeLang = function(code) {
    if (window.st) { window.st.language = code; window.st.langMenuOpen = false; }
    localStorage.setItem('ncsmall_lang', code);
    translateBatch(code);
    if (window.render) window.render();
  };

  // ── Restore saved language ──
  var savedLang = localStorage.getItem('ncsmall_lang');
  if (savedLang && window.st) { window.st.language = savedLang; translateBatch(savedLang); }

  // ── Aggie chat language prompt ──
  window.getAggieLangPrompt = function() {
    var lang = window.getCurrentLang();
    if (lang.code === 'en') return '';
    return ' IMPORTANT: Respond in ' + lang.label + ' (' + lang.native + '). The user speaks ' + lang.label + '.';
  };

})();
