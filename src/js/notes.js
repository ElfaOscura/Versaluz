// Datos de la lista de notas: orden, categorías y filtro. Sin DOM, para poder probarlo.
import { store } from './store.js';
import { validKey } from './bible.js';
import { sortKeys } from './share.js';
import { saveCats, saveNoteCat, saveNoteOrder } from './storage.js';

export const NONE = '__none'; // filtro "sin categoría"
const MAX_CAT = 30;
const MAX_CATS = 40;

/** Nombre de categoría tal como se guarda: espacios simples, hasta 30 caracteres. */
export const normalizeCat = (s) => String(s).replace(/\s+/g, ' ').trim().slice(0, MAX_CAT);

const sameCat = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0;
const findCat = (name) => store.cats.find((c) => sameCat(c, name));

/** Claves de las notas en el orden de la lista: primero las ordenadas a mano; las demás, por versículo. */
export function orderedNoteKeys() {
  const seen = new Set();
  const out = [];
  for (const k of store.noteOrder) {
    if (store.notes[k] && validKey(k) && !seen.has(k)) { seen.add(k); out.push(k); }
  }
  const rest = Object.keys(store.notes).filter((k) => validKey(k) && !seen.has(k));
  return out.concat(sortKeys(rest));
}

/** Notas visibles según el filtro: '' = todas, NONE = sin categoría, o el nombre de una categoría. */
export function notesFor(filter = '') {
  const keys = orderedNoteKeys();
  if (!filter) return keys;
  if (filter === NONE) return keys.filter((k) => !store.noteCat[k]);
  return keys.filter((k) => store.noteCat[k] === filter);
}

/** Cantidades para los filtros: { all, none, porCategoría: {nombre: n} }. */
export function noteCounts() {
  const keys = orderedNoteKeys();
  const byCat = {};
  for (const c of store.cats) byCat[c] = 0;
  let none = 0;
  for (const k of keys) {
    const c = store.noteCat[k];
    if (c && c in byCat) byCat[c]++;
    else none++;
  }
  return { all: keys.length, none, byCat };
}

/**
 * Guarda el nuevo orden de lo que se ve. Si la lista está filtrada, las notas visibles se reacomodan
 * entre sus mismos lugares y las demás no se mueven.
 */
export function reorderNotes(visibleNewOrder) {
  const full = orderedNoteKeys();
  const visible = new Set(visibleNewOrder);
  const slots = [];
  full.forEach((k, i) => { if (visible.has(k)) slots.push(i); });
  const next = full.slice();
  const incoming = visibleNewOrder.filter((k) => full.includes(k));
  slots.forEach((slot, i) => { next[slot] = incoming[i]; });
  store.noteOrder = next;
  saveNoteOrder();
  return next;
}

/** Mueve una nota una posición dentro de lo visible (-1 arriba, +1 abajo). Devuelve true si se movió. */
export function moveNote(key, delta, filter = '') {
  const vis = notesFor(filter);
  const i = vis.indexOf(key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= vis.length) return false;
  [vis[i], vis[j]] = [vis[j], vis[i]];
  reorderNotes(vis);
  return true;
}

/** Crea la categoría si no existe (sin distinguir mayúsculas). Devuelve el nombre guardado o '' si no es válido. */
export function addCategory(raw) {
  const name = normalizeCat(raw);
  if (!name) return '';
  const found = findCat(name);
  if (found) return found;
  if (store.cats.length >= MAX_CATS) return '';
  store.cats.push(name);
  saveCats();
  return name;
}

/** Asigna una categoría a una nota ('' la deja sin categoría). */
export function setNoteCategory(key, cat) {
  if (!store.notes[key]) return false;
  if (cat) {
    const name = findCat(cat);
    if (!name) return false;
    store.noteCat[key] = name;
  } else {
    delete store.noteCat[key];
  }
  saveNoteCat();
  return true;
}

/** Borra una categoría; sus notas quedan sin categoría. Devuelve cuántas notas la tenían. */
export function deleteCategory(name) {
  store.cats = store.cats.filter((c) => c !== name);
  let n = 0;
  for (const k of Object.keys(store.noteCat)) {
    if (store.noteCat[k] === name) { delete store.noteCat[k]; n++; }
  }
  saveCats();
  saveNoteCat();
  return n;
}

/** Llamar cuando se borra una nota: olvida su categoría y su lugar en la lista. */
export function forgetNote(key) {
  let changed = false;
  if (key in store.noteCat) { delete store.noteCat[key]; saveNoteCat(); changed = true; }
  const i = store.noteOrder.indexOf(key);
  if (i >= 0) { store.noteOrder.splice(i, 1); saveNoteOrder(); changed = true; }
  return changed;
}
