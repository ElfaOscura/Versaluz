// Sintaxis del buscador:
//   amor fe           todas las palabras (en cualquier orden)
//   "el amor"         la frase exacta
//   amor | fe         una cosa o la otra (se pueden combinar: "el amor" paz | fe)
import { normStr } from './util.js';

/**
 * Devuelve { groups, terms }.
 * groups: lista de alternativas (separadas por |); cada una es una lista de términos que deben estar todos.
 * terms: todos los términos sin repetir, para resaltarlos.
 * Los textos salen sin acentos ni mayúsculas, igual que el texto indexado.
 */
export function parseQuery(q) {
  const groups = [];
  for (const part of normStr(q).split('|')) {
    const terms = [];
    for (const m of part.matchAll(/"([^"]+)"|(\S+)/g)) {
      const raw = m[1] !== undefined ? m[1] : m[2].replace(/^"+|"+$/g, '');
      const t = raw.trim().replace(/\s+/g, ' ');
      if (t) terms.push(t);
    }
    if (terms.length) groups.push(terms);
  }
  return { groups, terms: [...new Set(groups.flat())] };
}

/** ¿El texto normalizado cumple alguna de las alternativas? */
export function matches(normalizedText, groups) {
  return groups.some((g) => g.every((t) => normalizedText.includes(t)));
}
