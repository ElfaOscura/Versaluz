// Ventana "Lista de notas": todas las notas con su versículo, categorías, filtro y orden por arrastre.
import { $, esc, toast } from './util.js';
import { store } from './store.js';
import { refOf } from './bible.js';
import { setNote } from './study.js';
import {
  NONE, notesFor, noteCounts, reorderNotes, moveNote, addCategory, setNoteCategory, deleteCategory,
} from './notes.js';
import { goto, updateVerse, renderAside } from './render.js';

const svg = (d) => `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${d}</svg>`;
const I_GRIP = svg('<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>');
const I_EDIT = svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>');
const I_TRASH = svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>');
const I_PLUS = svg('<path d="M5 12h14"/><path d="M12 5v14"/>');
const I_X = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

const ui = { filter: '', editing: null, picking: null, delNote: null, delCat: false, newCat: false };
let sortable = null;
let SortableCls = null;

const dlg = () => $('notesView');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const verseText = (key) => {
  const [b, c, v] = key.split('.').map(Number);
  return store.bible[b].chapters[c - 1][v - 1];
};

/* ---------- Pintar ---------- */
function headHTML() {
  const n = noteCounts();
  const chip = (cat, label, count) =>
    `<button type="button" data-nact="filter" data-cat="${esc(cat)}" aria-pressed="${ui.filter === cat}">${esc(label)}<small>${count}</small></button>`;
  const chips = chip('', 'Todas', n.all) + chip(NONE, 'Sin categoría', n.none) +
    store.cats.map((c) => chip(c, c, n.byCat[c] || 0)).join('') +
    '<button type="button" data-nact="newcat" class="addcat">+ Categoría</button>';

  const newForm = ui.newCat
    ? '<form class="nv-inline" data-form="newcat"><label class="sr" for="nvNewCat">Nombre de la categoría</label>' +
      '<input id="nvNewCat" type="text" maxlength="30" autocomplete="off" placeholder="Nombre de la categoría">' +
      '<button class="btn primary" type="submit">Crear</button><button class="btn ghost" type="button" data-nact="newcat">Cancelar</button></form>'
    : '';

  let delBar = '';
  if (ui.filter && ui.filter !== NONE) {
    const k = n.byCat[ui.filter] || 0;
    delBar = `<div><button type="button" class="btn danger${ui.delCat ? ' on' : ''}" data-nact="delcat">` +
      `${ui.delCat ? `Confirmar: quitar la categoría (${plural(k, 'nota', 'notas')} quedan sin categoría)` : `Eliminar categoría «${esc(ui.filter)}»`}</button></div>`;
  }

  return `<div class="nv-title"><h2 id="nvTitle">Lista de notas</h2><span class="muted">${plural(n.all, 'nota', 'notas')}</span>` +
    `<button type="button" class="icon-btn nv-close" data-nact="close" aria-label="Cerrar la lista de notas" title="Cerrar">${I_X}</button></div>` +
    (n.all ? `<div class="tagcloud nv-filters" role="group" aria-label="Filtrar por categoría">${chips}</div>${newForm}${delBar}` : '');
}

function pickerHTML(key) {
  const cur = store.noteCat[key] || '';
  const opts = [`<button type="button" data-nact="setcat" data-cat="" aria-pressed="${cur === ''}">Sin categoría</button>`]
    .concat(store.cats.map((c) => `<button type="button" data-nact="setcat" data-cat="${esc(c)}" aria-pressed="${cur === c}">${esc(c)}</button>`));
  return `<div class="npicker"><div class="tagcloud" role="group" aria-label="Categoría de la nota">${opts.join('')}</div>` +
    '<form class="nv-inline" data-form="assigncat"><label class="sr" for="nvPickNew">Nueva categoría</label>' +
    '<input id="nvPickNew" type="text" maxlength="30" autocomplete="off" placeholder="Nueva categoría">' +
    '<button class="btn" type="submit">Crear y asignar</button></form></div>';
}

function itemHTML(key) {
  const ref = refOf(key);
  const note = store.notes[key];
  const cat = store.noteCat[key];
  const editing = ui.editing === key;
  const delOn = ui.delNote === key;
  const right = editing
    ? `<form class="nedit" data-form="note"><label class="sr" for="ne-${key}">Nota de ${esc(ref)}</label>` +
      `<textarea id="ne-${key}" class="noteinput" rows="4" maxlength="2000">${esc(note)}</textarea>` +
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
      (delOn
        ? '<button type="button" class="btn danger on" data-nact="del">Confirmar: borrar</button>'
        : `<button type="button" class="icon-btn" data-nact="del" aria-label="Borrar la nota de ${esc(ref)}" title="Borrar">${I_TRASH}</button>`) +
    '</div>' +
    (ui.picking === key ? pickerHTML(key) : '') +
    '</li>';
}

