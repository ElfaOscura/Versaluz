// Respaldo de los datos del usuario: formato, exportación a Markdown, importación y descarga de archivos.
import { store } from './store.js';
import { validKey, refOf } from './bible.js';
import { sortKeys } from './share.js';
import { COLORS, COLOR_NAMES } from './study.js';
import { saveTags, saveNotes, saveHl, saveBms, saveCats, saveNoteOrder, saveNoteCat, backupMeta } from './storage.js';
import { normalizeCat } from './notes.js';

const VERSION = 'RVR1960';
const verseText = (key) => {
  const [b, c, v] = key.split('.').map(Number);
  return store.bible[b].chapters[c - 1][v - 1];
};

/* ---------- Respaldo (JSON) ---------- */
export function backupObject() {
  return {
    version: 4, tags: store.tags, notes: store.notes, highlights: store.hl, bookmarks: store.bms,
    categories: store.cats, noteCategories: store.noteCat, noteOrder: store.noteOrder,
  };
}
export const backupJson = (pretty = false) => JSON.stringify(backupObject(), null, pretty ? 2 : 0);

export function hasUserData() {
  return Object.keys(store.tags).length + Object.keys(store.notes).length + Object.keys(store.hl).length + store.bms.length + store.cats.length > 0;
}

/** AAAA-MM-DD en la hora local. */
export function stamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/* ---------- Nombres de archivo ---------- */
/** versaluz_2026-11-24.json */
export const backupFileName = (date = new Date()) => `versaluz_${stamp(date)}.json`;
/** Mis Notas-Versaluz-2026-11-24.md */
export const notesFileName = (date = new Date()) => `Mis Notas-Versaluz-${stamp(date)}.md`;

/* ---------- Sumar un respaldo ---------- */
const cloneState = () => JSON.parse(JSON.stringify({
  tags: store.tags, notes: store.notes, hl: store.hl, bms: store.bms,
  cats: store.cats, noteCat: store.noteCat, noteOrder: store.noteOrder,
}));

/** Suma `data` a `t` (los datos de la app, o una copia para la vista previa). Devuelve lo que se agregó, o null si no es un respaldo. */
function mergeInto(t, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const added = { tags: 0, notes: 0, cats: 0, marks: 0, bms: 0 };

  const addCat = (raw) => {
    const name = normalizeCat(raw);
    if (!name) return '';
    const found = t.cats.find((c) => c.localeCompare(name, 'es', { sensitivity: 'base' }) === 0);
    if (found) return found;
    if (t.cats.length >= 40) return '';
    t.cats.push(name);
    added.cats++;
    return name;
  };

  if (data.tags && typeof data.tags === 'object') {
    for (const key of Object.keys(data.tags)) {
      if (!validKey(key) || !Array.isArray(data.tags[key])) continue;
      const current = t.tags[key] || [];
      for (const raw of data.tags[key]) {
        const tag = String(raw).replace(/,/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 40);
        if (tag && !current.includes(tag)) { current.push(tag); added.tags++; }
      }
      if (current.length) t.tags[key] = current;
    }
  }
  if (data.notes && typeof data.notes === 'object') {
    for (const key of Object.keys(data.notes)) {
      const text = String(data.notes[key]).trim().slice(0, 2000);
      if (!validKey(key) || !text || t.notes[key]) continue;
      t.notes[key] = text;
      added.notes++;
    }
  }
  if (data.highlights && typeof data.highlights === 'object') {
    for (const key of Object.keys(data.highlights)) {
      if (!validKey(key) || !COLORS.includes(data.highlights[key]) || t.hl[key]) continue;
      t.hl[key] = data.highlights[key];
      added.marks++;
    }
  }
  // Marcalibros: la lista nueva, o el marcalibro único de respaldos de versiones anteriores
  const incoming = Array.isArray(data.bookmarks)
    ? data.bookmarks
    : (data.bookmark && data.bookmark.key ? [data.bookmark.key] : []);
  for (const raw of incoming) {
    const key = String(raw);
    if (!validKey(key) || t.bms.includes(key)) continue;
    t.bms.push(key);
    added.bms++;
  }
  t.bms.length = Math.min(t.bms.length, 100);

  // Categorías de notas: se crean las que falten y se asignan solo a notas que aún no tienen una
  if (Array.isArray(data.categories)) for (const c of data.categories) addCat(c);
  if (data.noteCategories && typeof data.noteCategories === 'object' && !Array.isArray(data.noteCategories)) {
    for (const key of Object.keys(data.noteCategories)) {
      const name = addCat(data.noteCategories[key]);
      if (!name || !validKey(key) || !t.notes[key] || t.noteCat[key]) continue;
      t.noteCat[key] = name;
    }
  }
  if (Array.isArray(data.noteOrder)) {
    for (const key of data.noteOrder) {
      if (typeof key === 'string' && validKey(key) && t.notes[key] && !t.noteOrder.includes(key)) t.noteOrder.push(key);
    }
  }
  return added;
}

