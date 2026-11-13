/**
 * ISC.exe — Shared Theme Picker Logic
 * =====================================
 */

(function () {
  'use strict';

  const STORE_KEY = 'isc-accent';
  const GRAD_KEY  = 'isc-gradient';
  const UI_THEME_KEY = 'isc-ui-theme';
  const DEFAULT_ACCENT = '#3bff6c';

  const UI_THEMES = [
    {name:'Obsidian Contrast', bg:'#080b11', bg2:'#111724', surface:'#182133', surface2:'#212c42', border:'#2a3750', border2:'#475c82'},
    {name:'Midnight Blue', bg:'#0f1318', bg2:'#131921', surface:'#1a2230', surface2:'#1f2938', border:'#253040', border2:'#2c3a4d'},
    {name:'Deep Navy',     bg:'#0b1120', bg2:'#0f172a', surface:'#162036', surface2:'#1c2a44', border:'#243454', border2:'#2d3f60'},
    {name:'Arctic Steel',  bg:'#0e1318', bg2:'#121a22', surface:'#1a2636', surface2:'#203040', border:'#28384e', border2:'#32445a'},
    {name:'Forest Night',  bg:'#0c1610', bg2:'#101e15', surface:'#172b1e', surface2:'#1e3526', border:'#264030', border2:'#2e4d38'},
    {name:'Emerald Dark',  bg:'#0a1612', bg2:'#0e1c18', surface:'#152a22', surface2:'#1c342c', border:'#243e34', border2:'#2c4a3e'}
  ];

  const SOLID_PRESETS = [
    { name: 'Matrix Green',   hex: '#3bff6c' }, { name: 'Mint',           hex: '#5fffa0' },
    { name: 'Sky Blue',       hex: '#48aff7' }, { name: 'Royal Indigo',   hex: '#7c6fff' },
    { name: 'Violet',         hex: '#bf5fff' }, { name: 'Amber',          hex: '#ffbe3f' }
  ];

  let pickerOpen = false;
  let currentUITheme = JSON.parse(localStorage.getItem(UI_THEME_KEY) || 'null');
  if (currentUITheme?.light) currentUITheme = UI_THEMES[0];
  let currentHex = localStorage.getItem(STORE_KEY) || DEFAULT_ACCENT;
  let currentGrad = JSON.parse(localStorage.getItem(GRAD_KEY) || 'null');

  const $ = id => document.getElementById(id);

  function togglePicker() {
    pickerOpen = !pickerOpen;
    $('pickerPanel')?.classList.toggle('open', pickerOpen);
    $('colorTrigger')?.classList.toggle('open', pickerOpen);
    if (pickerOpen) {
      buildUIThemePresets();
      buildPresets();
    }
  }

  function closePicker() {
    pickerOpen = false;
    $('pickerPanel')?.classList.remove('open');
    $('colorTrigger')?.classList.remove('open');
  }

  function switchPickerMode(mode) {
    $('solidPanel').style.display = mode === 'ui-theme' ? '' : 'none';
    $('gradPanel').style.display = mode === 'accent' ? '' : 'none';
    $('pmtSolid').classList.toggle('active', mode === 'ui-theme');
    $('pmtGrad').classList.toggle('active', mode === 'accent');
  }

  // ─── UI THEME ───
  function applyUITheme(theme, save = true) {
    if (theme?.light) theme = UI_THEMES[0];
    currentUITheme = theme;
    window.ISCTheme.applyUITheme(theme, save);
    buildUIThemePresets(); 
  }

  function applyCustomUITheme() {
    const inp = $('uiThemeHex');
    let v = inp.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) { inp.classList.add('err'); return; }
    
    inp.classList.remove('err');
    $('uiThemePicker').value = v;
    
    // Leverage the new smart palette generator
    const theme = window.ISCTheme.generatePaletteFromHue(v);
    applyUITheme(theme, true);
  }

  function buildUIThemePresets() {
    const grid = $('uiThemeGrid');
    if (!grid) return;
    grid.innerHTML = '';

    UI_THEMES.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.className = 'ui-theme-swatch' + (currentUITheme && currentUITheme.name === t.name ? ' active' : (!currentUITheme && i === 0 ? ' active' : ''));
      btn.title = t.name;
      btn.innerHTML = `<div class="ui-theme-swatch-inner">
        <div class="ui-swatch-band" style="background:${t.bg}"></div>
        <div class="ui-swatch-band" style="background:${t.surface}"></div>
        <div class="ui-swatch-band" style="background:${t.border}"></div>
      </div>`;
      btn.onclick = () => { applyUITheme(t, true); closePicker(); };
      grid.appendChild(btn);
    });
  }

  // ─── ACCENT ───
  function applyAccent(hex) {
    currentHex = hex;
    currentGrad = null;
    document.body.classList.remove('grad-mode');
    window.ISCTheme.apply(hex);
    
    localStorage.setItem(STORE_KEY, hex);
    localStorage.removeItem(GRAD_KEY);
    
    if($('hexInput')) $('hexInput').value = hex.toUpperCase();
    if($('nativePicker')) $('nativePicker').value = hex;
    buildPresets();
  }

  function applyHex() {
    const inp = $('hexInput');
    let v = inp.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) { inp.classList.add('err'); return; }
    inp.classList.remove('err');
    applyAccent(v);
    closePicker();
  }

  function buildPresets() {
    const grid = $('presetsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    SOLID_PRESETS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset' + (!currentGrad && p.hex.toLowerCase() === currentHex.toLowerCase() ? ' active' : '');
      btn.style.background = p.hex;
      btn.onclick = () => { applyAccent(p.hex); closePicker(); };
      grid.appendChild(btn);
    });
  }

  function resetAll() {
    currentUITheme = null;
    localStorage.removeItem(UI_THEME_KEY);
    applyUITheme(UI_THEMES[0], true);
    
    localStorage.removeItem(GRAD_KEY);
    applyAccent(DEFAULT_ACCENT);
  }

  function init() {
    document.addEventListener('click', e => { if (pickerOpen && !$('pickerWrap').contains(e.target)) closePicker(); });
    
    const uiPicker = $('uiThemePicker');
    if (uiPicker) {
      uiPicker.addEventListener('input', e => { $('uiThemeHex').value = e.target.value.toUpperCase(); });
      $('uiThemeHex').addEventListener('keydown', e => { if (e.key === 'Enter') applyCustomUITheme(); });
    }

    const native = $('nativePicker');
    if (native) {
      native.addEventListener('input', e => { $('hexInput').value = e.target.value.toUpperCase(); applyAccent(e.target.value); });
      $('hexInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyHex(); });
    }
  }

  window.ISCPicker = { togglePicker, closePicker, applyHex, applyCustomUITheme, switchPickerMode, resetAll };
  window.togglePicker = togglePicker;
  window.switchPickerMode = switchPickerMode;
  window.applyHex = applyHex;
  window.applyCustomUITheme = applyCustomUITheme;
  window.resetAll = resetAll;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
