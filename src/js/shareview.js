// Ventana de compartir: imagen para 1 o 2 versículos, o mensaje de texto si son más.
import { $, esc, toast } from './util.js';
import { shareMessage, shareText, shareFile, copyText, canShare, MAX_IMAGE_VERSES } from './share.js';
import { buildVerseImage, imageFileName } from './shareimage.js';

let current = null; // { keys, text, blob, file, url }
let opening = 0;    // aperturas en curso (dibujando la imagen)

const dlg = () => $('shareView');

function release() {
  if (current && current.url) URL.revokeObjectURL(current.url);
  current = null;
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function render() {
  const c = current;
  const imageMode = !!c.blob;
  const canSend = imageMode
    ? !!(navigator.canShare && c.file && navigator.canShare({ files: [c.file] }))
    : canShare();
  $('svTitle').textContent = imageMode ? 'Compartir como imagen' : 'Compartir como texto';
  $('svBody').innerHTML =
    (imageMode
      ? `<img class="sv-img" src="${c.url}" alt="Vista previa de la imagen del versículo" width="${c.width}" height="${c.height}">`
      : `<p class="sv-note" role="status">Seleccionaste ${c.keys.length} versículos. Al ser demasiado texto para una imagen, se compartirá como mensaje de texto.</p>` +
        `<pre class="sv-text">${esc(c.text)}</pre>`) +
    '<div class="sv-actions">' +
    (canSend ? `<button type="button" class="btn primary" data-sact="share">Compartir</button>` : '') +
    (imageMode ? `<button type="button" class="btn${canSend ? '' : ' primary'}" data-sact="download">Descargar imagen</button>` : '') +
    `<button type="button" class="btn${!canSend && !imageMode ? ' primary' : ''}" data-sact="copy">Copiar texto</button>` +
    '<button type="button" class="btn ghost" data-sact="close">Cerrar</button></div>';
}

/** Abre la ventana para compartir. Hasta 2 pasajes salen como imagen; más, como texto. */
export async function openShare(keys) {
  if (!keys.length) return;
  release();
  opening++;
  try { await open(keys); } finally { opening--; }
}

async function open(keys) {
  const text = shareMessage(keys);
  const cur = { keys: keys.slice(), text, blob: null, file: null, url: '', width: 0, height: 0 };
  current = cur;

  if (keys.length <= MAX_IMAGE_VERSES) {
    toast('Preparando la imagen…');
    const img = await buildVerseImage(keys).catch(() => null);
    if (img) {
      if (current !== cur) { return; } // se abrió otra ventana mientras se dibujaba
      Object.assign(cur, img, {
        url: URL.createObjectURL(img.blob),
        file: new File([img.blob], imageFileName(keys), { type: 'image/png' }),
      });
    } else {
      toast('El texto es muy largo para una imagen: se compartirá como mensaje de texto.');
    }
  }
  render();
  if (!dlg().open) dlg().showModal();
  dlg().appendChild($('toast'));
  dlg().focus();
  document.documentElement.classList.add('modal-open');
}

export function initShareView() {
  const d = dlg();
  d.addEventListener('close', () => {
    if (d.open || opening) return; // ya se volvió a abrir (o se está abriendo)
    document.documentElement.classList.remove('modal-open');
    document.body.appendChild($('toast'));
    release();
  });
  d.addEventListener('click', async (e) => {
    if (e.target === d) { d.close(); return; }
    const btn = e.target.closest('[data-sact]');
    if (!btn || !current) return;
    switch (btn.dataset.sact) {
      case 'close': d.close(); break;
      case 'copy':
        toast((await copyText(current.text)) ? 'Texto copiado' : 'No se pudo copiar');
        break;
      case 'download':
        download(current.blob, current.file.name);
        toast('Imagen descargada');
        break;
      case 'share': {
        const r = current.blob ? await shareFile(current.file) : await shareText(current.text);
        if (r === false) toast('No se pudo compartir. Prueba con Descargar o Copiar.');
        else if (r === 'nofiles') toast('Este navegador no comparte imágenes. Usa Descargar.');
        break;
      }
    }
  });
}
