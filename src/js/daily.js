// Versículo del día: uno por fecha del calendario (366, con el 29 de febrero), cada uno con su tema.
// Los datos viven en src/data/versiculos-diarios.json: { fecha: "MM-DD", ref: "Juan 3:16", tema: "Amor" }.
import DATA from '../data/versiculos-diarios.json';
import { tryRef } from './bible.js';

export const DAILY = DATA;
export const DAILY_REFS = DATA.map((d) => d.ref);

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (ref) => {
  const r = tryRef(ref);
  return r && r.v ? `${r.b}.${r.c}.${r.v}` : null;
};

/**
 * El versículo de una fecha: { key, ref, tema, fecha }. Es el mismo todo el día y cada año.
 * Si alguna referencia no existe en el texto cargado, usa la del día siguiente. Null si ninguna sirve.
 */
export function dailyEntry(date = new Date()) {
  const fecha = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const start = Math.max(0, DATA.findIndex((d) => d.fecha === fecha));
  for (let i = 0; i < DATA.length; i++) {
    const d = DATA[(start + i) % DATA.length];
    const key = keyOf(d.ref);
    if (key) return { key, ref: d.ref, tema: d.tema, fecha: d.fecha };
  }
  return null;
}

/** Solo la clave del versículo (o null). */
export const verseOfTheDay = (date) => (dailyEntry(date) || {}).key || null;

/** Referencias que no se encuentran en el texto cargado (para avisar en desarrollo). */
export const auditDaily = () => DATA.filter((d) => !keyOf(d.ref)).map((d) => `${d.fecha} ${d.ref}`);
