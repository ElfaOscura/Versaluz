// Paseo inicial: una guía por pasos, sin dependencias. Resalta un elemento y explica para qué sirve.
import { $ } from './util.js';
import { store } from './store.js';
import { getView, setView } from './render.js';

const KEY = 'rvr1960.tour';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* sin almacenamiento: se mostrará de nuevo */ } };

const menuOpen = () => !$('menu').hidden;
const openMenu = () => { if (!menuOpen()) $('btnMenu').click(); };
const closeMenu = () => { if (menuOpen()) $('btnMenu').click(); };

// `target` devuelve el elemento a resaltar (o null para un paso centrado). `prep` deja la pantalla lista.
const STEPS = [
  {
    title: 'Bienvenido a Versaluz',
    text: 'Un lector de la Reina-Valera 1960 para estudiar con calma. Te muestro lo esencial en menos de un minuto; puedes salir cuando quieras.',
    target: () => null,
  },
  {
    title: 'Buscar y ir a un pasaje',
    text: 'Escribe una palabra para buscar en toda la Biblia, o una referencia como «Juan 3:16», «Salmos 23» o «1 Cor 13:4-7» para ir directo. La tecla / enfoca el buscador.',
    target: () => $('searchBox'),
  },
  {
    title: 'Filtros',
    text: 'Acota por libro, capítulo, versículo, testamento o etiqueta. Un punto en el botón te avisa cuando hay filtros activos.',
    target: () => $('btnFilters'),
  },
  {
    title: 'Notas, resaltados y etiquetas',
    text: 'Al abrir un capítulo, toca el número de un versículo para seleccionarlo. Debajo de cada uno tienes iconos para añadir etiquetas, escribir una nota, resaltarlo con color, guardarlo como marcalibro o compartirlo.',
    target: () => document.querySelector('#list .verse') || $('list'),
  },
  {
    title: 'Mi cuaderno',
    text: 'Todo lo tuyo en una sola vista: tus notas con categorías, los versículos agrupados por etiqueta y los textos resaltados. Desde allí también exportas un archivo .md.',
    target: () => $('btnNotes'),
    prep: () => { closeMenu(); if (getView() !== 'read') setView('read'); },
  },
  {
    title: 'Respaldo y exportación',
    text: 'En Ajustes → «Respaldo de mis datos» descargas o compartes un archivo .json (por ejemplo a Google Drive), lo cargas con vista previa y exportas tus apuntes. Tus datos viven solo en este dispositivo, así que respalda de vez en cuando.',
    target: () => $('btnBackup'),
    prep: openMenu,
  },
  {
    title: 'Ajustes e instalación',
    text: 'Aquí cambias el tema, el tamaño de letra y el ancho de columna. Si tu navegador lo permite, verás «Instalar la app» para usar Versaluz sin conexión. Esta guía siempre está en «Ver guía inicial».',
    target: () => $('menu'),
    prep: openMenu,
  },
];

let t = null; // estado del paseo en curso

const rectOf = (el) => (el ? el.getBoundingClientRect() : null);
const visible = (el) => { const r = rectOf(el); return !!r && r.width > 0 && r.height > 0; };

function build() {
  const shield = document.createElement('div');
  shield.className = 'tour-shield';
  const ring = document.createElement('div');
  ring.className = 'tour-ring';
  ring.setAttribute('aria-hidden', 'true');
  const card = document.createElement('div');
  card.className = 'tour-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'tourTitle');
  card.setAttribute('aria-describedby', 'tourText');
  card.tabIndex = -1;
  document.body.append(shield, ring, card);
  return { shield, ring, card };
}

