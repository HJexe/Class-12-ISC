/**
 * ISC.exe — Smart Theme & Accent Color System
 * ============================================
 * Automatically derives readable, accessible UI colors from ANY accent color
 * AND generates complete UI Background Palettes from any base hue.
 */

(function () {
  'use strict';

  // ─── MATH HELPERS ────────────────────────────────────────────────────────────
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v =>
      Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
    ).join('');
  }

  function luminance(r, g, b) {
    const [R, G, B] = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function adjustLightness(rgb, amount) {
    return rgb.map(c => Math.max(0, Math.min(255, c + amount * 255)));
  }

  function mix(rgb, toward, t) {
    return rgb.map((c, i) => c * (1 - t) + toward[i] * t);
  }

  function desaturate(rgb, t) {
    const gray = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
    return rgb.map(c => c + (gray - c) * t);
  }

  function rgba(rgb, alpha) {
    return `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${alpha})`;
  }

  // ─── SMART UI THEME GENERATOR ──────────────────────────────────────────────
  
  /**
   * Generates a complete UI palette (surfaces, borders, text) from a single background hex.
   * Smartly handles absolute black/dark inputs and light themes.
   */
  function generatePaletteFromHue(baseHex) {
    let [r, g, b] = hexToRgb(baseHex);

    // Keep custom backgrounds within the dark-only palette while retaining their hue.
    if (luminance(r, g, b) > 0.12) {
      const scale = 30 / Math.max(r, g, b);
      r *= scale; g *= scale; b *= scale;
      baseHex = rgbToHex(r, g, b);
    }

    // Bump absolute black so surfaces/borders are still visible
    if (r < 6 && g < 6 && b < 6) {
      r = 6; g = 6; b = 6;
      baseHex = rgbToHex(r, g, b);
    }

    const lum = luminance(r, g, b);
    const clamp = v => Math.min(255, Math.max(0, Math.round(v)));
    const toHex = (nr, ng, nb) => `#${clamp(nr).toString(16).padStart(2,'0')}${clamp(ng).toString(16).padStart(2,'0')}${clamp(nb).toString(16).padStart(2,'0')}`;

    // Dark mode derivation 
    const bump = (val, factor, flat) => val * factor + flat;
    return {
      name: 'Custom',
      bg: baseHex,
      bg2: toHex(bump(r, 1.12, 4), bump(g, 1.12, 4), bump(b, 1.12, 4)),
      surface: toHex(bump(r, 1.35, 10), bump(g, 1.35, 10), bump(b, 1.35, 10)),
      surface2: toHex(bump(r, 1.55, 16), bump(g, 1.55, 16), bump(b, 1.55, 16)),
      border: toHex(bump(r, 1.80, 24), bump(g, 1.80, 24), bump(b, 1.80, 24)),
      border2: toHex(bump(r, 2.05, 32), bump(g, 2.05, 32), bump(b, 2.05, 32)),
      light: false,
      fg: '#f8fafc',
      fg2: '#cbd5e1',
      fg3: '#94a3b8'
    };
  }

  function applyUITheme(theme, save = true) {
    if (!theme) return;
    // Migrate old saved light themes into a dark palette with a related hue.
    if (theme.light || luminance(...hexToRgb(theme.bg || '#080b11')) > 0.12) {
      const dark = generatePaletteFromHue(theme.bg || '#080b11');
      theme = { ...dark, name: theme.name === 'Custom' ? 'Custom' : (theme.name || dark.name) };
    } else {
      theme = { ...theme, light: false };
    }
    const root = document.documentElement;
    
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--bg2', theme.bg2);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--surface2', theme.surface2);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--border2', theme.border2);

    root.style.setProperty('--fg', theme.fg || '#f8fafc');
    root.style.setProperty('--fg2', theme.fg2 || '#cbd5e1');
    root.style.setProperty('--fg3', theme.fg3 || '#94a3b8');
    document.body.classList.remove('light-mode');

    if (save) localStorage.setItem('isc-ui-theme', JSON.stringify(theme));
    document.dispatchEvent(new CustomEvent('isc-ui-theme-changed', { detail: theme }));
  }

  // ─── SMART ACCENT GENERATOR ───────────────────────────────────────────────
  
  const ASSUMED_BG_LUM = 0.025;

  function makeSafeTextColor(rgb) {
    const lum = luminance(...rgb);
    const c = (lum + 0.05) / (ASSUMED_BG_LUM + 0.05);

    if (c >= 4.5) {
      if (lum > 0.85) return rgbToHex(...desaturate(rgb, 0.15).map(Math.round));
      return rgbToHex(...rgb.map(Math.round));
    }

    let adjusted = [...rgb];
    for (let step = 0; step < 30; step++) {
      adjusted = adjustLightness(adjusted, 0.04);
      if ((luminance(...adjusted) + 0.05) / (ASSUMED_BG_LUM + 0.05) >= 4.5) break;
    }
    return rgbToHex(...adjusted.map(Math.round));
  }

  function colorOnAccent(rgb) {
    const lum = luminance(...rgb);
    return ((lum + 0.05) / 0.05) > (1.05 / (lum + 0.05)) ? '#000' : '#fff';
  }

  function makeBorderColor(rgb, alpha = 0.28) {
    return rgba(desaturate(rgb, 0.35), alpha);
  }

  function applySmartAccent(hex, gradA, gradB) {
    if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;

    const rgb = hexToRgb(hex);
    const root = document.documentElement;

    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-lo', rgba(rgb, 0.09));
    root.style.setProperty('--accent-md', rgba(rgb, 0.18));
    root.style.setProperty('--accent-hi', rgba(rgb, 0.35));
    root.style.setProperty('--accent-subtle', rgba(rgb, 0.03));

    const safeText = makeSafeTextColor(rgb);
    root.style.setProperty('--accent-text', safeText);
    root.style.setProperty('--accent-on', colorOnAccent(rgb));
    root.style.setProperty('--accent-border', makeBorderColor(rgb, 0.28));
    root.style.setProperty('--accent-glow', rgba(rgb, 0.22));

    const navMuted = mix(hexToRgb(safeText), hexToRgb(safeText), 0.85);
    root.style.setProperty('--accent-nav', rgbToHex(...navMuted.map(Math.round)));

    root.style.setProperty('--grad-a', gradA || hex);
    root.style.setProperty('--grad-b', gradB || hex);
    
    _updatePageElements(hex, safeText);
  }

  function _updatePageElements(hex, safeText) {
    const setProp = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };
    setProp('navMark', 'background', hex);
    setProp('navMark', 'boxShadow', `0 0 10px ${hex}`);
    setProp('triggerSwatch', 'background', hex);
    setProp('triggerSwatch', 'boxShadow', `0 0 6px ${hex}`);
    setProp('pickerPanel', 'borderTopColor', hex);
    setProp('heroSub', 'color', safeText);
    
    document.querySelectorAll('.apply-btn').forEach(b => b.style.background = hex);
    document.querySelectorAll('.nav-link-pip').forEach(p => { p.style.background = hex; p.style.boxShadow = `0 0 6px ${hex}`; });
  }

  function applySmartGradient(a, b) {
    if (!a || !b) return;
    applySmartAccent(a, a, b);
    document.body.classList.add('grad-mode');
    
    const setGrad = (id) => {
      const el = document.getElementById(id);
      if (el) { el.style.background = `linear-gradient(135deg, ${a}, ${b})`; el.style.boxShadow = `0 0 10px ${a}`; }
    };
    setGrad('triggerSwatch');
    setGrad('navMark');
  }

  function bootstrap() {
    // 1. Load UI Theme
    const savedUITheme = localStorage.getItem('isc-ui-theme');
    if (savedUITheme) {
      try { applyUITheme(JSON.parse(savedUITheme), true); } catch (e) {}
    }

    // 2. Load Accent/Gradient
    const savedGrad = localStorage.getItem('isc-gradient');
    const savedAccent = localStorage.getItem('isc-accent');

    if (savedGrad) {
      try {
        const g = JSON.parse(savedGrad);
        if (g.a && g.b) { applySmartGradient(g.a, g.b); return; }
      } catch (e) {}
    }
    if (savedAccent && /^#[0-9a-fA-F]{6}$/.test(savedAccent)) {
      document.body.classList.remove('grad-mode');
      applySmartAccent(savedAccent);
    }
  }

  window.ISCTheme = {
    apply: applySmartAccent,
    applyGradient: applySmartGradient,
    applyUITheme,
    generatePaletteFromHue,
    bootstrap,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();

})();