/** Qué se sumaría, sin tocar nada. Null si no es un respaldo. */
export const previewBackup = (data) => mergeInto(cloneState(), data);

/**
 * Suma un respaldo a los datos actuales. No pisa las notas ni los resaltados que ya tienes.
 * Devuelve { tags, notes, cats, marks, bms } con lo que se agregó, o null si no es un respaldo.
 */
export function mergeBackup(data) {
  const added = mergeInto(store, data);
  if (!added) return null;
  if (added.tags + added.notes + added.cats + added.marks + added.bms > 0) {
    saveTags(); saveNotes(); saveHl(); saveBms(); saveCats(); saveNoteCat(); saveNoteOrder();
  }
  return added;
}

/** «12 notas, 2 categorías y 1 marcalibro» (o que no hay nada nuevo). */
export function describeAdded(a) {
  const n = (v, one, many) => (v ? `${v} ${v === 1 ? one : many}` : '');
  const parts = [
    n(a.notes, 'nota', 'notas'), n(a.cats, 'categoría', 'categorías'), n(a.tags, 'etiqueta', 'etiquetas'),
    n(a.marks, 'resaltado', 'resaltados'), n(a.bms, 'marcalibro', 'marcalibros'),
  ].filter(Boolean);
  if (!parts.length) return '';
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

/* ---------- Markdown ---------- */
function quoteHTML(key) {
  const lines = [`> “${verseText(key)}” — ${refOf(key)} (${VERSION})`];
  const note = store.notes[key];
  if (note) {
    lines.push('>');
    note.split('\n').forEach((line, i) => lines.push(`> ${i === 0 ? '**Nota:** ' : ''}${line}`));
  }
  if (note && store.noteCat[key]) lines.push('>', `> *Categoría: ${store.noteCat[key]}*`);
  if (COLOR_NAMES[store.hl[key]]) lines.push('>', `> *Resaltado: ${COLOR_NAMES[store.hl[key]].toLowerCase()}*`);
  return lines.join('\n');
}

/** Tus versículos como un documento Markdown: marcalibros, luego por etiqueta, luego lo que solo tiene nota o resaltado. */
export function buildMarkdown(date = new Date()) {
  const out = [`# Mis versículos — Versaluz`, '', `Exportado el ${stamp(date)}. Texto: ${VERSION}.`, ''];

  const bms = store.bms.filter(validKey);
  if (bms.length) {
    out.push('## Marcalibros', '');
    for (const key of bms) {
      const t = verseText(key);
      out.push(`- **${refOf(key)}** — ${t.length > 90 ? t.slice(0, 90) + '…' : t}`);
    }
    out.push('');
  }

  const byTag = new Map();
  for (const key of Object.keys(store.tags)) {
    if (!validKey(key)) continue;
    for (const t of store.tags[key]) {
      if (!byTag.has(t)) byTag.set(t, []);
      byTag.get(t).push(key);
    }
  }
  if (byTag.size) {
    out.push('## Etiquetas', '');
    for (const t of [...byTag.keys()].sort((a, b) => a.localeCompare(b, 'es'))) {
      const keys = sortKeys(byTag.get(t));
      out.push(`### ${t} (${keys.length})`, '');
      for (const key of keys) out.push(quoteHTML(key), '');
    }
  }

  const loose = new Set([...Object.keys(store.notes), ...Object.keys(store.hl)]
    .filter((k) => validKey(k) && !(store.tags[k] && store.tags[k].length)));
  if (loose.size) {
    out.push('## Notas y resaltados sin etiqueta', '');
    for (const key of sortKeys([...loose])) out.push(quoteHTML(key), '');
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/* ---------- Descarga ---------- */
export function downloadFile(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Estado del respaldo: { last, changed, pending, never } (fechas en ms). pending = hay datos sin respaldar. */
export function backupState() {
  const { last, changed } = backupMeta();
  const data = hasUserData();
  return { last, changed, never: !last, pending: data && (!last || changed > last), hasData: data };
}
