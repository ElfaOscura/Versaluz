// Notas, resaltados, selección, marcalibros y capítulos recientes.
import { store, state } from './store.js';
import { saveNotes, saveHl, saveBms, saveRecent } from './storage.js';
import { forgetNote } from './notes.js';
import { addTagsData } from './tags.js';

const MAX_BMS = 100;
const MAX_RECENT = 8;

/* ---------- Marcalibros (varios, el más reciente primero) ---------- */
export const isBookmarked = (key) => store.bms.includes(key);

/** Pone o quita un marcalibro. Devuelve true si quedó puesto. */
export function toggleBookmark(key) {
  const i = store.bms.indexOf(key);
  if (i >= 0) {
    store.bms.splice(i, 1);
    saveBms();
    return false;
  }
  store.bms.unshift(key);
  if (store.bms.length > MAX_BMS) store.bms.length = MAX_BMS;
  saveBms();
  return true;
}

export function removeBookmark(key) {
  const i = store.bms.indexOf(key);
  if (i < 0) return;
  store.bms.splice(i, 1);
  saveBms();
}

/* ---------- Capítulos recientes ---------- */
/** Anota el capítulo como el último leído. Devuelve true si la lista cambió. */
export function pushRecent(b, c) {
  const first = store.recent[0];
  if (first && first.b === b && first.c === c) return false;
  store.recent = [{ b, c }, ...store.recent.filter((r) => !(r.b === b && r.c === c))].slice(0, MAX_RECENT);
  saveRecent();
  return true;
}

export const COLORS = ['yellow', 'green', 'rose', 'blue'];
export const COLOR_NAMES = { yellow: 'Amarillo', green: 'Verde', rose: 'Rosa', blue: 'Azul' };

/** Guarda la nota; un texto vacío la borra. Devuelve true si quedó una nota. */
export function setNote(key, text) {
  const t = String(text).trim().slice(0, 2000);
  if (t) store.notes[key] = t;
  else { delete store.notes[key]; forgetNote(key); }
  saveNotes();
  return !!t;
}

/** Pone el color de resaltado; un color vacío o desconocido lo quita. */
export function setHighlight(key, color) {
  if (COLORS.includes(color)) store.hl[key] = color;
  else delete store.hl[key];
  saveHl();
}

export function setHighlightMany(keys, color) {
  for (const k of keys) {
    if (COLORS.includes(color)) store.hl[k] = color;
    else delete store.hl[k];
  }
  saveHl();
}

/** Agrega etiquetas a varios versículos. Devuelve cuántas etiquetas nuevas se pusieron en total. */
export function addTagsMany(keys, raw) {
  let added = 0;
  for (const k of keys) added += addTagsData(k, raw);
  return added;
}

/* ---------- Selección ---------- */
/** Alterna la selección de un versículo. Devuelve true si quedó seleccionado. */
export function toggleSelect(key) {
  const i = state.sel.indexOf(key);
  if (i >= 0) state.sel.splice(i, 1);
  else state.sel.push(key);
  return i < 0;
}

/** Vacía la selección y devuelve las claves que había, para repintarlas. */
export function clearSelection() {
  const old = state.sel;
  state.sel = [];
  state.selMode = '';
  return old;
}
