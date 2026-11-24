import { store } from './store.js';
import { saveTags } from './storage.js';

/** { etiqueta: cantidad de versículos } */
export function tagCounts() {
  const counts = {};
  for (const key of Object.keys(store.tags)) {
    for (const t of store.tags[key]) counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

/** Agrega una o varias etiquetas separadas por comas. Devuelve cuántas son nuevas. */
export function addTagsData(key, raw) {
  const list = raw.split(',').map((s) => s.trim().toLowerCase().slice(0, 40)).filter(Boolean);
  if (!list.length) return 0;
  const current = store.tags[key] || [];
  let added = 0;
  for (const t of list) {
    if (!current.includes(t)) { current.push(t); added++; }
  }
  store.tags[key] = current;
  saveTags();
  return added;
}

export function removeTagData(key, tag) {
  const current = (store.tags[key] || []).filter((x) => x !== tag);
  if (current.length) store.tags[key] = current;
  else delete store.tags[key];
  saveTags();
}

/** Deja el nombre como se guarda: minúsculas, sin comas, espacios simples, hasta 40 caracteres. */
export function normalizeTag(s) {
  return String(s).replace(/,/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 40);
}

/**
 * Cambia el nombre de una etiqueta en todos los versículos. Si ya existe una con el nombre nuevo, las dos se unen.
 * Devuelve { ok, changed, merged, count, target }: count es la cantidad de versículos que la tenían.
 */
export function renameTag(from, to) {
  const target = normalizeTag(to);
  if (!target) return { ok: false, changed: false, merged: false, count: 0, target };
  if (target === from) return { ok: true, changed: false, merged: false, count: 0, target };
  const merged = !!tagCounts()[target];
  let count = 0;
  for (const key of Object.keys(store.tags)) {
    const list = store.tags[key];
    const i = list.indexOf(from);
    if (i < 0) continue;
    count++;
    if (list.includes(target)) list.splice(i, 1); // el versículo ya tenía la etiqueta nueva
    else list[i] = target;
  }
  saveTags();
  return { ok: true, changed: true, merged, count, target };
}

/** Quita una etiqueta de todos los versículos. Devuelve cuántos la tenían. */
export function deleteTag(tag) {
  let count = 0;
  for (const key of Object.keys(store.tags)) {
    const list = store.tags[key];
    if (!list.includes(tag)) continue;
    count++;
    const rest = list.filter((x) => x !== tag);
    if (rest.length) store.tags[key] = rest;
    else delete store.tags[key];
  }
  saveTags();
  return count;
}