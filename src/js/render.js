import { $, esc, range, highlight } from './util.js';
import { store, state, resetState } from './store.js';
import { collect, refOf, validKey, countByBook, inTestament, hasTestaments } from './bible.js';
import { parseQuery } from './search.js';
import { tagCounts } from './tags.js';
import { COLORS, COLOR_NAMES, pushRecent } from './study.js';
import { dailyEntry } from './daily.js';
import { ICON_TAG, ICON_BM, ICON_NOTE, ICON_HL, ICON_COPY, ICON_CHECK, ICON_SHARE } from './icons.js';

const verseText = (key) => {
  const [b, c, v] = key.split('.').map(Number);
  return store.bible[b].chapters[c - 1][v - 1];
};
const shorten = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

/* ---------- Pantallas ---------- */
function setBibleControls(visible) {
  $('searchBox').hidden = !visible;
  $('btnFilters').hidden = !visible;
  $('btnNotes').hidden = !visible;
  if (!visible) {
    $('filterPanel').hidden = true;
    $('btnFilters').setAttribute('aria-expanded', 'false');
  }
}

let view = 'read';
export const getView = () => view;

/** Cambia entre la lectura ('read') y la vista "Mi cuaderno" ('notebook'). */
export function setView(v) {
  view = v === 'notebook' && store.bible ? 'notebook' : 'read';
  const nb = view === 'notebook';
  $('notebook').hidden = !nb;
  $('app').hidden = nb || !store.bible;
  document.body.classList.toggle('view-notebook', nb);
  const btn = $('btnNotes');
  btn.setAttribute('aria-pressed', String(nb));
  btn.title = nb ? 'Volver a la lectura' : 'Mi cuaderno';
  btn.setAttribute('aria-label', nb ? 'Volver a la lectura' : 'Mi cuaderno');
}

export function showSetup(msg = '') {
  setView('read');
  store.bible = null;
  resetState();
  renderSelbar();
  setBibleControls(false);
  $('boot').hidden = true;
  $('app').hidden = true;
  $('setup').hidden = false;
  $('setupErr').textContent = msg;
}

export function showApp() {
  resetState();
  $('q').value = '';
  // Descarta lo guardado que no exista en este archivo (por ejemplo, si cambias de versión de la Biblia)
  store.bms = store.bms.filter(validKey);
  store.recent = store.recent.filter((r) => store.bible[r.b] && r.c >= 1 && r.c <= store.bible[r.b].chapters.length);

  setBibleControls(true);
  $('boot').hidden = true;
  $('setup').hidden = true;
  $('app').hidden = false;

  // Retoma donde ibas: abre el último capítulo leído
  const last = store.recent[0];
  if (last) { state.b = last.b; state.c = last.c; }

  refreshTagsUI();
  syncSelects();
  renderSelbar();
  run();
}

/* ---------- Filtros ---------- */
export function syncClear() {
  const filtered = state.b >= 0 || !!state.tag || !!state.t;
  $('btnClear').hidden = !(state.q || filtered);
  $('filterDot').hidden = !filtered;
}

export function syncSelects() {
  // Si el libro abierto no es del testamento elegido (por ejemplo, al pasar de Malaquías a Mateo), se quita el testamento
  if (state.t && state.b >= 0 && !inTestament(state.b, state.t)) state.t = '';
  $('testamentBox').hidden = !hasTestaments();
  $('selTestament').value = state.t;
  $('selBook').innerHTML = '<option value="-1">Todos los libros</option>' +
    store.bible.map((bk, i) => (inTestament(i, state.t) ? `<option value="${i}">${esc(bk.name)}</option>` : '')).join('');
  $('selBook').value = String(state.b);
  const cs = $('selChap');
  const vs = $('selVerse');
  if (state.b >= 0) {
    const n = store.bible[state.b].chapters.length;
    cs.innerHTML = '<option value="0">Todos</option>' + range(n).map((i) => `<option value="${i}">${i}</option>`).join('');
    cs.disabled = false;
    cs.value = String(state.c);
  } else {
    cs.innerHTML = '<option value="0">—</option>';
    cs.disabled = true;
  }
  if (state.b >= 0 && state.c > 0) {
    const m = store.bible[state.b].chapters[state.c - 1].length;
    vs.innerHTML = '<option value="0">Todos</option>' + range(m).map((i) => `<option value="${i}">${i}</option>`).join('');
    vs.disabled = false;
    vs.value = String(state.v);
  } else {
    vs.innerHTML = '<option value="0">—</option>';
    vs.disabled = true;
  }
  $('selTag').value = state.tag;
  syncClear();
}

