// Versículo del día: uno por fecha, tomado de una lista de pasajes conocidos.
import { tryRef } from './bible.js';

export const DAILY_REFS = [
  'Juan 3:16', 'Salmos 23:1', 'Romanos 8:28', 'Filipenses 4:13', 'Proverbios 3:5', 'Isaías 41:10',
  'Josué 1:9', 'Jeremías 29:11', 'Mateo 6:33', 'Salmos 119:105', 'Romanos 12:2', 'Isaías 40:31',
  'Juan 14:6', 'Salmos 46:1', 'Mateo 11:28', 'Hebreos 11:1', '1 Corintios 13:4', 'Gálatas 5:22',
  'Efesios 2:8', 'Filipenses 4:6', 'Salmos 27:1', 'Juan 8:32', 'Romanos 5:8', 'Santiago 1:5',
  '1 Pedro 5:7', '2 Timoteo 1:7', 'Salmos 37:4', 'Proverbios 16:3', 'Juan 16:33', 'Éxodo 14:14',
  'Deuteronomio 31:6', 'Salmos 91:1', 'Isaías 53:5', 'Romanos 6:23', 'Juan 10:10', 'Mateo 28:20',
  'Lamentaciones 3:22', 'Miqueas 6:8', 'Hebreos 13:8', '1 Juan 4:19', 'Apocalipsis 21:4', 'Colosenses 3:23',
  '1 Tesalonicenses 5:16', 'Génesis 1:1', 'Salmos 139:14', 'Salmos 51:10', 'Salmos 118:24', 'Juan 15:5',
  'Romanos 15:13', '1 Corintios 10:13', 'Filipenses 1:6', 'Proverbios 22:6', 'Salmos 30:5', 'Mateo 7:7',
  'Juan 13:34', '1 Juan 1:9', 'Hebreos 4:12', 'Santiago 4:8', 'Apocalipsis 3:20', 'Isaías 26:3',
  'Jeremías 33:3', 'Sofonías 3:17', 'Habacuc 3:18', 'Números 6:24', '2 Timoteo 3:16', 'Gálatas 2:20',
  'Juan 11:25', 'Efesios 6:10', 'Proverbios 18:10', 'Salmos 62:1', '1 Juan 4:8', 'Mateo 5:16',
];

/** Clave del versículo para una fecha (la misma durante todo el día). Null si ninguna referencia coincide con este archivo. */
export function verseOfTheDay(date = new Date()) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  for (let i = 0; i < DAILY_REFS.length; i++) {
    const r = tryRef(DAILY_REFS[(day + i) % DAILY_REFS.length]);
    if (r && r.v) return `${r.b}.${r.c}.${r.v}`;
  }
  return null;
}