function place() {
  if (!t) return;
  const { ring, card } = t;
  const step = t.steps[t.i];
  const el = step.target();
  const r = visible(el) ? rectOf(el) : null;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;

  if (!r) {
    ring.hidden = true;
    card.style.cssText = '';
    card.classList.add('center');
    return;
  }
  card.classList.remove('center');
  const pad = 6;
  ring.hidden = false;
  Object.assign(ring.style, {
    left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px',
  });

  if (mobile) { // hoja fija abajo; el elemento queda visible arriba
    card.style.cssText = '';
    return;
  }
  const cw = Math.min(360, vw - 24);
  const ch = card.offsetHeight;
  const below = vh - r.bottom;
  let top = below >= ch + 20 ? r.bottom + 14 : r.top - ch - 14;
  if (top < 12) top = Math.max(12, Math.min(vh - ch - 12, r.top + r.height / 2 - ch / 2));
  let left = r.left + r.width / 2 - cw / 2;
  left = Math.max(12, Math.min(vw - cw - 12, left));
  // Si el elemento es muy alto (el menú) y no cabe arriba ni abajo, la tarjeta va a su izquierda
  if (top > r.top && top < r.bottom && r.height > vh * 0.5) { left = Math.max(12, r.left - cw - 16); top = 80; }
  card.style.cssText = `width:${cw}px;left:${left}px;top:${top}px;`;
}

function show() {
  const step = t.steps[t.i];
  if (step.prep) step.prep(); else closeMenu();
  const el = step.target();
  const mobile = document.documentElement.clientWidth < 640;
  if (el && !el.closest('header')) {
    el.scrollIntoView({ block: mobile ? 'start' : 'center', behavior: 'auto' });
    if (mobile) window.scrollBy(0, -90); // deja a la vista la barra superior pegajosa
  }
  const last = t.i === t.steps.length - 1;
  t.card.innerHTML =
    `<p class="tour-count">Paso ${t.i + 1} de ${t.steps.length}</p>` +
    `<h2 id="tourTitle">${step.title}</h2><p id="tourText">${step.text}</p>` +
    '<div class="tour-btns">' +
    '<button type="button" class="btn ghost" data-tour="skip">Saltar</button>' +
    `<span class="tour-nav">${t.i ? '<button type="button" class="btn" data-tour="back">Atrás</button>' : ''}` +
    `<button type="button" class="btn primary" data-tour="next">${last ? 'Terminar' : 'Siguiente'}</button></span></div>`;
  place();
  requestAnimationFrame(place); // tras pintar el menú o hacer scroll
  t.card.querySelector('[data-tour="next"]').focus({ preventScroll: true });
}

function go(d) {
  const n = t.i + d;
  if (n < 0) return;
  if (n >= t.steps.length) { stop(true); return; }
  t.i = n;
  show();
}

function stop(done = true) {
  if (!t) return;
  const { shield, ring, card, opener } = t;
  window.removeEventListener('resize', t.onMove);
  window.removeEventListener('scroll', t.onMove, true);
  document.removeEventListener('keydown', t.onKey, true);
  shield.remove(); ring.remove(); card.remove();
  closeMenu();
  t = null;
  write('1');
  if (done && opener && document.contains(opener)) opener.focus({ preventScroll: true });
}

/** Inicia el paseo. `force` lo muestra aunque ya se haya visto. */
export function startTour(force = false) {
  if (t || !store.bible) return;
  if (!force && read()) return;
  if (getView() !== 'read') setView('read');
  const opener = document.activeElement;
  const els = build();
  const steps = STEPS;
  t = { ...els, steps, i: 0, opener };
  let raf = 0;
  t.onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
  t.onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(-1); }
    else if (e.key === 'Tab') { // el foco no sale de la tarjeta
      const f = [...t.card.querySelectorAll('button')];
      if (!f.length) return;
      const first = f[0], lastB = f[f.length - 1];
      if (!t.card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
      else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
    }
  };
  window.addEventListener('resize', t.onMove);
  window.addEventListener('scroll', t.onMove, true);
  document.addEventListener('keydown', t.onKey, true);
  t.card.addEventListener('click', (e) => {
    e.stopPropagation(); // que el clic no cierre el menú de ajustes por «clic fuera»
    const b = e.target.closest('[data-tour]');
    if (!b) return;
    if (b.dataset.tour === 'next') go(1);
    else if (b.dataset.tour === 'back') go(-1);
    else stop(true);
  });
  t.shield.addEventListener("click", (e) => { e.stopPropagation(); t.card.querySelector('[data-tour="next"]').focus(); });
  show();
}

export const tourSeen = () => !!read();

export function initTour() {
  $('btnTour').addEventListener('click', () => setTimeout(() => startTour(true), 60));
}

/** Primera visita: tras mostrar la Biblia, ofrece el paseo una sola vez. */
export function maybeStartTour() {
  if (read()) return;
  setTimeout(() => startTour(false), 700);
}
