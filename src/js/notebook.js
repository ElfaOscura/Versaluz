// "Mi cuaderno": vista dedicada (no modal) con tus notas, etiquetas y textos resaltados.
import { $, esc, toast } from './util.js';
import { store } from './store.js';
import { refOf, validKey } from './bible.js';
import { setNote, setHighlight, COLORS, COLOR_NAMES } from './study.js';
import { sortKeys } from './share.js';
import { tagCounts } from './tags.js';
import {
  NONE, notesFor, noteCounts, reorderNotes, moveNote, addCategory, setNoteCategory, deleteCategory,
} from './notes.js';
import { hasUserData, buildMarkdown, downloadFile, notesFileName } from './backupdata.js';
import { goto, updateVerse, renderAside, setView } from './render.js';

const svg = (d) => `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${d}</svg>`;
const I_GRIP = svg('<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>');
const I_EDIT = svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>');
const I_TRASH = svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>');
const I_PLUS = svg('<path d="M5 12h14"/><path d="M12 5v14"/>');

const TABS = [['notes', 'Notas'], ['tags', 'Etiquetas'], ['marks', 'Resaltados']];
const ui = {
  tab: 'notes', cat: '', tag: '', color: '',
  editing: null, picking: null, delNote: null, delCat: false, newCat: false, delHl: null,
};
let sortable = null;
let SortableCls = null;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const root = () => $('notebook');
const verseText = (key) => {
  const [b, c, v] = key.split('.').map(Number);
  return store.bible[b].chapters[c - 1][v - 1];
};
const markKeys = () => sortKeys(Object.keys(store.hl).filter((k) => validKey(k) && COLORS.includes(store.hl[k])));
const tagNames = () => Object.keys(tagCounts()).sort((a, b) => a.localeCompare(b, 'es'));

/* ---------- Pintar: pestañas ---------- */
function tabsHTML() {
  const count = { notes: noteCounts().all, tags: tagNames().length, marks: markKeys().length };
  return TABS.map(([id, label]) =>
    `<button type="button" role="tab" id="nbtab-${id}" data-nact="tab" data-tab="${id}" aria-selected="${ui.tab === id}" aria-controls="nbBody" tabindex="${ui.tab === id ? 0 : -1}">${label}<small>${count[id]}</small></button>`).join('');
}

/* ---------- Notas ---------- */
function notesHeadHTML() {
  const n = noteCounts();
  if (!n.all) return '';
  const chip = (cat, label, count) =>
    `<button type="button" data-nact="filter" data-cat="${esc(cat)}" aria-pressed="${ui.cat === cat}">${esc(label)}<small>${count}</small></button>`;
  const chips = chip('', 'Todas', n.all) + chip(NONE, 'Sin categoría', n.none) +
    store.cats.map((c) => chip(c, c, n.byCat[c] || 0)).join('') +
    '<button type="button" data-nact="newcat" class="addcat">+ Categoría</button>';
  const newForm = ui.newCat
    ? '<form class="nv-inline" data-form="newcat"><label class="sr" for="nbNewCat">Nombre de la categoría</label>' +
      '<input id="nbNewCat" type="text" maxlength="30" autocomplete="off" placeholder="Nombre de la categoría">' +
      '<button class="btn primary" type="submit">Crear</button><button class="btn ghost" type="button" data-nact="newcat">Cancelar</button></form>'
    : '';
  let delBar = '';
  if (ui.cat && ui.cat !== NONE) {
    const k = n.byCat[ui.cat] || 0;
    delBar = `<div><button type="button" class="btn danger${ui.delCat ? ' on' : ''}" data-nact="delcat">` +
      `${ui.delCat ? `Confirmar: quitar la categoría (${plural(k, 'nota', 'notas')} quedan sin categoría)` : `Eliminar categoría «${esc(ui.cat)}»`}</button></div>`;
  }
  return `<div class="tagcloud nb-filters" role="group" aria-label="Filtrar notas por categoría">${chips}</div>${newForm}${delBar}`;
}

function pickerHTML(key) {
  const cur = store.noteCat[key] || '';
  const opts = [`<button type="button" data-nact="setcat" data-cat="" aria-pressed="${cur === ''}">Sin categoría</button>`]
    .concat(store.cats.map((c) => `<button type="button" data-nact="setcat" data-cat="${esc(c)}" aria-pressed="${cur === c}">${esc(c)}</button>`));
  return `<div class="npicker"><div class="tagcloud" role="group" aria-label="Categoría de la nota">${opts.join('')}</div>` +
    '<form class="nv-inline" data-form="assigncat"><label class="sr" for="nbPickNew">Nueva categoría</label>' +
    '<input id="nbPickNew" type="text" maxlength="30" autocomplete="off" placeholder="Nueva categoría">' +
    '<button class="btn" type="submit">Crear y asignar</button></form></div>';
}