function listHTML() {
  const keys = notesFor(ui.filter);
  if (!Object.keys(store.notes).length) {
    return '<p class="hint nv-empty">Aún no tienes notas. Toca el icono de nota en cualquier versículo para escribir la primera.</p>';
  }
  if (!keys.length) return '<p class="hint nv-empty">No hay notas en esta categoría. Usa «Categoría» en una nota para asignarla.</p>';
  return `<ol id="nvList" class="nv-list">${keys.map(itemHTML).join('')}</ol>`;
}

function render() {
  $('nvHead').innerHTML = headHTML();
  $('nvScroll').innerHTML = listHTML();
  mountSortable();
}

function mountSortable() {
  if (sortable) { sortable.destroy(); sortable = null; }
  const list = $('nvList');
  if (!list) return;
  if (!SortableCls) {
    import('sortablejs').then((m) => { SortableCls = m.default; if (dlg().open) mountSortable(); }).catch(() => {});
    return;
  }
  sortable = SortableCls.create(list, {
    handle: '.drag', animation: 160, ghostClass: 'nv-ghost', chosenClass: 'nv-chosen', dragClass: 'nv-drag',
    onEnd: () => {
      const keys = [...list.querySelectorAll('.nitem')].map((li) => li.dataset.key);
      reorderNotes(keys);
    },
  });
}

/* ---------- Abrir y cerrar ---------- */
export function openNotes() {
  if (!store.bible) return;
  Object.assign(ui, { editing: null, picking: null, delNote: null, delCat: false, newCat: false });
  if (ui.filter && ui.filter !== NONE && !store.cats.includes(ui.filter)) ui.filter = '';
  render();
  if (!dlg().open) dlg().showModal();
  dlg().appendChild($('toast')); // el aviso debe verse por encima del cuadro (que está en la capa superior)
  dlg().focus();
  document.documentElement.classList.add('modal-open');
  $('nvScroll').scrollTop = 0;
}

const closeNotes = () => { if (dlg().open) dlg().close(); };

const focusSoon = (fn) => setTimeout(() => { const el = fn(); if (el) el.focus(); }, 0);

/* ---------- Eventos ---------- */
export function initNotesView() {
  const d = dlg();

  d.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    document.body.appendChild($('toast'));
    if (sortable) { sortable.destroy(); sortable = null; }
  });
  d.addEventListener('click', (e) => {
    if (e.target === d) { closeNotes(); return; } // clic en el fondo
    const btn = e.target.closest('[data-nact]');
    if (!btn) return;
    const li = btn.closest('.nitem');
    const key = li && li.dataset.key;

    switch (btn.dataset.nact) {
      case 'close': closeNotes(); break;
      case 'filter':
        ui.filter = btn.dataset.cat;
        ui.delCat = false;
        ui.picking = null;
        render();
        break;
      case 'newcat':
        ui.newCat = !ui.newCat;
        $('nvHead').innerHTML = headHTML();
        if (ui.newCat) focusSoon(() => $('nvNewCat'));
        break;
      case 'delcat': {
        const name = ui.filter;
        if (!ui.delCat) {
          ui.delCat = true;
          $('nvHead').innerHTML = headHTML();
          setTimeout(() => { if (ui.delCat && ui.filter === name) { ui.delCat = false; if (d.open) $('nvHead').innerHTML = headHTML(); } }, 4000);
          break;
        }
        const n = deleteCategory(name);
        ui.filter = '';
        ui.delCat = false;
        render();
        toast(`Categoría «${name}» borrada (${plural(n, 'nota', 'notas')} sin categoría)`);
        break;
      }
      case 'goto': {
        const [b, c, v] = key.split('.').map(Number);
        closeNotes();
        goto(b, c, v);
        break;
      }
      case 'edit':
        ui.editing = ui.editing === key ? null : key;
        ui.delNote = null;
        render();
        if (ui.editing) focusSoon(() => document.getElementById('ne-' + key));
        break;
      case 'cancel':
        ui.editing = null;
        render();
        break;
      case 'del': {
        if (ui.delNote !== key) {
          ui.delNote = key;
          render();
          setTimeout(() => { if (ui.delNote === key) { ui.delNote = null; if (d.open) render(); } }, 4000);
          break;
        }
        ui.delNote = null;
        setNote(key, '');
        updateVerse(key);
        renderAside();
        render();
        toast('Nota borrada');
        break;
      }
      case 'cat':
        ui.picking = ui.picking === key ? null : key;
        render();
        if (ui.picking) focusSoon(() => document.getElementById('nvPickNew'));
        break;
      case 'setcat':
        setNoteCategory(key, btn.dataset.cat);
        ui.picking = null;
        render();
        break;
    }
  });

  d.addEventListener('submit', (e) => {
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
      ui.filter = name;
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

  // Teclado: flecha arriba o abajo sobre el asa mueve la nota (alternativa al arrastre). Ctrl+Enter guarda: lo atiende events.js
  d.addEventListener('keydown', (e) => {
    const handle = e.target.closest && e.target.closest('.drag');
    if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const key = handle.closest('.nitem').dataset.key;
    if (moveNote(key, e.key === 'ArrowUp' ? -1 : 1, ui.filter)) {
      render();
      focusSoon(() => d.querySelector(`.nitem[data-key="${key}"] .drag`));
    }
  });
}