export function refreshTagsUI() {
  const counts = tagCounts();
  const names = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'es'));
  if (state.tag && !counts[state.tag]) state.tag = '';
  $('selTag').innerHTML = '<option value="">Todas</option>' +
    names.map((t) => `<option value="${esc(t)}">${esc(t)} (${counts[t]})</option>`).join('');
  $('selTag').value = state.tag;
  $('tagList').innerHTML = names.map((t) => `<option value="${esc(t)}">`).join('');
  renderAside();
  if ($('tagsPanel').open) renderTagsPanel();
}

/* ---------- Aside: marcalibros, recientes y etiquetas ---------- */
function bookmarkRowHTML(key) {
  const ref = refOf(key);
  return `<li class="bmrow">` +
    `<button class="bmitem" data-act="goto" data-key="${key}"><strong>${esc(ref)}</strong><em>${esc(shorten(verseText(key), 90))}</em></button>` +
    `<button class="bmx" data-act="bmremove" data-key="${key}" aria-label="Quitar marcalibro de ${esc(ref)}" title="Quitar">×</button></li>`;
}

export function renderAside() {
  const body = $('asideBody');
  if (!store.bible) { body.innerHTML = ''; return; }

  const bms = store.bms.filter(validKey);
  const bookmarks = bms.length
    ? `<ul class="bmlist">${bms.map(bookmarkRowHTML).join('')}</ul>`
    : '<p class="hint">Toca el icono de marcador en un versículo para guardarlo aquí. Puedes tener varios.</p>';

  const reading = state.mode === 'read';
  const recent = store.recent.length
    ? `<div class="tagcloud">${store.recent.map((r) =>
      `<button data-act="goto" data-key="${r.b}.${r.c}.0" aria-current="${reading && state.b === r.b && state.c === r.c}">${esc(store.bible[r.b].name)} ${r.c}</button>`).join('')}</div>`
    : '';

  const counts = tagCounts();
  const names = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'es'));
  const tags = names.length
    ? `<div class="tagcloud">${names.map((t) =>
      `<button data-act="filtertag" data-tag="${esc(t)}" aria-pressed="${state.tag === t}">${esc(t)}<small>${counts[t]}</small></button>`).join('')}</div>`
    : '<p class="hint">Aún no hay etiquetas. Usa el icono de etiqueta en cualquier versículo.</p>';

  const noteCount = Object.keys(store.notes).length;
  body.innerHTML =
    `<section class="card"><h2>Mi cuaderno</h2><button class="btn notesbtn" type="button" data-act="notesopen">Abrir Mi cuaderno<small>${noteCount}</small></button></section>` +
    `<section class="card"><h2>Marcalibros</h2>${bookmarks}</section>` +
    (recent ? `<section class="card"><h2>Recientes</h2>${recent}</section>` : '') +
    `<section class="card"><h2>Etiquetas</h2>${tags}` +
    (names.length ? '<button class="linkbtn" data-act="tagsmanage">Administrar etiquetas</button>' : '') + '</section>';
}

/* ---------- Administrador de etiquetas ---------- */
export function renderTagsPanel() {
  const box = $('tagsList');
  const counts = tagCounts();
  const names = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'es'));
  if (!names.length) {
    box.innerHTML = '<p class="hint">Aún no hay etiquetas. Usa el icono de etiqueta en cualquier versículo.</p>';
    return;
  }
  // No pisar lo que se está escribiendo en una fila
  const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest('#tagsList')
    ? { id: document.activeElement.id, value: document.activeElement.value } : null;
  box.innerHTML = names.map((t, i) => {
    const n = counts[t];
    const confirming = state.tagDel === t;
    return `<form class="tagrow" data-tag="${esc(t)}">` +
      `<label class="sr" for="tagname-${i}">Nombre de la etiqueta ${esc(t)}</label>` +
      `<input id="tagname-${i}" type="text" value="${esc(t)}" maxlength="40" autocomplete="off">` +
      `<span class="tagcount">${n} ${n === 1 ? 'versículo' : 'versículos'}</span>` +
      `<button class="btn" type="submit">Guardar</button>` +
      `<button class="btn danger${confirming ? ' on' : ''}" type="button" data-act="tagdel" data-tag="${esc(t)}">` +
      `${confirming ? `Confirmar: quitar de ${n}` : 'Eliminar'}</button>` +
      `<p class="tagnote" role="status"></p></form>`;
  }).join('');
  if (typing && typing.id) {
    const el = document.getElementById(typing.id);
    if (el) { el.value = typing.value; el.focus(); }
  }
}

