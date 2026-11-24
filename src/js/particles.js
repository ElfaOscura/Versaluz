// Partículas doradas flotantes del modo oscuro (tsParticles). Se cargan solo cuando hacen falta.
import { effectiveTheme } from './theme.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let container = null;
let token = 0; // invalida cargas que quedaron atrasadas si el tema cambia mientras se cargan

const OPTIONS = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 40,
  detectRetina: true,
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
  interactivity: { events: { onHover: { enable: false }, onClick: { enable: false }, resize: { enable: true } } },
  particles: {
    number: { value: 30, density: { enable: true, width: 1000, height: 800 } },
    color: { value: ['#C9A55C', '#E3C77E', '#B8893A'] },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.12, max: 0.45 }, animation: { enable: true, speed: 0.35, sync: false } },
    size: { value: { min: 1, max: 2.8 } },
    move: {
      enable: true, direction: 'top', random: true, straight: false,
      speed: { min: 0.15, max: 0.45 }, outModes: { default: 'out' },
    },
  },
};

async function start() {
  const mine = ++token;
  try {
    const [{ tsParticles }, { loadSlim }] = await Promise.all([import('@tsparticles/engine'), import('@tsparticles/slim')]);
    await loadSlim(tsParticles);
    const c = await tsParticles.load({ id: 'particles', options: OPTIONS });
    if (mine !== token || !wanted()) { if (c) c.destroy(); return; }
    container = c || null;
  } catch {
    // Sin partículas la app funciona igual
  }
}

function stop() {
  token++;
  if (container) { container.destroy(); container = null; }
}

const wanted = () => effectiveTheme() === 'dark' && !reduceMotion.matches;

function sync() {
  if (wanted() && !container) start();
  else if (!wanted() && container) stop();
}

export function initParticles() {
  sync();
  window.addEventListener('themechange', sync);
  reduceMotion.addEventListener('change', sync);
}
