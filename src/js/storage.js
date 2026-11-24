import { store } from './store.js';

/* ---------- localStorage: datos del usuario ---------- */
const LS_TAGS = 'rvr1960.tags';
const LS_BM = 'rvr1960.bm';       // versión anterior: un solo marcalibro. Solo se lee para migrarlo.
const LS_BMS = 'rvr1960.bms';
const LS_RECENT = 'rvr1960.recent';
const LS_NOTES = 'rvr1960.notes';
const LS_HL = 'rvr1960.hl';
const LS_PREFS = 'rvr1960.prefs';
const LS_CATS = 'rvr1960.cats';
const LS_NOTECAT = 'rvr1960.notecat';
const LS_NOTEORDER = 'rvr1960.noteorder';
const LS_LASTBACKUP = 'rvr1960.lastbackup'; // cuándo se exportó o importó por última vez
const LS_CHANGED = 'rvr1960.changed';       // cuándo cambió por última vez algo que va en el respaldo
const KEY_RE = /^\d+\.\d+\.\d+$/;

function lsGet(k) {
  try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; }
}
function lsSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento bloqueado */ }
}
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Anota que hay datos nuevos (para avisar si falta respaldarlos) y avisa a la pantalla. */
function touch() {
  try { localStorage.setItem(LS_CHANGED, String(Date.now())); } catch { /* almacenamiento bloqueado */ }
  if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event('datachange'));
}
const saveData = (k, v) => { lsSet(k, v); touch(); };

export const saveTags = () => saveData(LS_TAGS, store.tags);
export const saveBms = () => saveData(LS_BMS, store.bms);
export const saveRecent = () => lsSet(LS_RECENT, store.recent);
export const saveNotes = () => saveData(LS_NOTES, store.notes);
export const saveHl = () => saveData(LS_HL, store.hl);
export const saveCats = () => saveData(LS_CATS, store.cats);
export const saveNoteCat = () => saveData(LS_NOTECAT, store.noteCat);
export const saveNoteOrder = () => saveData(LS_NOTEORDER, store.noteOrder);
export const savePrefs = () => lsSet(LS_PREFS, store.prefs);

/** { last, changed }: milisegundos del último respaldo y del último cambio (0 = nunca). */
export function backupMeta() {
  const num = (k) => { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } };
  return { last: num(LS_LASTBACKUP), changed: num(LS_CHANGED) };
}

/** Marca que los datos se acaban de respaldar (exportar o importar). */
export function markBackup() {
  const { changed } = backupMeta();
  try { localStorage.setItem(LS_LASTBACKUP, String(Math.max(Date.now(), changed))); } catch { /* almacenamiento bloqueado */ }
  if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event('datachange'));
}

export function loadUserData() {
  const t = lsGet(LS_TAGS);
  if (isObj(t)) store.tags = t;

  const bms = lsGet(LS_BMS);
  if (Array.isArray(bms)) {
    store.bms = bms.filter((k) => typeof k === 'string' && KEY_RE.test(k));
  } else {
    const legacy = lsGet(LS_BM); // migra el marcalibro único de la versión anterior
    if (legacy && typeof legacy.key === 'string' && KEY_RE.test(legacy.key)) {
      store.bms = [legacy.key];
      saveBms();
    }
  }

  const r = lsGet(LS_RECENT);
  if (Array.isArray(r)) {
    store.recent = r.filter((x) => x && Number.isInteger(x.b) && Number.isInteger(x.c)).slice(0, 8);
  }

  const n = lsGet(LS_NOTES);
  if (isObj(n)) store.notes = n;
  const h = lsGet(LS_HL);
  if (isObj(h)) store.hl = h;

  const cats = lsGet(LS_CATS);
  if (Array.isArray(cats)) store.cats = cats.filter((c) => typeof c === 'string' && c.trim());
  const nc = lsGet(LS_NOTECAT);
  if (isObj(nc)) store.noteCat = nc;
  const no = lsGet(LS_NOTEORDER);
  if (Array.isArray(no)) store.noteOrder = no.filter((k) => typeof k === 'string' && KEY_RE.test(k));

  const p = lsGet(LS_PREFS);
  if (isObj(p)) {
    if (Number.isInteger(p.size) && p.size >= 0 && p.size <= 5) store.prefs.size = p.size;
    if (['narrow', 'normal', 'wide'].includes(p.width)) store.prefs.width = p.width;
    if (typeof p.swipe === 'boolean') store.prefs.swipe = p.swipe;
  }
}

/* ---------- IndexedDB: texto de la Biblia (pesa varios MB) ---------- */
const openDb = () => new Promise((resolve, reject) => {
  const r = indexedDB.open('lector-rvr1960', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('kv', mode);
    const req = fn(t.objectStore('kv'));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
  });
}
export const idbGet = (k) => run('readonly', (s) => s.get(k));
export const idbSet = (k, v) => run('readwrite', (s) => s.put(v, k));
export const idbDel = (k) => run('readwrite', (s) => s.delete(k));
