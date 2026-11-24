import { $ } from './util.js';
import { store } from './store.js';
import { idbDel } from './storage.js';
import { refreshTagsUI, renderBmChip, showSetup, run } from './render.js';
import { backupJson, hasUserData, stamp, mergeBackup, buildMarkdown, downloadFile } from './backupdata.js';

function closePanel() {
  $('panel').hidden = true;
  $('btnBackup').setAttribute('aria-expanded', 'false');
}

const say = (text) => { $('backupMsg').textContent = text; };

/** Suma un respaldo (texto JSON) a los datos y actualiza la pantalla. */
function importText(text) {
  let data;
  try { data = JSON.parse(text); } catch { say('Eso no es un respaldo válido.'); return; }
  const added = mergeBackup(data);
  if (!added) { say('Eso no es un respaldo válido.'); return; }
  refreshTagsUI();
  renderBmChip();
  run();
  say(`Importado: ${added.tags} etiquetas nuevas, ${added.notes} notas, ${added.marks} resaltados y ${added.bms} marcalibros.`);
}

export function initBackup() {
  $('btnBackup').addEventListener('click', () => {
    const panel = $('panel');
    panel.hidden = !panel.hidden;
    $('btnBackup').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) say('');
  });

  $('btnExport').addEventListener('click', async () => {
    const ta = $('backupText');
    ta.value = backupJson();
    try {
      await navigator.clipboard.writeText(ta.value);
      say('Respaldo copiado. Pégalo en un archivo de notas para conservarlo.');
    } catch {
      ta.focus();
      ta.select();
      say('Selecciona el texto y cópialo con Ctrl+C.');
    }
  });

  $('btnDownload').addEventListener('click', () => {
    if (!hasUserData()) { say('Todavía no tienes nada que respaldar.'); return; }
    downloadFile(`versaluz-respaldo-${stamp()}.json`, backupJson(true), 'application/json');
    say('Respaldo descargado. Para recuperarlo usa «Importar desde archivo».');
  });

  $('btnDownloadMd').addEventListener('click', () => {
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    if (!hasUserData()) { say('Todavía no tienes etiquetas, notas, resaltados ni marcalibros que exportar.'); return; }
    downloadFile(`versaluz-mis-versiculos-${stamp()}.md`, buildMarkdown(), 'text/markdown');
    say('Descargado. Es un archivo de texto que puedes abrir en cualquier editor o en Obsidian.');
  });

  // Importar suma lo del respaldo y no pisa lo que ya tienes en notas y resaltados.
  $('btnImport').addEventListener('click', () => {
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    importText($('backupText').value);
  });

  $('btnImportFile').addEventListener('click', () => $('backupFile').click());
  $('backupFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // permite elegir el mismo archivo otra vez
    if (!file) return;
    if (!store.bible) { say('Primero carga el texto de la Biblia.'); return; }
    if (file.size > 20 * 1024 * 1024) { say('Ese archivo es demasiado grande para ser un respaldo.'); return; }
    try { importText(await file.text()); } catch { say('No se pudo leer el archivo.'); }
  });

  $('btnReplace').addEventListener('click', () => {
    idbDel('bible').catch(() => {});
    closePanel();
    showSetup('');
  });
}