function noteItemHTML(key) {
  const ref = refOf(key);
  const note = store.notes[key];
  const cat = store.noteCat[key];
  const editing = ui.editing === key;
  const right = editing
    ? `<form class="nedit" data-form="note"><label class="sr" for="ne-${key}">Nota de ${esc(ref)}</label>` +
      `<textarea id="ne-${key}" class="noteinput" rows="5" maxlength="2000">${esc(note)}</textarea>` +
      '<div class="row"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" data-nact="cancel">Cancelar</button></div></form>'
    : `<p class="ntext">${esc(note)}</p>`;
  return `<li class="nitem" data-key="${key}">` +
    `<button type="button" class="drag" data-nact="drag" aria-label="Mover la nota de ${esc(ref)}. Con el teclado, flecha arriba o abajo." title="Arrastrar para ordenar">${I_GRIP}</button>` +
    '<div class="ncols">' +
      `<div class="ncol"><button type="button" class="nref" data-nact="goto" title="Ir al versículo">${esc(ref)}</button><p class="nverse">${esc(verseText(key))}</p></div>` +
      `<div class="ncol">${right}</div>` +
    '</div>' +
    '<div class="nbtns">' +
      `<button type="button" class="ncat${cat ? ' has' : ''}" data-nact="cat" aria-expanded="${ui.picking === key}" aria-label="${cat ? `Categoría: ${esc(cat)}. Cambiar` : 'Asignar una categoría'}">${cat ? esc(cat) : `${I_PLUS}<span>Categoría</span>`}</button>` +
      `<button type="button" class="icon-btn" data-nact="edit" aria-label="Editar la nota de ${esc(ref)}" title="Editar">${I_EDIT}</button>` +
      (ui.delNote === key
        ? '<button type="button" class="btn danger on" data-nact="del">Confirmar: borrar</button>'
        : `<button type="button" class="icon-btn" data-nact="del" aria-label="Borrar la nota de ${esc(ref)}" title="Borrar">${I_TRASH}</button>`) +
    '</div>' +
    (ui.picking === key ? pickerHTML(key) : '') +
    '</li>';
}

function notesBodyHTML() {
  const keys = notesFor(ui.cat);
  if (!noteCounts().all) return '<p class="hint nb-empty">Aún no tienes notas. Toca el icono de nota en cualquier versículo para escribir la primera.</p>';
  if (!keys.length) return '<p class="hint nb-empty">No hay notas en esta categoría. Usa «Categoría» en una nota para asignarla.</p>';
  return `<ol id="nvList" class="nv-list">${keys.map(noteItemHTML).join('')}</ol>`;
}

/* ---------- Etiquetas ---------- */
function tagsHeadHTML() {
  const counts = tagCounts();
  const names = tagNames();
  if (!names.length) return '';
  const chip = (tag, label, n) => `<button type="button" data-nact="tagfilter" data-tag="${esc(tag)}" aria-pressed="${ui.tag === tag}">${esc(label)}<small>${n}</small></button>`;
  const total = Object.keys(store.tags).length;
  return `<div class="tagcloud nb-filters" role="group" aria-label="Filtrar por etiqueta">${chip('', 'Todas', total)}${names.map((t) => chip(t, t, counts[t])).join('')}</div>` +
    '<div><button type="button" class="btn ghost" data-nact="managetags">Administrar etiquetas</button></div>';
}

function verseCardHTML(key, extra = '') {
  const note = store.notes[key];
  return `<li class="nb-card" data-key="${key}">` +
    `<button type="button" class="nref" data-nact="goto" title="Ir al versículo">${esc(refOf(key))}</button>` +
    `<p class="nverse">${esc(verseText(key))}</p>` +
    (note ? `<p class="ntext nb-notepreview"><strong>Nota:</strong> ${esc(note)}</p>` : '') + extra + '</li>';
}

function tagsBodyHTML() {
  const names = tagNames();
  if (!names.length) return '<p class="hint nb-empty">Aún no tienes etiquetas. Usa el icono de etiqueta en cualquier versículo para crear la primera.</p>';
  const shown = ui.tag ? names.filter((t) => t === ui.tag) : names;
  return shown.map((t) => {
    const keys = sortKeys(Object.keys(store.tags).filter((k) => validKey(k) && store.tags[k].includes(t)));
    return `<details class="nb-group"${ui.tag ? ' open' : ''}><summary><span class="nb-tagname">${esc(t)}</span><small>${plural(keys.length, 'versículo', 'versículos')}</small></summary>` +
      `<ul class="nb-grid">${keys.map((k) => verseCardHTML(k)).join('')}</ul></details>`;
  }).join('');
}

