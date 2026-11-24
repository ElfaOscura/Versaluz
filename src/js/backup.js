import { $ } from './util.js';
import { store } from './store.js';
import { idbDel, markBackup } from './storage.js';
import { refreshTagsUI, renderBmChip, showSetup, run } from './render.js';
import {
  backupJson, hasUserData, mergeBackup, previewBackup, describeAdded, buildMarkdown, downloadFile,
  backupFileName, notesFileName, backupState,
} from './backupdata.js';

let staged = null; // respaldo leído, esperando que el usuario confirme

const say = (text) => { $('backupMsg').textContent = text; };
const when = (ms) => new Date(ms).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });

function closePanel() {
  $('panel').hidden = true;
  $('btnBackup').setAttribute('aria-expanded', 'false');
}

/** Línea de estado del respaldo y punto discreto en el engranaje y en el menú si hay cambios sin respaldar. */
export function refreshBackupStatus() {
  const s = backupState();
  let text;
  if (!s.hasData && s.never) text = 'Todavía no tienes nada que respaldar.';
  else if (s.never) text = 'Aún no has guardado ningún respaldo de tus datos.';
  else text = `Último respaldo: ${when(s.last)}.`;
  if (s.pending && !s.never) text += ` Tienes cambios sin respaldar (desde ${when(s.changed)}).`;
  $('backupStatus').textContent = text;
  $('btnMenu').classList.toggle('has-pending', s.pending);
  $('btnBackup').classList.toggle('has-pending', s.pending);
}

/* ---------- Cargar: leer, mostrar qué se sumaría y confirmar ---------- */
function clearStaged() {
  staged = null;
  $('backupPreview').hidden = true;
}

function stage(text) {
  clearStaged();
  let data;
  try { data = JSON.parse(text); } catch { say('Eso no es un respaldo válido.'); return; }
  const added = previewBackup(data);
  if (!added) { say('Eso no es un respaldo válido.'); return; }
  const what = describeAdded(added);
  say('');
  $('backupPreviewText').textContent = what
    ? `Se sumarán a tus datos: ${what}. Lo que ya tienes no se borra ni se cambia.`
    : 'No hay nada nuevo que sumar: todo lo del respaldo ya está en tus datos.';
  $('btnConfirmImport').hidden = !what;
  staged = what ? data : null;
  $('backupPreview').hidden = false;
}

function confirmImport() {
  if (!staged) return;
  const added = mergeBackup(staged);
  clearStaged();
  if (!added) return;
  markBackup();
  refreshTagsUI();
  renderBmChip();
  run();
  refreshBackupStatus();
  say(`Listo: se sumaron ${describeAdded(added) || 'cero elementos'}.`);
}

/* ---------- Guardar ---------- */
async function shareBackup() {
  if (!hasUserData()) { say('Todavía no tienes nada que respaldar.'); return; }
  const name = backupFileName();
  const json = backupJson(true);
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Respaldo Versaluz' });
      markBackup();
      refreshBackupStatus();
      say('Respaldo compartido. Si elegiste Google Drive, ya quedó guardado ahí.');
      return;
    } catch { /* canceló o no se pudo: se descarga el archivo */ }
  }
  downloadFile(name, json, 'application/json');
  markBackup();
  refreshBackupStatus();
  say(`Se descargó ${name}. Para guardarlo en Google Drive: abre Drive, toca «+» → «Subir» y elige ese archivo.`);
}

export function initBackup() {
  $('btnBackup').addEventListener('click', () => {
    const panel = $('panel');
    panel.hidden = !panel.hidden;
    $('btnBackup').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) { say(''); clearStaged(); refreshBackupStatus(); }
  });
  window.addEventListener('datachange', refreshBackupStatus);
  refreshBackupStatus();

  $('btnDownload').addEventListener('click', () => {
    if (!hasUserData()) { say('Todavía no tienes nada que respaldar.'); return; }
    const name = backupFileName();
    downloadFile(name, backupJson(true), 'application/json');
    markBackup();
    refreshBackupStatus();
    say(`Respaldo descargado: ${name}. Para recuperarlo usa «Cargar respaldo (.json)».`);
  });
  $('btnShareBackup').addEventListener('click', shareBackup);

  $('btnExport').addEventListener('click', async () => {
    const ta = $('backupText');
    ta.value = backupJson();
    try {
      await navigator.clipboard.writeText(ta.value);
      markBackup();
      refreshBackupStatus();
      say('Respaldo copiado al portapapeles. Pégalo en un archivo de notas para conservarlo.');
    } catch {
      ta.focus();
      ta.select();
      say('Selecciona el texto y cópialo con Ctrl+C.');
    }
  });

  $('btnDownloadMd').addEventListener('click', () => {
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    if (!hasUserData()) { say('Todavía no tienes etiquetas, notas, resaltados ni marcalibros que exportar.'); return; }
    const name = notesFileName();
    downloadFile(name, buildMarkdown(), 'text/markdown');
    say(`Descargado: ${name}. Es un documento para leer y estudiar; para recuperar tus datos usa el respaldo .json.`);
  });

  // Cargar un respaldo: primero se muestra qué se sumaría y se confirma
  $('btnImportFile').addEventListener('click', () => $('backupFile').click());
  $('backupFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // permite elegir el mismo archivo otra vez
    if (!file) return;
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    if (file.size > 20 * 1024 * 1024) { say('Ese archivo es demasiado grande para ser un respaldo.'); return; }
    try { stage(await file.text()); } catch { say('No se pudo leer el archivo.'); }
  });
  $('btnImport').addEventListener('click', () => {
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    stage($('backupText').value);
  });
  $('btnConfirmImport').addEventListener('click', confirmImport);
  $('btnCancelImport').addEventListener('click', () => { clearStaged(); say(''); });

  $('btnReplace').addEventListener('click', () => {
    idbDel('bible').catch(() => {});
    closePanel();
    showSetup('');
  });
}
