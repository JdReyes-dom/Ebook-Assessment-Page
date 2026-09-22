/* ==========================================================================
   CloudSwyft — Shared Text-to-Speech (TTS) Utility
   Uses the Web Speech API (SpeechSynthesis) — no external dependencies.
   Designed as an accessibility / SPED accommodation.

   Features:
     - Floating toggle button (persists across pages via sessionStorage)
     - speak(text)              — speak arbitrary text
     - speakElement(el)         — speak + visual highlight
     - attach(selector)         — read on click of any element
     - readVisiblePage()        — read everything currently visible
     - Alt+R keyboard shortcut  — toggle
     - Escape                   — stop speaking

   Usage:
     <link rel="stylesheet" href="../shared/tts-style.css">
     <script src="../shared/tts.js"></script>
     TTS.init();
   ========================================================================== */

(function () {
  'use strict';

  const TTS = {};
  const STORAGE_KEY = 'frsTtsEnabled';

  let enabled = false;
  let voice = null;
  let toggleBtn = null;
  let speakingNow = false;
  let currentUtterance = null;
  let highlightedEl = null;

  /* ------------------------------------------------------------------
     VOICE SELECTION — prefer a natural English voice
  ------------------------------------------------------------------ */
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferred = [
      /Google US English/i,
      /Microsoft Aria/i,
      /Microsoft Jenny/i,
      /Samantha/i,
      /Karen/i,
      /Google UK English Female/i,
      /English \(United States\)/i
    ];

    for (const rx of preferred) {
      const match = voices.find(v => rx.test(v.name));
      if (match) return match;
    }
    return voices.find(v => /^en/i.test(v.lang)) || voices[0];
  }

  function refreshVoice() {
    voice = pickVoice();
  }

  if ('speechSynthesis' in window) {
    refreshVoice();
    window.speechSynthesis.onvoiceschanged = refreshVoice;
  }

  /* ------------------------------------------------------------------
     HIGHLIGHT HELPERS
  ------------------------------------------------------------------ */
  function clearHighlight() {
    if (highlightedEl) {
      highlightedEl.classList.remove('tts-highlight');
      highlightedEl = null;
    }
    document.querySelectorAll('.tts-highlight').forEach(n =>
      n.classList.remove('tts-highlight')
    );
  }

  function setHighlight(el) {
    clearHighlight();
    if (!el) return;
    el.classList.add('tts-highlight');
    highlightedEl = el;
  }

  /* ------------------------------------------------------------------
     CORE SPEAK / STOP
  ------------------------------------------------------------------ */
  TTS.speak = function (text, opts = {}) {
    if (!('speechSynthesis' in window)) return;
    if (!enabled && !opts.force) return;
    if (!text || !text.trim()) return;

    // Cancel any current speech so we don't queue up
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice  = voice || null;
    utter.rate   = opts.rate   != null ? opts.rate   : 0.95; // slightly slower for kids
    utter.pitch  = opts.pitch  != null ? opts.pitch  : 1.0;
    utter.volume = opts.volume != null ? opts.volume : 1.0;
    utter.lang   = (voice && voice.lang) || 'en-US';

    const userOnEnd   = opts.onend;
    const userOnStart = opts.onstart;

    utter.onstart = () => {
      speakingNow = true;
      TTS.updateButton();
      if (typeof userOnStart === 'function') userOnStart();
    };
    utter.onend = () => {
      speakingNow = false;
      TTS.updateButton();
      clearHighlight();
      if (typeof userOnEnd === 'function') userOnEnd();
    };
    utter.onerror = () => {
      speakingNow = false;
      TTS.updateButton();
      clearHighlight();
      if (typeof userOnEnd === 'function') userOnEnd();
    };

    currentUtterance = utter;
    window.speechSynthesis.speak(utter);
  };

  TTS.stop = function () {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speakingNow = false;
    clearHighlight();
    TTS.updateButton();
  };

  /* ------------------------------------------------------------------
     SPEAK ELEMENT — speak + visual highlight (Optional Enhancement B)
  ------------------------------------------------------------------ */
  TTS.speakElement = function (el, opts = {}) {
    if (!el) return;
    setHighlight(el);
    const text = TTS.extractText(el);
    TTS.speak(text, opts);
  };

  /* ------------------------------------------------------------------
     ENABLE / DISABLE
  ------------------------------------------------------------------ */
  TTS.isEnabled = () => enabled;

  TTS.setEnabled = function (on) {
    enabled = !!on;
    try { sessionStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch (e) {}
    TTS.updateButton();
    if (!enabled) TTS.stop();
  };

  TTS.toggle = function () {
    TTS.setEnabled(!enabled);
  };

  function restoreEnabled() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      enabled = raw === '1';
    } catch (e) { enabled = false; }
  }

  /* ------------------------------------------------------------------
     ATTACH: read element text on click
  ------------------------------------------------------------------ */
  TTS.attach = function (selector) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.ttsAttached) return;
      el.dataset.ttsAttached = '1';
      el.addEventListener('click', () => {
        if (!enabled) return;
        TTS.speakElement(el);
      });
    });
  };

  /* ------------------------------------------------------------------
     Extract readable text from an element
  ------------------------------------------------------------------ */
  TTS.extractText = function (el) {
    if (!el) return '';
    if (el.dataset && el.dataset.tts) return el.dataset.tts;

    // Include input values / placeholders when useful
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
      const val = el.value || el.placeholder || '';
      return String(val).replace(/\s+/g, ' ').trim();
    }

    let text = el.innerText || el.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  };

  /* ------------------------------------------------------------------
     READ THE VISIBLE PAGE
  ------------------------------------------------------------------ */
  TTS.readVisiblePage = function () {
    if (!enabled) return;

    const skipTags = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG',
      'VIDEO', 'AUDIO', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'
    ]);
    const chunks = [];

    function isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return false;
      if (el.hasAttribute('hidden')) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;
      return true;
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent.replace(/\s+/g, ' ').trim();
        if (t) chunks.push(t);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (skipTags.has(node.tagName)) return;
      if (!isVisible(node)) return;
      if (node.getAttribute && node.getAttribute('aria-label')) {
        chunks.push(node.getAttribute('aria-label'));
        return;
      }
      node.childNodes.forEach(walk);
    }

    const root = document.querySelector('.page.active')
              || document.querySelector('.results-wrapper')
              || document.body;
    walk(root);

    if (!chunks.length) return;
    TTS.speak(chunks.join('. '));
  };

  /* ------------------------------------------------------------------
     FLOATING TOGGLE BUTTON
  ------------------------------------------------------------------ */
  function injectButton() {
    if (toggleBtn) return;

    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'tts-toggle';
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleBtn.setAttribute('aria-label', 'Read aloud');
    toggleBtn.innerHTML = `
      <span class="tts-icon" aria-hidden="true">🔊</span>
      <span class="tts-label">Read Aloud</span>
    `;

    toggleBtn.addEventListener('click', () => TTS.toggle());

    document.body.appendChild(toggleBtn);
    TTS.updateButton();
  }

  TTS.updateButton = function () {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle('tts-on', enabled);
    toggleBtn.classList.toggle('tts-speaking', speakingNow);
    toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    const label = toggleBtn.querySelector('.tts-label');
    const icon  = toggleBtn.querySelector('.tts-icon');
    if (label) label.textContent = enabled ? 'Reading On' : 'Read Aloud';
    if (icon)  icon.textContent  = enabled ? (speakingNow ? '⏸️' : '🔊') : '🔇';
  };

  /* ------------------------------------------------------------------
     KEYBOARD SHORTCUTS (Optional Enhancement C)
        Alt+R → toggle TTS
        Escape → stop speaking
  ------------------------------------------------------------------ */
  function installKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        TTS.toggle();
      }
      if (e.key === 'Escape' && TTS.isEnabled()) {
        TTS.stop();
      }
    });
  }

  /* ------------------------------------------------------------------
     HOVER-TO-READ (Optional Enhancement A)
       Attach to `.choice` and similar hoverable rows.
  ------------------------------------------------------------------ */
  TTS.attachHover = function (selector, getText) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.ttsHoverAttached) return;
      el.dataset.ttsHoverAttached = '1';
      el.addEventListener('mouseenter', () => {
        if (!enabled) return;
        if (window.matchMedia('(hover: none)').matches) return; // skip touch devices
        const text = typeof getText === 'function'
          ? getText(el)
          : TTS.extractText(el);
        if (text) TTS.speak(text);
      });
    });
  };

  /* ------------------------------------------------------------------
     FORM INPUT FOCUS READER (Optional Enhancement D)
  ------------------------------------------------------------------ */
  TTS.attachFormFocus = function (selector) {
    document.querySelectorAll(selector).forEach(input => {
      if (input.dataset.ttsFocusAttached) return;
      input.dataset.ttsFocusAttached = '1';
      input.addEventListener('focus', () => {
        if (!enabled) return;
        const label = input.id
          ? document.querySelector(`label[for="${input.id}"]`)
          : null;
        const labelText = label
          ? label.innerText.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
          : '';
        const placeholder = input.placeholder || '';
        const parts = [labelText, placeholder].filter(Boolean);
        if (parts.length) TTS.speak(parts.join('. '));
      });
    });
  };

  /* ------------------------------------------------------------------
     INIT
  ------------------------------------------------------------------ */
  TTS.init = function (opts = {}) {
    if (!('speechSynthesis' in window)) {
      console.warn('TTS: SpeechSynthesis not supported in this browser.');
      return;
    }
    restoreEnabled();
    injectButton();
    installKeyboardShortcuts();

    // Auto-attach to common clickable text elements
    TTS.attach('.choice-text');
    TTS.attach('.choice-name');
    TTS.attach('.form-label');
    TTS.attach('.instruction-card h1');
    TTS.attach('.instruction-card p');
    TTS.attach('.q-number');
    TTS.attach('.question-header h2');
    TTS.attach('.answer-row-header');
    TTS.attach('.insight-header');
    TTS.attach('.detail-choice');
    TTS.attach('.confirm-box h2');
    TTS.attach('.confirm-box p');
    TTS.attach('.result-box h2');
    TTS.attach('.result-box p');
  };

  /* ------------------------------------------------------------------
     STOP ON UNLOAD
  ------------------------------------------------------------------ */
  window.addEventListener('beforeunload', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });

  window.TTS = TTS;
})();