/* ---------- Resaltados ---------- */
function marksHeadHTML() {
  const keys = markKeys();
  if (!keys.length) return '';
  const by = (c) => keys.filter((k) => store.hl[k] === c).length;
  const chip = (c, label, n) => `<button type="button" data-nact="colorfilter" data-color="${c}" aria-pressed="${ui.color === c}">` +
    (c ? `<span class="swatch" style="background:var(--hl-${c})" aria-hidden="true"></span>` : '') + `${esc(label)}<small>${n}</small></button>`;
  return `<div class="tagcloud nb-filters" role="group" aria-label="Filtrar por color">${chip('', 'Todos', keys.length)}${COLORS.map((c) => chip(c, COLOR_NAMES[c], by(c))).join('')}</div>`;
}

function marksBodyHTML() {
  const all = markKeys();
  if (!all.length) return '<p class="hint nb-empty">Aún no tienes textos resaltados. Selecciona un versículo y elige un color para resaltarlo.</p>';
  const keys = ui.color ? all.filter((k) => store.hl[k] === ui.color) : all;
  if (!keys.length) return '<p class="hint nb-empty">No hay resaltados de este color.</p>';
  return `<ul class="nb-grid">${keys.map((k) => {
    const c = store.hl[k];
    const del = ui.delHl === k
      ? '<button type="button" class="btn danger on" data-nact="delhl">Confirmar: quitar</button>'
      : '<button type="button" class="btn ghost" data-nact="delhl">Quitar resaltado</button>';
    const card = verseCardHTML(k, `<div class="nbtns"><span class="nb-colorname">${esc(COLOR_NAMES[c])}</span>` +
      `<button type="button" class="btn" data-nact="goto">Ir al pasaje</button>${del}</div>`);
    return card.replace('class="nb-card"', `class="nb-card hl-${c}" style="--card-hl: var(--hl-${c})"`);
  }).join('')}</ul>`;
}

/* ---------- Pintar todo ---------- */
function render() {
  const nb = root();
  nb.querySelector('#nbTabs').innerHTML = tabsHTML();
  $('nbHead').innerHTML = ui.tab === 'notes' ? notesHeadHTML() : ui.tab === 'tags' ? tagsHeadHTML() : marksHeadHTML();
  const body = $('nbBody');
  body.setAttribute('aria-labelledby', `nbtab-${ui.tab}`);
  body.innerHTML = ui.tab === 'notes' ? notesBodyHTML() : ui.tab === 'tags' ? tagsBodyHTML() : marksBodyHTML();
  $('nbExport').disabled = !hasUserData();
  mountSortable();
}

function mountSortable() {
  if (sortable) { sortable.destroy(); sortable = null; }
  const list = $('nvList');
  if (!list || ui.tab !== 'notes') return;
  if (!SortableCls) {
    import('sortablejs').then((m) => { SortableCls = m.default; if (!root().hidden) mountSortable(); }).catch(() => {});
    return;
  }
  sortable = SortableCls.create(list, {
    handle: '.drag', animation: 160, ghostClass: 'nv-ghost', chosenClass: 'nv-chosen', dragClass: 'nv-drag',
    onEnd: () => reorderNotes([...list.querySelectorAll('.nitem')].map((li) => li.dataset.key)),
  });
}

/* ---------- Abrir y cerrar ---------- */
export function openNotebook(tab = ui.tab) {
  if (!store.bible) return;
  Object.assign(ui, { tab, editing: null, picking: null, delNote: null, delCat: false, newCat: false, delHl: null });
  if (ui.cat && ui.cat !== NONE && !store.cats.includes(ui.cat)) ui.cat = '';
  if (ui.tag && !tagCounts()[ui.tag]) ui.tag = '';
  setView('notebook');
  render();
  window.scrollTo({ top: 0 });
  $('nbTitle').focus({ preventScroll: true });
}

/** Esc: primero cancela lo que se esté editando; si no hay nada abierto, vuelve a la lectura. */
export function escapeNotebook() {
  if (ui.editing || ui.picking || ui.newCat) {
    Object.assign(ui, { editing: null, picking: null, newCat: false });
    render();
    $('nbTitle').focus({ preventScroll: true });
    return;
  }
  closeNotebook();
}

export function closeNotebook() {
  setView('read');
  window.scrollTo({ top: 0 });
}

const focusSoon = (fn) => setTimeout(() => { const el = fn(); if (el) el.focus(); }, 0);
const resetLater = (flag, test, fn) => setTimeout(() => { if (test() && !root().hidden) { fn(); render(); } }, 4000);

