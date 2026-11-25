import '@fontsource/merienda/400.css';
import '@fontsource/merienda/600.css';
import './style.css';
import { $, toast } from './js/util.js';
import { loadUserData, idbGet, idbSet } from './js/storage.js';
import { SOURCES, normalizeBible, parseBible, indexBible, fetchBible } from './js/bible.js';
import { showApp, showSetup } from './js/render.js';
import { initEvents } from './js/events.js';
import { initBackup } from './js/backup.js';
import { initNotebook } from './js/notebook.js';
import { initTour, maybeStartTour } from './js/tour.js';
import { initShareView } from './js/shareview.js';
import { initPwa } from './js/pwa.js';
import { initParticles } from './js/particles.js';
import { auditDaily } from './js/daily.js';

function openBible(bible) {
  indexBible(bible);
  if (import.meta.env.DEV) {
    const bad = auditDaily(); // avisa si alguna referencia del versículo del día no existe en este texto
    if (bad.length) console.warn('Versículo del día: referencias que no se encuentran:', bad);
  }
  showApp();
  maybeStartTour();
}

/** Carga manual del archivo (pantalla inicial o "Cargar otro archivo"). */
async function loadFile(file) {
  let bible;
  try {
    bible = parseBible(await file.text());
  } catch {
    showSetup('Ese archivo no tiene el formato esperado. Debe ser es_rvr1960.json, una lista de libros con sus capítulos.');
    return;
  }
  openBible(bible);
  idbSet('bible', bible).catch(() => toast('No se pudo guardar en el navegador. Tendrás que cargar el archivo cada vez.'));
}

function initFileInput() {
  $('file').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) loadFile(f);
    e.target.value = '';
  });
  const drop = $('drop');
  ['dragenter', 'dragover'].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });
}

async function boot() {
  let bible = null;
  let fromNetwork = false;

  try {
    const saved = await idbGet('bible');
    if (saved) bible = normalizeBible(saved);
  } catch { /* sin caché: se intenta descargar */ }

  if (!bible) {
    try { bible = await fetchBible(SOURCES); fromNetwork = true; } catch { /* queda la carga manual */ }
  }

  if (!bible) { showSetup(); return; }
  openBible(bible);
  if (fromNetwork) idbSet('bible', bible).catch(() => {});
}

loadUserData();
initEvents();
initBackup();
initNotebook();
initTour();
initShareView();
initPwa();
initParticles();
initFileInput();
boot();
