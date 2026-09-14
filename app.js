(function () {
  'use strict';

  const CUSTOM_KEY = 'atb.customPresets.v1';
  const THEME_KEY = 'atb.theme';

  const DEFAULT_STATE = () => ({
    toneKey: 'ct1',
    gap: 0,
    tail: 0,
    previewVolume: 0.35,
    segments: [
      { f1: 1000, f2: 0, dur: 50, gain: 2048 },
      { f1: 800, f2: 0, dur: 50, gain: 2048 },
      { f1: 600, f2: 0, dur: 50, gain: 2048 },
    ],
  });

  let state = DEFAULT_STATE();

  // ---------- helpers ----------

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function el(id) {
    return document.getElementById(id);
  }

  function bindNumberRangePair(numberInput, rangeInput, onChange) {
    const handler = (e) => {
      const val = Number(e.target.value) || 0;
      if (e.target !== numberInput) numberInput.value = val;
      if (e.target !== rangeInput) rangeInput.value = val;
      onChange(val);
    };
    numberInput.addEventListener('input', handler);
    rangeInput.addEventListener('input', handler);
  }

  // ---------- stanza string generation / parsing ----------

  function buildExpandedSegmentsWithSource(s) {
    const segments = [];
    const sourceIndices = [];
    s.segments.forEach((seg, i) => {
      segments.push(seg);
      sourceIndices.push(i);
      if (s.gap > 0 && i < s.segments.length - 1) {
        segments.push({ f1: 0, f2: 0, dur: s.gap, gain: 0 });
        sourceIndices.push(-1);
      }
    });
    if (s.tail > 0) {
      segments.push({ f1: 0, f2: 0, dur: s.tail, gain: 0 });
      sourceIndices.push(-1);
    }
    return { segments, sourceIndices };
  }

  function buildExpandedSegments(s) {
    return buildExpandedSegmentsWithSource(s).segments;
  }

  function tuplesString(segments) {
    return segments.map((seg) => `(${seg.f1},${seg.f2},${seg.dur},${seg.gain})`).join('');
  }

  function generateStanza(s) {
    return `${s.toneKey || 'ct1'}=|t${tuplesString(buildExpandedSegments(s))}`;
  }

  function parseStanza(str) {
    const keyMatch = str.match(/^\s*([A-Za-z0-9_.-]+)\s*=/);
    const key = keyMatch ? keyMatch[1] : null;
    const tupleRe = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
    const segments = [];
    let m;
    while ((m = tupleRe.exec(str)) !== null) {
      segments.push({
        f1: Number(m[1]),
        f2: Number(m[2]),
        dur: Number(m[3]),
        gain: Number(m[4]),
      });
    }
    return { key, segments };
  }

  // ---------- audio playback ----------

  let audioCtx = null;
  let activeNodes = [];
  let highlightTimeouts = [];

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function highlightRow(rowIndex, on) {
    const row = el('segments-body').querySelector(`tr[data-index="${rowIndex}"]`);
    if (row) row.classList.toggle('playing', on);
  }

  function clearHighlights() {
    highlightTimeouts.forEach((id) => clearTimeout(id));
    highlightTimeouts = [];
    el('segments-body').querySelectorAll('tr.playing').forEach((tr) => tr.classList.remove('playing'));
  }

  function stopPlayback() {
    clearHighlights();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.006);
        osc.stop(now + 0.008);
      } catch (e) {
        /* already stopped */
      }
    });
    activeNodes = [];
  }

  function makeTone(ctx, freq, startTime, dur, gainVal) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gainNode = ctx.createGain();
    const attack = Math.min(0.005, dur / 4);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gainVal, startTime + attack);
    gainNode.gain.setValueAtTime(gainVal, Math.max(startTime + attack, startTime + dur - attack));
    gainNode.gain.linearRampToValueAtTime(0, startTime + dur);
    osc.connect(gainNode).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.02);
    activeNodes.push({ osc, gain: gainNode });
  }

  function playSegments(segments, masterVolume, sourceIndices) {
    stopPlayback();
    if (!segments.length) return;
    const ctx = getAudioCtx();
    const leadMs = 50;
    let t = ctx.currentTime + leadMs / 1000;
    let cumMs = 0;
    segments.forEach((seg, idx) => {
      const durMs = Math.max(0, Number(seg.dur) || 0);
      const dur = durMs / 1000;
      if (dur > 0 && (seg.f1 > 0 || seg.f2 > 0)) {
        const gainVal = clamp((Number(seg.gain) || 0) / 4096, 0, 1) * masterVolume;
        if (seg.f1 > 0) makeTone(ctx, seg.f1, t, dur, gainVal);
        if (seg.f2 > 0) makeTone(ctx, seg.f2, t, dur, gainVal);
      }
      if (sourceIndices && sourceIndices[idx] !== undefined && sourceIndices[idx] !== -1 && durMs > 0) {
        const rowIndex = sourceIndices[idx];
        const startDelay = leadMs + cumMs;
        const endDelay = startDelay + durMs;
        highlightTimeouts.push(setTimeout(() => highlightRow(rowIndex, true), startDelay));
        highlightTimeouts.push(setTimeout(() => highlightRow(rowIndex, false), endDelay));
      }
      t += dur;
      cumMs += durMs;
    });
  }

  // ---------- share link ----------

  function updateShareLink() {
    const payload = {
      k: state.toneKey,
      g: state.gap,
      t: state.tail,
      v: state.previewVolume,
      s: state.segments,
    };
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const url = `${location.origin}${location.pathname}#d=${encoded}`;
    el('share-link').value = url;
    history.replaceState(null, '', `#d=${encoded}`);
  }

  function loadStateFromHash() {
    const hash = location.hash;
    const m = hash.match(/#d=(.+)$/);
    if (!m) return false;
    try {
      const payload = JSON.parse(decodeURIComponent(m[1]));
      if (!Array.isArray(payload.s)) return false;
      state.toneKey = payload.k || 'ct1';
      state.gap = Number(payload.g) || 0;
      state.tail = Number(payload.t) || 0;
      state.previewVolume = payload.v === undefined ? 0.35 : Number(payload.v);
      state.segments = payload.s.map((seg) => ({
        f1: Number(seg.f1) || 0,
        f2: Number(seg.f2) || 0,
        dur: Number(seg.dur) || 0,
        gain: seg.gain === undefined ? 2048 : Number(seg.gain),
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- rendering ----------

  const NUMERIC_FIELDS = [
    { prop: 'f1', numberClass: 'f1-input', rangeClass: 'f1-range' },
    { prop: 'f2', numberClass: 'f2-input', rangeClass: 'f2-range' },
    { prop: 'dur', numberClass: 'dur-input', rangeClass: 'dur-range' },
    { prop: 'gain', numberClass: 'gain-input', rangeClass: 'gain-range' },
  ];

  function renderSegmentsTable() {
    const tbody = el('segments-body');
    const tpl = el('segment-row-template');
    tbody.innerHTML = '';
    state.segments.forEach((seg, i) => {
      const row = tpl.content.firstElementChild.cloneNode(true);
      row.dataset.index = String(i);
      row.querySelector('.row-index').textContent = String(i + 1);
      NUMERIC_FIELDS.forEach(({ prop, numberClass, rangeClass }) => {
        const value = seg[prop];
        row.querySelector(`.${numberClass}`).value = prop === 'f2' ? value || '' : value;
        row.querySelector(`.${rangeClass}`).value = value || 0;
      });
      tbody.appendChild(row);
    });
  }

  function refreshOutputs() {
    el('stanza-string').value = generateStanza(state);
    const n = state.segments.length;
    el('segment-count').textContent = `${n} segment${n === 1 ? '' : 's'}`;
    const totalMs = buildExpandedSegments(state).reduce((sum, seg) => sum + (Number(seg.dur) || 0), 0);
    el('total-duration').textContent = `${totalMs} ms total`;
    updateShareLink();
  }

  function render() {
    el('tone-key').value = state.toneKey;
    el('gap-ms').value = state.gap;
    el('tail-ms').value = state.tail;
    el('preview-volume').value = state.previewVolume;
    renderSegmentsTable();
    refreshOutputs();
  }

  // ---------- presets ----------

  function populatePresetSelect(filterText) {
    const select = el('preset-select');
    const f = (filterText || '').trim().toLowerCase();
    select.innerHTML = '';
    PRESET_LIBRARIES.forEach((lib, libIndex) => {
      const matches = lib.presets
        .map((preset, presetIndex) => ({ preset, presetIndex }))
        .filter(({ preset }) => !f || preset.name.toLowerCase().includes(f));
      if (!matches.length) return;
      const group = document.createElement('optgroup');
      group.label = lib.label;
      matches.forEach(({ preset, presetIndex }) => {
        const opt = document.createElement('option');
        opt.value = `${libIndex}:${presetIndex}`;
        opt.textContent = preset.name;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });
    updatePresetSourceHint();
  }

  function getSelectedPreset() {
    const raw = el('preset-select').value;
    if (!raw) return null;
    const [libIndex, presetIndex] = raw.split(':').map(Number);
    const lib = PRESET_LIBRARIES[libIndex];
    if (!lib || !lib.presets[presetIndex]) return null;
    return { lib, preset: lib.presets[presetIndex] };
  }

  function updatePresetSourceHint() {
    const sel = getSelectedPreset();
    el('preset-source-hint').textContent = sel ? `Source: ${sel.lib.source}` : '';
  }

  function loadCustomPresets() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomPresets(list) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  }

  function populateCustomPresetSelect() {
    const select = el('custom-preset-select');
    const list = loadCustomPresets();
    select.innerHTML = '';
    if (!list.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '— none saved —';
      select.appendChild(opt);
      return;
    }
    list.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  }

  // ---------- theme ----------

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    el('theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
    el('theme-label').textContent = theme === 'dark' ? 'Dark' : 'Light';
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }

  // ---------- event wiring ----------

  function wireGlobalFields() {
    el('tone-key').addEventListener('input', (e) => {
      state.toneKey = e.target.value.trim() || 'ct1';
      refreshOutputs();
    });
    el('gap-ms').addEventListener('input', (e) => {
      state.gap = Math.max(0, Number(e.target.value) || 0);
      refreshOutputs();
    });
    el('tail-ms').addEventListener('input', (e) => {
      state.tail = Math.max(0, Number(e.target.value) || 0);
      refreshOutputs();
    });
    el('preview-volume').addEventListener('input', (e) => {
      state.previewVolume = clamp(Number(e.target.value) || 0, 0, 1);
    });
  }

  function wireSegmentsTable() {
    const tbody = el('segments-body');
    tbody.addEventListener('input', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;
      const i = Number(row.dataset.index);
      const seg = state.segments[i];
      if (!seg) return;
      const field = NUMERIC_FIELDS.find(
        ({ numberClass, rangeClass }) => e.target.classList.contains(numberClass) || e.target.classList.contains(rangeClass)
      );
      if (field) {
        const max = field.prop === 'gain' ? 4096 : Infinity;
        seg[field.prop] = clamp(Number(e.target.value) || 0, 0, max);
        const cell = e.target.closest('.numeric-cell');
        const numberInput = cell.querySelector(`.${field.numberClass}`);
        const rangeInput = cell.querySelector(`.${field.rangeClass}`);
        if (e.target !== numberInput) numberInput.value = seg[field.prop];
        if (e.target !== rangeInput) rangeInput.value = seg[field.prop];
      }
      refreshOutputs();
    });

    tbody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;
      const i = Number(row.dataset.index);
      if (e.target.classList.contains('delete-row')) {
        state.segments.splice(i, 1);
        render();
      } else if (e.target.classList.contains('duplicate-row')) {
        state.segments.splice(i + 1, 0, { ...state.segments[i] });
        render();
      } else if (e.target.classList.contains('move-up') && i > 0) {
        [state.segments[i - 1], state.segments[i]] = [state.segments[i], state.segments[i - 1]];
        render();
      } else if (e.target.classList.contains('move-down') && i < state.segments.length - 1) {
        [state.segments[i + 1], state.segments[i]] = [state.segments[i], state.segments[i + 1]];
        render();
      }
    });
  }

  function wireButtons() {
    el('add-segment').addEventListener('click', () => {
      state.segments.push({ f1: 600, f2: 0, dur: 100, gain: 2048 });
      render();
    });

    el('play-btn').addEventListener('click', () => {
      const { segments, sourceIndices } = buildExpandedSegmentsWithSource(state);
      playSegments(segments, state.previewVolume, sourceIndices);
    });
    el('stop-btn').addEventListener('click', stopPlayback);

    el('copy-stanza').addEventListener('click', () => copyText(el('stanza-string').value, 'copy-stanza', 'Copy stanza line'));
    el('copy-share').addEventListener('click', () => copyText(el('share-link').value, 'copy-share', 'Copy share link'));

    el('reset-btn').addEventListener('click', () => {
      if (!confirm('Reset to the default sequence? This clears your current segments.')) return;
      state = DEFAULT_STATE();
      render();
    });

    el('load-preset').addEventListener('click', () => {
      const sel = getSelectedPreset();
      if (!sel) return;
      state.toneKey = sel.preset.key || state.toneKey;
      state.segments = sel.preset.segments.map((s) => ({ ...s }));
      state.gap = 0;
      state.tail = 0;
      render();
    });
    el('preset-select').addEventListener('change', updatePresetSourceHint);
    el('preset-filter').addEventListener('input', (e) => populatePresetSelect(e.target.value));
    el('preset-filter-clear').addEventListener('click', () => {
      const filterInput = el('preset-filter');
      filterInput.value = '';
      populatePresetSelect('');
      filterInput.focus();
    });
    el('preview-preset').addEventListener('click', () => {
      const sel = getSelectedPreset();
      if (!sel) return;
      playSegments(sel.preset.segments, state.previewVolume);
    });

    el('save-custom-preset').addEventListener('click', () => {
      const name = prompt('Name this preset:');
      if (!name) return;
      const list = loadCustomPresets();
      list.push({
        name,
        key: state.toneKey,
        gap: state.gap,
        tail: state.tail,
        segments: state.segments.map((s) => ({ ...s })),
      });
      saveCustomPresets(list);
      populateCustomPresetSelect();
    });

    el('load-custom-preset').addEventListener('click', () => {
      const idx = el('custom-preset-select').value;
      if (idx === '') return;
      const list = loadCustomPresets();
      const p = list[Number(idx)];
      if (!p) return;
      state.toneKey = p.key || 'ct1';
      state.gap = Number(p.gap) || 0;
      state.tail = Number(p.tail) || 0;
      state.segments = p.segments.map((s) => ({ ...s }));
      render();
    });

    el('delete-custom-preset').addEventListener('click', () => {
      const idx = el('custom-preset-select').value;
      if (idx === '') return;
      const list = loadCustomPresets();
      const p = list[Number(idx)];
      if (!p || !confirm(`Delete saved preset "${p.name}"?`)) return;
      list.splice(Number(idx), 1);
      saveCustomPresets(list);
      populateCustomPresetSelect();
    });

    el('export-presets').addEventListener('click', () => {
      const list = loadCustomPresets();
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'courtesy-tone-presets.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    el('import-presets').addEventListener('click', () => el('import-file-input').click());
    el('import-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (!Array.isArray(imported)) throw new Error('not an array');
          const list = loadCustomPresets();
          const merged = list.concat(imported.filter((p) => p && p.name && Array.isArray(p.segments)));
          saveCustomPresets(merged);
          populateCustomPresetSelect();
          alert(`Imported ${imported.length} preset(s).`);
        } catch (err) {
          alert('Could not import: file is not a valid presets JSON export.');
        }
        el('import-file-input').value = '';
      };
      reader.readAsText(file);
    });

    el('play-string').addEventListener('click', () => {
      const parsed = parseStanza(el('stanza-string').value);
      if (!parsed.segments.length) {
        el('parse-error').textContent = 'No valid (f1,f2,dur,gain) tuples found in the string.';
        return;
      }
      el('parse-error').textContent = '';
      playSegments(parsed.segments, state.previewVolume);
    });

    el('load-string').addEventListener('click', () => {
      const parsed = parseStanza(el('stanza-string').value);
      if (!parsed.segments.length) {
        el('parse-error').textContent = 'No valid (f1,f2,dur,gain) tuples found in the string.';
        return;
      }
      el('parse-error').textContent = '';
      if (parsed.key) state.toneKey = parsed.key;
      state.segments = parsed.segments;
      state.gap = 0;
      state.tail = 0;
      render();
    });

    el('theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ---------- morse code generator ----------

  function wireMorse() {
    const textEl = el('morse-text');
    const keyEl = el('morse-key');
    const wpmNum = el('morse-wpm');
    const wpmRange = el('morse-wpm-range');
    const freqNum = el('morse-freq');
    const freqRange = el('morse-freq-range');
    const gainNum = el('morse-gain');
    const gainRange = el('morse-gain-range');

    function currentMorseSegments() {
      const wpm = clamp(Number(wpmNum.value) || 20, 5, 60);
      const freq = Math.max(0, Number(freqNum.value) || 0);
      const gain = clamp(Number(gainNum.value) || 0, 0, 4096);
      return morseToSegments(textEl.value, wpm, freq, gain);
    }

    function refreshMorse() {
      const segments = currentMorseSegments();
      const key = keyEl.value.trim() || 'cwid';
      el('morse-stanza').value = `${key}=|t${tuplesString(segments)}`;
      el('morse-preview').textContent = morseToReadable(textEl.value) || '(nothing to send)';
      const unsupported = morseUnsupportedChars(textEl.value);
      el('morse-warning').textContent = unsupported.length
        ? `Skipped unsupported character${unsupported.length === 1 ? '' : 's'}: ${unsupported.join(' ')}`
        : '';
    }

    [textEl, keyEl].forEach((input) => input.addEventListener('input', refreshMorse));
    bindNumberRangePair(wpmNum, wpmRange, refreshMorse);
    bindNumberRangePair(freqNum, freqRange, refreshMorse);
    bindNumberRangePair(gainNum, gainRange, refreshMorse);

    el('morse-play').addEventListener('click', () => {
      playSegments(currentMorseSegments(), state.previewVolume);
    });
    el('morse-stop').addEventListener('click', stopPlayback);
    el('morse-copy').addEventListener('click', () => copyText(el('morse-stanza').value, 'morse-copy', 'Copy stanza line'));

    el('morse-append').addEventListener('click', () => {
      state.segments = state.segments.concat(currentMorseSegments());
      render();
    });
    el('morse-replace').addEventListener('click', () => {
      if (!confirm('Replace the current tone segments with this Morse sequence?')) return;
      state.segments = currentMorseSegments();
      render();
    });

    refreshMorse();
  }

  function copyText(text, btnId, restoreLabel) {
    const done = () => {
      const btn = el(btnId);
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = restoreLabel;
      }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      /* ignore */
    }
    ta.remove();
  }

  // ---------- init ----------

  function init() {
    initTheme();
    populatePresetSelect();
    populateCustomPresetSelect();
    wireGlobalFields();
    wireSegmentsTable();
    wireButtons();
    wireMorse();
    loadStateFromHash();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