// backup.js y events.js llaman a este nombre cuando cambian los marcalibros
export function renderBmChip() { renderAside(); }

/* ---------- Piezas de un versículo ---------- */
function tagFormHTML(key, ref, tags) {
  const counts = tagCounts();
  const suggestions = Object.keys(counts)
    .filter((t) => !tags.includes(t))
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 8);
  return `<form class="editor" data-key="${key}">` +
    `<label class="sr" for="tagInput">Etiquetas para ${esc(ref)}</label>` +
    `<input id="tagInput" type="text" list="tagList" autocomplete="off" maxlength="60" placeholder="Nueva etiqueta (separa varias con comas)">` +
    `<button type="submit" class="btn primary">Agregar</button>` +
    (suggestions.length
      ? `<div class="suggest"><span>Usadas:</span>${suggestions.map((t) => `<button type="button" data-act="addtag" data-key="${key}" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>`
      : '') +
    `</form>`;
}

function noteFormHTML(key, ref, note) {
  return `<form class="noteform" data-key="${key}">` +
    `<label class="sr" for="noteInput">Nota para ${esc(ref)}</label>` +
    `<textarea id="noteInput" class="noteinput" rows="3" maxlength="2000" placeholder="Escribe tu nota…">${esc(note)}</textarea>` +
    `<div class="noteactions">` +
    `<button type="submit" class="btn primary">Guardar nota</button>` +
    `<button type="button" class="btn ghost" data-act="notecancel" data-key="${key}">Cancelar</button>` +
    (note ? `<button type="button" class="btn ghost" data-act="notedel" data-key="${key}">Borrar nota</button>` : '') +
    `</div></form>`;
}

/** Paleta de resaltado. `act` es la acción de cada botón; `key` va vacío en la barra de selección. */
function colorsHTML(act, key, current) {
  const k = key ? ` data-key="${key}"` : '';
  return `<div class="colors" role="group" aria-label="Color de resaltado">` +
    COLORS.map((c) => `<button type="button" class="swatch sw-${c}" data-act="${act}"${k} data-color="${c}" aria-pressed="${current === c}" aria-label="${COLOR_NAMES[c]}" title="${COLOR_NAMES[c]}"></button>`).join('') +
    `<button type="button" class="btn ghost" data-act="${act}"${k} data-color="">Quitar</button></div>`;
}

/* ---------- Versículos ---------- */
export function verseHTML(key, mode) {
  const [b, c, v] = key.split('.').map(Number);
  const text = store.bible[b].chapters[c - 1][v - 1];
  const tags = store.tags[key] || [];
  const note = store.notes[key] || '';
  const color = store.hl[key] || '';
  const isBm = store.bms.includes(key);
  const selected = state.sel.includes(key);
  const em = state.editing === key ? state.editMode : '';
  const reading = mode === 'read';
  const ref = `${store.bible[b].name} ${c}:${v}`;

  const chips = tags.map((t) => `<span class="chip">` +
    `<button data-act="filtertag" data-tag="${esc(t)}" title="Ver versículos con esta etiqueta">${esc(t)}</button>` +
    (em === 'tag' ? `<button class="chip-x" data-act="rmtag" data-key="${key}" data-tag="${esc(t)}" aria-label="Quitar etiqueta ${esc(t)}">×</button>` : '') +
    `</span>`).join('');

  let panel = '';
  if (em === 'tag') panel = tagFormHTML(key, ref, tags);
  else if (em === 'note') panel = noteFormHTML(key, ref, note);
  else if (em === 'color') panel = colorsHTML('setcolor', key, color);

  const noteView = note && em !== 'note'
    ? `<button class="note" data-act="edit" data-mode="note" data-key="${key}" title="Editar nota">${ICON_NOTE}<span>${esc(note)}</span></button>`
    : '';

  const selLabel = `${selected ? 'Quitar de la selección' : 'Seleccionar'} ${esc(ref)}`;
  const head = reading
    ? ''
    : `<div class="vhead"><button class="ref" data-act="goto" data-key="${key}" title="Abrir en su capítulo">${esc(ref)}</button></div>`;
  const num = reading
    ? `<button class="vnum" data-act="select" data-key="${key}" aria-pressed="${selected}" aria-label="${selLabel}" title="Seleccionar">${v}</button>`
    : '';

  const act = (mod, label, icon, extra = '') =>
    `<button class="icon${extra}" data-act="edit" data-mode="${mod}" data-key="${key}" aria-expanded="${em === mod}" aria-label="${label} ${esc(ref)}" title="${label}">${icon}</button>`;

  return `<article class="verse${reading ? ' read' : ''}${isBm ? ' is-bm' : ''}${selected ? ' sel' : ''}" id="v-${key}" data-hl="${color}">` +
    num +
    `<div class="vbody">` +
    head +
    `<p class="vtext"><span class="hlspan">${highlight(text, store.norm[b][c - 1][v - 1], state.terms)}</span></p>` +
    noteView +
    `<div class="vmeta"><div class="chips">${chips}</div><div class="vact">` +
    act('tag', 'Etiquetar', ICON_TAG) +
    `<button class="icon" data-act="vshare" data-key="${key}" aria-label="Compartir ${esc(ref)}" title="Compartir">${ICON_SHARE}</button>` +
    act('note', note ? 'Editar nota' : 'Agregar nota', ICON_NOTE, note ? ' has' : '') +
    act('color', 'Resaltar', ICON_HL, color ? ' has' : '') +
    `<button class="icon" data-act="copy" data-key="${key}" aria-label="Copiar ${esc(ref)}" title="Copiar">${ICON_COPY}</button>` +
    `<button class="icon" data-act="bm" data-key="${key}" aria-pressed="${isBm}" aria-label="Marcalibro en ${esc(ref)}" title="Marcalibro">${ICON_BM}</button>` +
    `<button class="icon selbtn" data-act="select" data-key="${key}" aria-pressed="${selected}" aria-label="${selLabel}" title="Seleccionar">${ICON_CHECK}</button>` +
    `</div></div>` +
    panel +
    `</div></article>`;
}

/** Repinta un solo versículo (al etiquetar, anotar o marcar) sin tocar el resto de la lista. */
export function updateVerse(key) {
  const el = document.getElementById('v-' + key);
  if (!el) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = verseHTML(key, state.mode === 'read' ? 'read' : 'results');
  el.replaceWith(tmp.firstElementChild);
}

/* ---------- Barra de selección ---------- */
export function renderSelbar() {
  const bar = $('selbar');
  const root = document.documentElement.style;
  const n = state.sel.length;
  if (n < 2 || !store.bible) { // con uno solo se usan los iconos del propio versículo
    state.selMode = '';
    bar.hidden = true;
    bar.innerHTML = '';
    root.setProperty('--selbar-h', '0px');
    return;
  }
  const sm = state.selMode;
  let panel = '';
  if (sm === 'tag') {
    panel = `<form class="selform" id="selForm">` +
      `<label class="sr" for="selTagInput">Etiquetas para los versículos seleccionados</label>` +
      `<input id="selTagInput" type="text" list="tagList" autocomplete="off" maxlength="60" placeholder="Etiqueta (separa varias con comas)">` +
      `<button type="submit" class="btn primary">Agregar a ${n}</button></form>`;
  } else if (sm === 'color') {
    panel = colorsHTML('selsetcolor', '', '');
  }
  bar.innerHTML = `<div class="selbar-in"><div class="selrow">` +
    `<strong>${n} ${n === 1 ? 'versículo' : 'versículos'}</strong>` +
    `<div class="selactions">` +
    `<button class="btn" data-act="selcopy">Copiar</button>` +
    `<button class="btn" data-act="selshare">Compartir</button>` +
    `<button class="btn" data-act="seltag" aria-expanded="${sm === 'tag'}">Etiquetar</button>` +
    `<button class="btn" data-act="selcolor" aria-expanded="${sm === 'color'}">Resaltar</button>` +
    `<button class="btn ghost" data-act="selclear">Listo</button>` +
    `</div></div>${panel}</div>`;
  bar.hidden = false;
  root.setProperty('--selbar-h', bar.offsetHeight + 'px');
}

/* ---------- Inicio, lista y resumen ---------- */
function navHTML() {
  const first = state.b === 0 && state.c === 1;
  const last = state.b === store.bible.length - 1 && state.c === store.bible[state.b].chapters.length;
  return '<div class="nav">' +
    `<button class="btn" data-act="prev"${first ? ' disabled' : ''}>← Anterior</button>` +
    `<button class="btn" data-act="next"${last ? ' disabled' : ''}>Siguiente →</button></div>`;
}

function dailyHTML() {
  const d = dailyEntry();
  if (!d) return '';
  const key = d.key;
  return `<section class="daily" aria-label="Versículo del día">` +
    `<div class="dhead"><span class="eyebrow">Versículo del día</span><span class="dtheme">${esc(d.tema)}</span></div>` +
    `<blockquote class="dtext">“${esc(verseText(key))}”</blockquote>` +
    `<div class="dfoot"><strong class="dref">${esc(refOf(key))}</strong><div class="dbtns">` +
    `<button class="btn primary" data-act="dshare" data-key="${key}">Compartir imagen</button>` +
    `<button class="btn" data-act="goto" data-key="${key}">Abrir</button>` +
    `<button class="btn" data-act="copy" data-key="${key}">Copiar</button></div></div></section>`;
}

function welcomeHTML() {
  const last = store.recent[0];
  const resume = last
    ? `<button class="resume" data-act="goto" data-key="${last.b}.${last.c}.0"><strong>${esc(store.bible[last.b].name)} ${last.c}</strong><span>Continuar leyendo</span></button>`
    : '';
  return `<div class="welcome">${dailyHTML()}${resume}` +
    `<h2>Busca o elige un pasaje</h2>` +
    `<ul><li>Escribe una palabra o frase para buscar en toda la Biblia: <code>misericordia</code>.</li>` +
    `<li>Escribe una referencia y llegas directo: <code>Juan 3:16</code>, <code>Salmos 23</code> o <code>1 Corintios 13:4-7</code>.</li>` +
    `<li>Busca una frase exacta entre comillas, <code>"el amor es sufrido"</code>, o varias opciones con <code>amor | fe</code>.</li>` +
    `<li>Abre los filtros para elegir testamento, libro, capítulo, versículo o etiqueta.</li>` +
    `<li>En cada versículo puedes etiquetar, anotar, resaltar, copiar o dejar un marcalibro.</li>` +
    `<li>Toca el número de un versículo (o su icono de selección) para elegir varios; con dos o más aparece una barra para copiar, compartir, etiquetar o resaltar a la vez.</li>` +
    `<li>Atajos: <code>/</code> para buscar, <code>←</code> y <code>→</code> para cambiar de capítulo. En el móvil, desliza a los lados.</li></ul>` +
    `</div>`;
}

export function run() {
  if (!store.bible) return;
  if (view !== 'read') setView('read'); // cualquier búsqueda o navegación vuelve a la lectura
  const parsed = parseQuery(state.q);
  state.groups = parsed.groups;
  state.terms = parsed.terms;
  const { mode, items } = collect();
  state.mode = mode;
  if (mode === 'read' && state.c > 0) pushRecent(state.b, state.c);
  renderAside();

  const list = $('list');
  const sum = $('summary');
  list.className = 'list' + (mode === 'results' ? ' results' : '');

  if (mode === 'welcome') {
    sum.innerHTML = '';
    list.innerHTML = welcomeHTML();
    syncClear();
    return;
  }

  const total = items.length;
  const reading = mode === 'read';
  const limit = reading && state.c > 0 ? Infinity : state.limit;
  const shown = items.slice(0, limit);

  if (reading) {
    const title = store.bible[state.b].name + (state.c > 0 ? ' ' + state.c : '') + (state.v > 0 ? ':' + state.v : '');
    sum.innerHTML = `<div><h2>${esc(title)}</h2></div>` + (state.c > 0 ? navHTML() : '');
  } else {
    const parts = [];
    if (state.q.trim()) parts.push(`texto “${esc(state.q.trim())}”`);
    if (state.tag) parts.push(`etiqueta “${esc(state.tag)}”`);
    if (state.t && state.b < 0) parts.push(state.t === 'at' ? 'Antiguo Testamento' : 'Nuevo Testamento');
    if (state.b >= 0) parts.push('en ' + esc(store.bible[state.b].name) + (state.c > 0 ? ' ' + state.c : '') + (state.v > 0 ? ':' + state.v : ''));
    sum.innerHTML = `<div><h2>${total} ${total === 1 ? 'versículo' : 'versículos'}</h2><p class="desc">${parts.join(' · ')}</p></div>`;
  }

  if (!total) {
    const what = [];
    if (state.q.trim()) what.push(`“${esc(state.q.trim())}”`);
    if (state.tag) what.push(`la etiqueta “${esc(state.tag)}”`);
    let where = '';
    if (state.b >= 0) where = ' en ' + esc(store.bible[state.b].name) + (state.c > 0 ? ' ' + state.c : '') + (state.v > 0 ? ':' + state.v : '');
    else if (state.t) where = state.t === 'at' ? ' en el Antiguo Testamento' : ' en el Nuevo Testamento';
    const canWiden = !!where && what.length > 0;
    list.innerHTML = `<div class="empty"><p>No hay versículos con ${what.join(' y ') || 'esos filtros'}${where}.</p>` +
      (canWiden ? `<button class="btn" data-act="widen">Buscar en toda la Biblia</button>` : '<p>Prueba con otra palabra o limpia los filtros.</p>') +
      `</div>`;
    syncClear();
    return;
  }

  let html = '';
  if (!reading && state.b < 0) {
    // Resultados de varios libros: botones por libro con su cantidad y un encabezado donde empieza cada uno
    const counts = countByBook(items);
    const countOf = new Map(counts);
    html += `<div class="tagcloud facets" role="group" aria-label="Filtrar resultados por libro">` +
      counts.map(([b, n]) => `<button data-act="facetbook" data-b="${b}">${esc(store.bible[b].name)}<small>${n}</small></button>`).join('') +
      `</div>`;
    let prev = -1;
    for (const k of shown) {
      const b = +k.split('.')[0];
      if (b !== prev) {
        html += `<h3 class="grouphead">${esc(store.bible[b].name)}<small>${countOf.get(b)}</small></h3>`;
        prev = b;
      }
      html += verseHTML(k, 'results');
    }
  } else {
    html = shown.map((k) => verseHTML(k, reading ? 'read' : 'results')).join('');
  }
  if (total > shown.length) html += `<button class="btn more" data-act="more">Mostrar más (${total - shown.length} restantes)</button>`;
  if (reading && state.c > 0) html += `<div class="bottom-nav">${navHTML()}</div>`;
  list.innerHTML = html;
  syncClear();
}

/* ---------- Navegación ---------- */
/**
 * Abre un capítulo. Con `v` resalta ese versículo (o el rango v..opts.v2) y lo lleva al centro.
 * opts.keepQuery deja el texto del buscador, para la búsqueda por referencia mientras se escribe.
 */
export function goto(b, c, v = 0, opts = {}) {
  state.q = '';
  if (!opts.keepQuery) $('q').value = '';
  state.tag = '';
  state.t = '';
  state.b = b;
  state.c = c;
  state.v = 0;
  state.limit = 150;
  state.editing = null;
  syncSelects();
  run();
  if (v) {
    const last = opts.v2 && opts.v2 > v ? opts.v2 : v;
    let first = null;
    for (let i = v; i <= last; i++) {
      const el = document.getElementById(`v-${b}.${c}.${i}`);
      if (!el) continue;
      el.classList.add('flash');
      if (!first) first = el;
    }
    if (first) first.scrollIntoView({ block: 'center' });
  } else {
    window.scrollTo(0, 0);
  }
}

export function step(dir) {
  let b = state.b;
  let c = state.c + dir;
  if (c < 1) {
    if (b === 0) return;
    b--;
    c = store.bible[b].chapters.length;
  } else if (c > store.bible[b].chapters.length) {
    if (b === store.bible.length - 1) return;
    b++;
    c = 1;
  }
  state.b = b;
  state.c = c;
  state.v = 0;
  state.editing = null;
  syncSelects();
  run();
  window.scrollTo(0, 0);
}
