export const $ = (id) => document.getElementById(id);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export const range = (n) => Array.from({ length: n }, (_, i) => i + 1); // 1..n
export const range0 = (n) => Array.from({ length: n }, (_, i) => i);    // 0..n-1

/** Minúsculas y sin acentos, conservando la longitud (para poder resaltar por posición). */
export function normStr(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const n = s[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    out += n.length === 1 ? n : (n.charAt(0) || s[i]);
  }
  return out;
}

/** Devuelve `text` escapado con <mark> sobre cada término encontrado en `nt` (texto normalizado). */
export function highlight(text, nt, terms) {
  if (!terms.length) return esc(text);
  const ranges = [];
  for (const t of terms) {
    let i = 0;
    while ((i = nt.indexOf(t, i)) >= 0) {
      ranges.push([i, i + t.length]);
      i += t.length;
    }
  }
  if (!ranges.length) return esc(text);
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0].slice()];
  for (let k = 1; k < ranges.length; k++) {
    const last = merged[merged.length - 1];
    if (ranges[k][0] <= last[1]) last[1] = Math.max(last[1], ranges[k][1]);
    else merged.push(ranges[k].slice());
  }
  let out = '';
  let p = 0;
  for (const [a, b] of merged) {
    out += esc(text.slice(p, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>';
    p = b;
  }
  return out + esc(text.slice(p));
}

let toastTimer;
export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}
