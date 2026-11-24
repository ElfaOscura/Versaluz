import { $ } from './util.js';

const KEY = 'rvr1960.theme'; // 'light' | 'dark'. Sin valor = sigue el tema del sistema.

function stored() {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch { return null; }
}

export function effectiveTheme() {
  return stored() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function syncUi() {
  const cur = effectiveTheme();
  const light = $('themeLight');
  const dark = $('themeDark');
  if (light) light.setAttribute('aria-pressed', String(cur === 'light'));
  if (dark) dark.setAttribute('aria-pressed', String(cur === 'dark'));
  // Color de la barra del navegador en el móvil
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bar = getComputedStyle(document.documentElement).getPropertyValue('--bar').trim();
    if (bar) meta.setAttribute('content', bar);
  }
}

function apply(t) {
  if (t) document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
  syncUi();
  window.dispatchEvent(new Event('themechange'));
}

export function setTheme(t) {
  try { localStorage.setItem(KEY, t); } catch { /* almacenamiento bloqueado: vale solo para esta sesión */ }
  apply(t);
}

export function initTheme() {
  apply(stored());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!stored()) { syncUi(); window.dispatchEvent(new Event('themechange')); }
  });
}
