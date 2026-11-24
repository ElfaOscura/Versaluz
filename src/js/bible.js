import { store, state } from './store.js';
import { normStr, range, range0 } from './util.js';
import { matches } from './search.js';

// Orden de búsqueda del texto: primero junto a index.html (carpeta public/), luego el repositorio de origen.
export const SOURCES = [
  'es_rvr1960.json',
  'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/es_rvr1960.json',
];

const FALLBACK_NAMES = ['Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías', 'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses', '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis'];

/** Valida y normaliza el formato de thiagobodruk/bible. Lanza un error si no coincide. */
export function normalizeBible(data) {
  if (!Array.isArray(data) || !data.length) throw new Error('formato');
  return data.map((bk, i) => {
    if (!bk || !Array.isArray(bk.chapters)) throw new Error('formato');
    return {
      name: bk.name || (data.length === 66 ? FALLBACK_NAMES[i] : `Libro ${i + 1}`),
      abbrev: bk.abbrev || '',
      chapters: bk.chapters.map((ch) => {
        if (!Array.isArray(ch)) throw new Error('formato');
        return ch.map(String);
      }),
    };
  });
}

export function parseBible(text) {
  return normalizeBible(JSON.parse(text.replace(/^﻿/, '')));
}

export async function fetchBible(urls = SOURCES) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      return parseBible(await res.text());
    } catch { /* prueba la siguiente fuente */ }
  }
  throw new Error('sin fuente');
}

/** Guarda la Biblia en el store y prepara los índices de búsqueda. */
export function indexBible(b) {
  store.bible = b;
  store.norm = b.map((bk) => bk.chapters.map((ch) => ch.map(normStr)));
  store.bookNorm = b.map((bk) => normStr(bk.name).replace(/\s+/g, ''));
  store.abbr = b.map((bk) => bk.abbrev.toLowerCase());
}

export function refOf(key) {
  const [b, c, v] = key.split('.').map(Number);
  return `${store.bible[b].name} ${c}:${v}`;
}

/* ---------- Referencias: "Juan 3:16", "1 corintios 13", "sal 23" ---------- */
export function findBook(part) {
  const p = part.replace(/\s+/g, '');
  if (!p) return -1;
  let exact = -1;
  let first = -1;
  store.bookNorm.forEach((n, i) => {
    if (n === p || store.abbr[i] === p) { if (exact < 0) exact = i; }
    else if (n.startsWith(p) && first < 0) first = i;
  });
  return exact >= 0 ? exact : first;
}

/** Comprueba que una clave "libro.capítulo.versículo" exista en el archivo cargado. */
export function validKey(k) {
  if (typeof k !== 'string' || !/^\d+\.\d+\.\d+$/.test(k) || !store.bible) return false;
  const [b, c, v] = k.split('.').map(Number);
  const chapter = store.bible[b] && store.bible[b].chapters[c - 1];
  return !!chapter && v >= 1 && v <= chapter.length;
}

/**
 * Entiende "Juan 3", "Juan 3:16", "juan 3 16", "1 corintios 13:4-7".
 * Devuelve { b, c, v, v2 }: v es 0 si solo se pidió el capítulo; v2 es el final del rango (igual a v si no hay rango).
 */
export function tryRef(q) {
  const s = normStr(q.trim());
  const m = s.match(/^(.+?)\s+(\d+)(?:\s*[:.,]\s*|\s+)?(\d+)?(?:\s*[-–—]\s*(\d+))?$/);
  if (!m) return null;
  const b = findBook(m[1]);
  if (b < 0) return null;
  const c = +m[2];
  const bk = store.bible[b];
  if (c < 1 || c > bk.chapters.length) return null;
  const v = m[3] ? +m[3] : 0;
  if (m[4] && !v) return null;
  const v2 = m[4] ? +m[4] : v;
  const max = bk.chapters[c - 1].length;
  if (v && (v > max || v2 < v || v2 > max)) return null;
  return { b, c, v, v2 };
}

/* ---------- Testamentos ---------- */
export const NT_START = 39; // en las 66 biblias protestantes, el Nuevo Testamento empieza en Mateo (libro 39)
export const hasTestaments = () => !!store.bible && store.bible.length === 66;

/** ¿El libro pertenece al testamento 't' ('at', 'nt' o '' para ambos)? */
export function inTestament(b, t) {
  if (!t || !hasTestaments()) return true;
  return t === 'at' ? b < NT_START : b >= NT_START;
}

/** Cuenta versículos por libro, en el orden en que aparecen: [[libro, cantidad], ...]. */
export function countByBook(keys) {
  const counts = new Map();
  for (const k of keys) {
    const b = +k.split('.')[0];
    counts.set(b, (counts.get(b) || 0) + 1);
  }
  return [...counts.entries()];
}

/* ---------- Qué mostrar según los filtros ---------- */
export function collect() {
  const { groups } = state;
  const items = [];
  const searching = groups.length > 0 || !!state.tag;

  if (!searching) {
    if (state.b < 0) return { mode: 'welcome', items };
    const bk = store.bible[state.b];
    const chapters = state.c > 0 ? [state.c] : range(bk.chapters.length);
    for (const c of chapters) {
      const n = bk.chapters[c - 1].length;
      for (let v = 1; v <= n; v++) {
        if (state.v && v !== state.v) continue;
        items.push(`${state.b}.${c}.${v}`);
      }
    }
    return { mode: 'read', items };
  }

  const books = state.b >= 0 ? [state.b] : range0(store.bible.length).filter((b) => inTestament(b, state.t));
  for (const b of books) {
    const bk = store.bible[b];
    const chapters = state.c > 0 ? [state.c] : range(bk.chapters.length);
    for (const c of chapters) {
      const n = bk.chapters[c - 1].length;
      for (let v = 1; v <= n; v++) {
        if (state.v && v !== state.v) continue;
        const key = `${b}.${c}.${v}`;
        if (state.tag && !(store.tags[key] || []).includes(state.tag)) continue;
        if (groups.length && !matches(store.norm[b][c - 1][v - 1], groups)) continue;
        items.push(key);
      }
    }
  }
  return { mode: 'results', items };
}
