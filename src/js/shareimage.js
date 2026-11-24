// Imagen del versículo para redes: se dibuja en un canvas con Merienda y la marca de agua de la app.
import { verseRuns, APP_NAME } from './share.js';
import { effectiveTheme } from './theme.js';

const W = 1080;
const HEIGHTS = [1350, 1920]; // 4:5 para el feed; si el texto es largo, 9:16 para historias
const SIDE = 130;             // margen del texto a cada lado
const TOP = 230;              // espacio reservado arriba (cruz)
const BOTTOM = 270;           // espacio reservado abajo (marca de agua)
const FAMILY = "Merienda, 'Source Serif 4', Georgia, serif";

const PALETTES = {
  dark: { top: '#1B130B', bottom: '#3B2A13', glow: 'rgba(201,165,92,.20)', ink: '#F2E5C9', gold: '#D9B866', dim: 'rgba(242,229,201,.62)', dot: '#E3C77E' },
  light: { top: '#F8EFD8', bottom: '#E9D9AE', glow: 'rgba(168,118,26,.16)', ink: '#3A2A14', gold: '#A8761A', dim: 'rgba(58,42,20,.62)', dot: '#B8893A' },
};

/** Espera a que Merienda esté lista para los caracteres que se van a dibujar. */
async function loadFonts(sample) {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('400 40px Merienda', sample),
      document.fonts.load('600 40px Merienda', sample + APP_NAME),
    ]);
  } catch { /* se usa la tipografía de respaldo */ }
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Mide cada pasaje con un tamaño de letra y devuelve el alto total. */
function layout(ctx, runs, size) {
  const maxW = W - SIDE * 2;
  const lh = Math.round(size * 1.55);
  const refSize = Math.round(size * 0.66);
  const gap = Math.round(size * 1.3);
  let total = 0;
  const blocks = runs.map((r, i) => {
    ctx.font = `400 ${size}px ${FAMILY}`;
    const lines = wrap(ctx, `“${r.text}”`, maxW);
    const h = lines.length * lh + Math.round(size * 0.55) + refSize;
    total += h + (i ? gap : 0);
    return { lines, ref: r.ref, h };
  });
  return { blocks, lh, refSize, gap, total, size };
}

function pickLayout(ctx, runs) {
  for (const H of HEIGHTS) {
    const room = H - TOP - BOTTOM;
    for (let size = 56; size >= 30; size -= 2) {
      const l = layout(ctx, runs, size);
      if (l.total <= room) return { H, ...l };
    }
  }
  return null;
}

// Puntos dorados fijos (mismo resultado cada vez) para dar ambiente
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

function drawBackground(ctx, H, p, dark) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, p.top);
  g.addColorStop(1, p.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.2, H, 0, W * 0.2, H, H * 0.75);
  glow.addColorStop(0, p.glow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const rnd = seeded(1960);
  ctx.fillStyle = p.dot;
  for (let i = 0; i < (dark ? 46 : 26); i++) {
    ctx.globalAlpha = (dark ? 0.12 : 0.1) + rnd() * (dark ? 0.35 : 0.2);
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Marco dorado doble
  ctx.strokeStyle = p.gold;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.7;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.strokeRect(54, 54, W - 108, H - 108);
  ctx.globalAlpha = 1;
}

function drawCross(ctx, cx, cy, p) {
  ctx.strokeStyle = p.gold;
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 44); ctx.lineTo(cx, cy + 44);
  ctx.moveTo(cx - 28, cy - 14); ctx.lineTo(cx + 28, cy - 14);
  ctx.stroke();
}

function drawText(ctx, l, H, p) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const room = H - TOP - BOTTOM;
  let y = TOP + (room - l.total) / 2;
  l.blocks.forEach((b, i) => {
    if (i) {
      // separador entre pasajes
      ctx.fillStyle = p.gold;
      ctx.globalAlpha = 0.7;
      for (const dx of [-24, 0, 24]) { ctx.beginPath(); ctx.arc(W / 2 + dx, y - l.gap / 2 + 4, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.font = `400 ${l.size}px ${FAMILY}`;
    ctx.fillStyle = p.ink;
    for (const line of b.lines) { y += l.lh; ctx.fillText(line, W / 2, y - Math.round(l.size * 0.28)); }
    y += Math.round(l.size * 0.55) + l.refSize;
    ctx.font = `600 ${l.refSize}px ${FAMILY}`;
    ctx.fillStyle = p.gold;
    ctx.fillText(`— ${b.ref}`, W / 2, y - Math.round(l.refSize * 0.2));
    y += l.gap;
  });
}

function drawWatermark(ctx, H, p) {
  const cy = H - 150;
  ctx.strokeStyle = p.gold;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 90, cy - 62); ctx.lineTo(W / 2 + 90, cy - 62); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.fillStyle = p.gold;
  ctx.font = `600 58px ${FAMILY}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  ctx.fillText(APP_NAME, W / 2, cy + 14);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.font = `400 24px ${FAMILY}`;
  ctx.fillStyle = p.dim;
  ctx.fillText('Reina-Valera 1960', W / 2, cy + 62);
}

/**
 * Dibuja la imagen de 1 o 2 pasajes. Devuelve { blob, width, height } o null si el texto no cabe ni en 9:16.
 * El tema (claro u oscuro) sigue al de la app.
 */
export async function buildVerseImage(keys, theme = effectiveTheme()) {
  const runs = verseRuns(keys);
  await loadFonts(runs.map((r) => r.text + r.ref).join(' '));
  const p = PALETTES[theme === 'dark' ? 'dark' : 'light'];

  const probe = document.createElement('canvas').getContext('2d');
  const l = pickLayout(probe, runs);
  if (!l) return null;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = l.H;
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, l.H, p, theme === 'dark');
  drawCross(ctx, W / 2, 150, p);
  drawText(ctx, l, l.H, p);
  drawWatermark(ctx, l.H, p);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? { blob, width: W, height: l.H } : null;
}

/** Nombre del archivo: versaluz-san-juan-3-16.png */
export function imageFileName(keys) {
  const ref = verseRuns(keys).map((r) => r.ref).join('-y-');
  const slug = ref.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `versaluz-${slug}.png`;
}
