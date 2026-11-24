// Tamaño de letra, ancho de columna y deslizar para cambiar de capítulo.
import { $ } from './util.js';
import { store } from './store.js';
import { savePrefs } from './storage.js';

export const SIZES = [0.95, 1.05, 1.14, 1.3, 1.5, 1.7]; // rem; el índice 2 es el tamaño base
export const WIDTHS = { narrow: '52ch', normal: '65ch', wide: '80ch' };

export function applyPrefs() {
  const { size, width, swipe } = store.prefs;
  const root = document.documentElement.style;
  root.setProperty('--vtext-size', SIZES[size] + 'rem');
  root.setProperty('--vtext-width', WIDTHS[width]);

  const label = $('sizeLabel');
  if (label) label.textContent = Math.round((SIZES[size] / SIZES[2]) * 100) + '%';
  const down = $('sizeDown');
  const up = $('sizeUp');
  if (down) down.disabled = size === 0;
  if (up) up.disabled = size === SIZES.length - 1;
  document.querySelectorAll('[data-width-set]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.widthSet === width));
  });
  const sw = $('swipeToggle');
  if (sw) sw.checked = swipe;
}

export function changeSize(dir) {
  const next = store.prefs.size + dir;
  if (next < 0 || next >= SIZES.length) return;
  store.prefs.size = next;
  savePrefs();
  applyPrefs();
}

export function setWidth(w) {
  if (!WIDTHS[w]) return;
  store.prefs.width = w;
  savePrefs();
  applyPrefs();
}

export function setSwipe(on) {
  store.prefs.swipe = !!on;
  savePrefs();
  applyPrefs();
}
