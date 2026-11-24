// Copiar y compartir versículos.
import { store } from './store.js';
import { normStr } from './util.js';

const parse = (key) => key.split('.').map(Number);

/** Ordena claves por libro, capítulo y versículo. */
export function sortKeys(keys) {
  return keys.slice().sort((x, y) => {
    const a = parse(x);
    const b = parse(y);
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  });
}

/** Firma de todo lo que se comparte o copia. */
export const APP_NAME = 'Versaluz';
export const MAX_IMAGE_VERSES = 2;

// En las citas compartidas los evangelios llevan "San": San Mateo, San Marcos, San Lucas, San Juan.
const SAINTS = new Set(['mateo', 'marcos', 'lucas', 'juan']);
export const shareBookName = (name) => (SAINTS.has(normStr(name)) ? `San ${name}` : name);

/**
 * Pasajes listos para citar. Los versículos seguidos del mismo capítulo se unen en un rango:
 * [{ ref: 'San Juan 3:16-17', text: 'Porque de tal manera…' }]
 */
export function verseRuns(keys) {
  const runs = [];
  for (const key of sortKeys(keys)) {
    const [b, c, v] = parse(key);
    const text = store.bible[b].chapters[c - 1][v - 1];
    const last = runs[runs.length - 1];
    if (last && last.b === b && last.c === c && last.v2 + 1 === v) {
      last.v2 = v;
      last.texts.push(text);
    } else {
      runs.push({ b, c, v1: v, v2: v, texts: [text] });
    }
  }
  return runs.map((r) => ({
    ref: `${shareBookName(store.bible[r.b].name)} ${r.c}:${r.v1}` + (r.v2 > r.v1 ? `-${r.v2}` : ''),
    text: r.texts.join(' '),
  }));
}

/** “Texto” — San Mateo 3:4 (cada pasaje en su párrafo). */
export const formatVerses = (keys) => verseRuns(keys).map((r) => `“${r.text}” — ${r.ref}`).join('\n\n');

/** El texto que se copia o se comparte: las citas y, al final, la firma de la app. */
export const shareMessage = (keys) => `${formatVerses(keys)}\n\n${APP_NAME}`;

/** Copia al portapapeles; si el navegador lo niega, prueba con un textarea temporal. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** true = compartido, null = el usuario canceló, false = falló. */
export async function shareText(text) {
  try {
    await navigator.share({ text });
    return true;
  } catch (e) {
    return e && e.name === 'AbortError' ? null : false;
  }
}

/** Comparte un archivo (la imagen). true = compartido, null = canceló, false = falló, 'nofiles' = el navegador no comparte archivos. */
export async function shareFile(file, title = APP_NAME) {
  try {
    if (!navigator.canShare || !navigator.canShare({ files: [file] })) return 'nofiles';
    await navigator.share({ files: [file], title });
    return true;
  } catch (e) {
    return e && e.name === 'AbortError' ? null : false;
  }
}