/* ---------- Eventos ---------- */
export function initNotebook() {
  const nb = root();
  // Si cambian los datos desde fuera (administrador de etiquetas, importar respaldo), repinta
  document.addEventListener('datachange', () => { if (!nb.hidden) render(); });

  nb.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nact]');
    if (!btn) return;
    const card = btn.closest('[data-key]');
    const key = card && card.dataset.key;

    switch (btn.dataset.nact) {
      case 'back': closeNotebook(); break;
      case 'export':
        if (!hasUserData()) { toast('Todavía no tienes nada que exportar'); break; }
        downloadFile(notesFileName(), buildMarkdown(), 'text/markdown');
        toast(`Descargado: ${notesFileName()}`);
        break;
      case 'tab':
        ui.tab = btn.dataset.tab;
        Object.assign(ui, { editing: null, picking: null, delNote: null, delCat: false, newCat: false, delHl: null });
        render();
        break;
      case 'goto': {
        const [b, c, v] = key.split('.').map(Number);
        goto(b, c, v);
        break;
      }
      case 'managetags': document.dispatchEvent(new Event('manage-tags')); break;
      case 'tagfilter': ui.tag = btn.dataset.tag; render(); break;
      case 'colorfilter': ui.color = btn.dataset.color; ui.delHl = null; render(); break;
      case 'delhl':
        if (ui.delHl !== key) {
          ui.delHl = key;
          render();
          resetLater('delHl', () => ui.delHl === key, () => { ui.delHl = null; });
          break;
        }
        ui.delHl = null;
        setHighlight(key, '');
        updateVerse(key);
        render();
        toast('Resaltado quitado');
        break;

      /* Notas */
      case 'filter': ui.cat = btn.dataset.cat; ui.delCat = false; ui.picking = null; render(); break;
      case 'newcat':
        ui.newCat = !ui.newCat;
        render();
        if (ui.newCat) focusSoon(() => $('nbNewCat'));
        break;
      case 'delcat': {
        const name = ui.cat;
        if (!ui.delCat) {
          ui.delCat = true;
          render();
          resetLater('delCat', () => ui.delCat && ui.cat === name, () => { ui.delCat = false; });
          break;
        }
        const n = deleteCategory(name);
        ui.cat = '';
        ui.delCat = false;
        render();
        toast(`Categoría «${name}» borrada (${plural(n, 'nota', 'notas')} sin categoría)`);
        break;
      }
      case 'edit':
        ui.editing = ui.editing === key ? null : key;
        ui.delNote = null;
        render();
        if (ui.editing) focusSoon(() => document.getElementById('ne-' + key));
        break;
      case 'cancel': ui.editing = null; render(); break;
      case 'del':
        if (ui.delNote !== key) {
          ui.delNote = key;
          render();
          resetLater('delNote', () => ui.delNote === key, () => { ui.delNote = null; });
          break;
        }
        ui.delNote = null;
        setNote(key, '');
        updateVerse(key);
        renderAside();
        render();
        toast('Nota borrada');
        break;
      case 'cat':
        ui.picking = ui.picking === key ? null : key;
        render();
        if (ui.picking) focusSoon(() => $('nbPickNew'));
        break;
      case 'setcat':
        setNoteCategory(key, btn.dataset.cat);
        ui.picking = null;
        render();
        break;
    }
  });

  nb.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    const li = form.closest('.nitem');
    const key = li && li.dataset.key;

    if (kind === 'newcat') {
      const name = addCategory(form.querySelector('input').value);
      if (!name) { toast('Escribe un nombre para la categoría'); return; }
      ui.newCat = false;
      ui.cat = name;
      render();
      toast(`Categoría «${name}» creada`);
    } else if (kind === 'assigncat') {
      const name = addCategory(form.querySelector('input').value);
      if (!name) { toast('Escribe un nombre para la categoría'); return; }
      setNoteCategory(key, name);
      ui.picking = null;
      render();
      toast(`Nota en «${name}»`);
    } else if (kind === 'note') {
      const saved = setNote(key, form.querySelector('textarea').value);
      ui.editing = null;
      updateVerse(key);
      renderAside();
      render();
      toast(saved ? 'Nota guardada' : 'Nota borrada');
    }
  });

  nb.addEventListener('keydown', (e) => {
    // Pestañas: flechas izquierda y derecha, Inicio y Fin
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const ids = TABS.map((t) => t[0]);
      let i = ids.indexOf(tab.dataset.tab);
      i = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
      ui.tab = ids[i];
      render();
      focusSoon(() => $('nbtab-' + ids[i]));
      return;
    }
    // Flecha arriba o abajo sobre el asa mueve la nota (alternativa al arrastre)
    const handle = e.target.closest && e.target.closest('.drag');
    if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const key = handle.closest('.nitem').dataset.key;
    if (moveNote(key, e.key === 'ArrowUp' ? -1 : 1, ui.cat)) {
      render();
      focusSoon(() => nb.querySelector(`.nitem[data-key="${key}"] .drag`));
    }
  });
}
