import { $, toast } from './util.js';
import { store, state, isSearching, widenIfStartedSearching } from './store.js';
import { refOf, tryRef, inTestament } from './bible.js';
import { addTagsData, removeTagData, renameTag, deleteTag, normalizeTag, tagCounts } from './tags.js';
import {
  setNote, setHighlight, setHighlightMany, addTagsMany,
  toggleSelect, clearSelection, toggleBookmark, removeBookmark,
} from './study.js';
import { shareMessage, copyText } from './share.js';
import { openShare } from './shareview.js';
import { run, goto, step, syncSelects, updateVerse, refreshTagsUI, renderAside, renderSelbar, renderTagsPanel } from './render.js';
import { initTheme, setTheme } from './theme.js';
import { openNotes } from './notesview.js';
import { applyPrefs, changeSize, setWidth, setSwipe } from './prefs.js';

const setExpanded = (btn, on) => btn.setAttribute('aria-expanded', String(on));

/* ---------- Menú de ajustes, filtros y aside ---------- */
function closeMenu() {
  $('menu').hidden = true;
  setExpanded($('btnMenu'), false);
}
function toggleMenu() {
  const open = $('menu').hidden;
  $('menu').hidden = !open;
  setExpanded($('btnMenu'), open);
}
function toggleFilters() {
  const open = $('filterPanel').hidden;
  $('filterPanel').hidden = !open;
  setExpanded($('btnFilters'), open);
}
function closeFilters() {
  $('filterPanel').hidden = true;
  setExpanded($('btnFilters'), false);
}
function closeAside() {
  $('aside').classList.remove('open');
  setExpanded($('asideToggle'), false);
}

function openTagsPanel() {
  state.tagDel = '';
  $('tagsPanel').hidden = false;
  renderTagsPanel();
  closeAside();
  window.scrollTo({ top: 0 });
}
function closeTagsPanel() {
  $('tagsPanel').hidden = true;
  state.tagDel = '';
}

function focusEditor(id) {
  setTimeout(() => {
    const el = id ? $(id) : ($('tagInput') || $('noteInput'));
    if (el) el.focus();
  }, 0);
}

function afterTagChange(key) {
  refreshTagsUI();
  updateVerse(key);
}

/** Cierra el panel (etiquetas, nota o color) del versículo abierto. */
function closeEditor() {
  const k = state.editing;
  state.editing = null;
  state.editMode = '';
  if (k) updateVerse(k);
}

/** Quita búsqueda y filtros y vuelve al inicio. */
function clearAll() {
  state.q = ''; $('q').value = '';
  state.b = -1; state.c = 0; state.v = 0; state.tag = ''; state.t = '';
  state.limit = 150; state.editing = null;
  syncSelects(); run();
  window.scrollTo(0, 0);
}

/** ¿Se está leyendo un capítulo? Solo entonces valen las flechas y el deslizar. */
const canStep = () => !!store.bible && state.mode === 'read' && state.b >= 0 && state.c > 0;

/** Si el texto del buscador es una referencia (Juan 3:16, Salmos 23, 1 Cor 13:4-7), abre ese pasaje. */
function openIfReference(text) {
  const ref = tryRef(text);
  if (!ref) return false;
  goto(ref.b, ref.c, ref.v, { v2: ref.v2, keepQuery: true });
  return true;
}

/* ---------- Copiar y compartir ---------- */
const selLabel = () => (state.sel.length === 1 ? refOf(state.sel[0]) : `${state.sel.length} versículos`);

async function copyKeys(keys, label) {
  const ok = await copyText(shareMessage(keys));
  toast(ok ? `Copiado: ${label}` : 'No se pudo copiar');
}

export function initEvents() {
  initTheme();
  applyPrefs();

  $('btnHome').addEventListener('click', clearAll);
  $('btnMenu').addEventListener('click', toggleMenu);
  $('btnFilters').addEventListener('click', toggleFilters);
  $('asideToggle').addEventListener('click', () => {
    const open = !$('aside').classList.contains('open');
    $('aside').classList.toggle('open', open);
    setExpanded($('asideToggle'), open);
  });

  $('menu').addEventListener('click', (e) => {
    const themeBtn = e.target.closest('[data-theme-set]');
    if (themeBtn) { setTheme(themeBtn.dataset.themeSet); return; }
    const sizeBtn = e.target.closest('[data-size]');
    if (sizeBtn) { changeSize(+sizeBtn.dataset.size); return; }
    const widthBtn = e.target.closest('[data-width-set]');
    if (widthBtn) { setWidth(widthBtn.dataset.widthSet); return; }
    if (e.target.closest('.menu-item')) closeMenu();
  });
  $('swipeToggle').addEventListener('change', (e) => setSwipe(e.target.checked));
  // El panel de respaldo está arriba de la página: súbela para que se vea
  $('btnBackup').addEventListener('click', () => window.scrollTo({ top: 0 }));
  $('btnNotes').addEventListener('click', openNotes);
  $('btnTags').addEventListener('click', () => {
    if ($('tagsPanel').hidden) openTagsPanel(); else closeTagsPanel();
  });

  // Aviso en vivo: si el nombre ya existe, se unirán
  $('tagsList').addEventListener('input', (e) => {
    const row = e.target.closest('form.tagrow');
    if (!row) return;
    const to = normalizeTag(e.target.value);
    const from = row.dataset.tag;
    const note = row.querySelector('.tagnote');
    note.textContent = to && to !== from && tagCounts()[to] ? `Ya existe «${to}»: se unirán sus versículos.` : '';
  });

  /* ---------- Búsqueda: una referencia lleva al pasaje, cualquier otro texto busca en el texto ---------- */
  let searchTimer;
  $('q').addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (openIfReference(val)) return;
      const was = isSearching();
      state.q = val;
      widenIfStartedSearching(was);
      state.limit = 150;
      syncSelects();
      run();
    }, 140);
  });

  $('q').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !store.bible) return;
    clearTimeout(searchTimer);
    if (openIfReference(e.target.value)) {
      e.preventDefault();
      e.target.blur(); // oculta el teclado en el móvil
    }
  });

  $('selTestament').addEventListener('change', (e) => {
    state.t = e.target.value;
    // Un libro de otro testamento ya no aplica
    if (state.b >= 0 && !inTestament(state.b, state.t)) { state.b = -1; state.c = 0; state.v = 0; }
    state.limit = 150;
    state.editing = null;
    syncSelects();
    run();
  });
  $('selBook').addEventListener('change', (e) => {
    state.b = +e.target.value;
    state.v = 0;
    state.limit = 150;
    state.editing = null;
    state.c = state.b >= 0 && !isSearching() ? 1 : 0;
    syncSelects();
    run();
  });
  $('selChap').addEventListener('change', (e) => {
    state.c = +e.target.value; state.v = 0; state.limit = 150; state.editing = null;
    syncSelects(); run();
  });
  $('selVerse').addEventListener('change', (e) => {
    state.v = +e.target.value; state.editing = null;
    syncSelects(); run();
  });
  $('selTag').addEventListener('change', (e) => {
    const was = isSearching();
    state.tag = e.target.value;
    widenIfStartedSearching(was);
    state.limit = 150;
    syncSelects(); run();
  });
  $('btnClear').addEventListener('click', clearAll);

  /* ---------- Acciones dentro de la lista, el aside y la barra de selección (delegación) ---------- */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-wrap')) closeMenu();

    const t = e.target.closest('[data-act]');
    if (!t || !store.bible) return;
    const { act, key, tag, mode, color } = t.dataset;

    switch (act) {
      /* Panel de un versículo: etiquetas, nota o color */
      case 'edit': {
        const old = state.editing;
        if (old === key && state.editMode === mode) { state.editing = null; state.editMode = ''; }
        else { state.editing = key; state.editMode = mode; }
        if (old && old !== key) updateVerse(old);
        updateVerse(key);
        if (state.editing) focusEditor();
        break;
      }
      case 'notecancel':
        closeEditor();
        break;
      case 'notedel':
        setNote(key, '');
        closeEditor();
        toast('Nota borrada');
        break;
      case 'setcolor':
        setHighlight(key, color);
        closeEditor();
        break;
      case 'copy':
        copyKeys([key], refOf(key));
        break;

      /* Marcalibros */
      case 'bm': {
        const added = toggleBookmark(key);
        toast(added ? `Marcalibro en ${refOf(key)}` : 'Marcalibro quitado');
        updateVerse(key);
        renderAside();
        break;
      }
      case 'bmremove':
        removeBookmark(key);
        updateVerse(key);
        renderAside();
        toast('Marcalibro quitado');
        break;

      /* Etiquetas */
      case 'rmtag':
        removeTagData(key, tag);
        afterTagChange(key);
        break;
      case 'addtag':
        addTagsData(key, tag);
        afterTagChange(key);
        focusEditor();
        break;
      case 'filtertag': {
        const was = isSearching();
        state.tag = state.tag === tag ? '' : tag; // tocar la etiqueta activa la desactiva
        widenIfStartedSearching(was);
        state.limit = 150;
        state.editing = null;
        syncSelects(); run();
        closeAside();
        window.scrollTo(0, 0);
        break;
      }

      /* Administrador de etiquetas */
      case 'tagsmanage':
        openTagsPanel();
        break;
      case 'notesopen':
        closeAside();
        openNotes();
        break;
      case 'tagdel': {
        if (state.tagDel !== tag) {
          state.tagDel = tag;
          renderTagsPanel();
          setTimeout(() => { if (state.tagDel === tag) { state.tagDel = ''; if (!$('tagsPanel').hidden) renderTagsPanel(); } }, 4000);
          break;
        }
        state.tagDel = '';
        const n = deleteTag(tag);
        if (state.tag === tag) state.tag = '';
        refreshTagsUI();
        syncSelects();
        run();
        toast(`Etiqueta «${tag}» quitada de ${n} ${n === 1 ? 'versículo' : 'versículos'}`);
        break;
      }

      /* Sin resultados en un libro o testamento: repetir la búsqueda en toda la Biblia */
      case 'widen':
        state.b = -1;
        state.c = 0;
        state.v = 0;
        state.t = '';
        state.limit = 150;
        syncSelects();
        run();
        break;

      /* Resultados de varios libros: quedarse con uno */
      case 'facetbook':
        state.b = +t.dataset.b;
        state.c = 0;
        state.v = 0;
        state.limit = 150;
        state.editing = null;
        syncSelects();
        run();
        window.scrollTo(0, 0);
        break;

      /* Selección de varios versículos */
      case 'select':
        toggleSelect(key);
        updateVerse(key);
        renderSelbar();
        break;
      case 'selcopy':
        copyKeys(state.sel, selLabel());
        break;
      case 'selshare':
        openShare(state.sel);
        break;
      case 'dshare':
        openShare([key], { image: true });
        break;
      case 'seltag':
        state.selMode = state.selMode === 'tag' ? '' : 'tag';
        renderSelbar();
        if (state.selMode) focusEditor('selTagInput');
        break;
      case 'selcolor':
        state.selMode = state.selMode === 'color' ? '' : 'color';
        renderSelbar();
        break;
      case 'selsetcolor':
        setHighlightMany(state.sel, color);
        state.sel.forEach(updateVerse);
        toast(color ? `Resaltado en ${state.sel.length}` : 'Resaltado quitado');
        state.selMode = '';
        renderSelbar();
        break;
      case 'selclear': {
        const old = clearSelection();
        old.forEach(updateVerse);
        renderSelbar();
        break;
      }

      /* Navegación (key puede ser un capítulo entero: "libro.capítulo.0") */
      case 'goto': {
        const [b, c, v] = key.split('.').map(Number);
        closeAside();
        goto(b, c, v);
        break;
      }
      case 'more':
        state.limit += 150;
        run();
        break;
      case 'prev': step(-1); break;
      case 'next': step(1); break;
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form.editor, form.noteform, form.selform, form.tagrow');
    if (!form) return;
    e.preventDefault();

    if (form.classList.contains('tagrow')) {
      const from = form.dataset.tag;
      const r = renameTag(from, form.querySelector('input').value);
      if (!r.ok) { form.querySelector('.tagnote').textContent = 'Escribe un nombre.'; return; }
      if (!r.changed) return;
      if (state.tag === from) state.tag = r.target;
      state.tagDel = '';
      refreshTagsUI();
      syncSelects();
      run();
      toast(r.merged ? `Unidas en «${r.target}» (${r.count} ${r.count === 1 ? 'versículo' : 'versículos'})` : `Renombrada a «${r.target}»`);
      return;
    }

    if (form.classList.contains('noteform')) {
      const saved = setNote(form.dataset.key, form.querySelector('textarea').value);
      closeEditor();
      toast(saved ? 'Nota guardada' : 'Nota borrada');
      return;
    }

    if (form.classList.contains('selform')) {
      const input = form.querySelector('input');
      if (!input.value.trim()) return;
      const added = addTagsMany(state.sel, input.value);
      input.value = '';
      refreshTagsUI();
      state.sel.forEach(updateVerse);
      toast(added ? `Etiqueta agregada a ${state.sel.length}` : 'Ya tenían esas etiquetas');
      input.focus();
      return;
    }

    const key = form.dataset.key;
    addTagsData(key, form.querySelector('input').value);
    afterTagChange(key);
    focusEditor();
  });

  /* ---------- Teclado ---------- */
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter (o Cmd+Enter) guarda la nota
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.matches && e.target.matches('textarea.noteinput')) {
      e.preventDefault();
      e.target.form.requestSubmit();
      return;
    }

    if (e.key === 'Escape') {
      if ($('notesView').open) return; // el cuadro de notas se cierra solo con Esc
      if (!$('menu').hidden) { closeMenu(); $('btnMenu').focus(); }
      else if (!$('filterPanel').hidden) { closeFilters(); $('btnFilters').focus(); }
      else if (state.editing) closeEditor();
      else if (state.selMode) { state.selMode = ''; renderSelbar(); }
      else if (state.sel.length) { clearSelection().forEach(updateVerse); renderSelbar(); }
      else if (!$('tagsPanel').hidden) { closeTagsPanel(); $('btnMenu').focus(); }
      else if (!$('panel').hidden) { $('panel').hidden = true; setExpanded($('btnBackup'), false); }
      return;
    }

    // Atajos: no actúan mientras se escribe en un campo ni con Ctrl, Cmd o Alt
    const el = e.target;
    const typing = el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
    if (typing || e.ctrlKey || e.metaKey || e.altKey || !store.bible) return;

    if (e.key === '/') {
      e.preventDefault();
      $('q').focus();
      $('q').select();
    } else if (e.key === 'ArrowRight' && canStep()) {
      step(1);
    } else if (e.key === 'ArrowLeft' && canStep()) {
      step(-1);
    }
  });

  /* ---------- Deslizar para cambiar de capítulo (móvil) ---------- */
  let touch = null;
  const app = $('app');
  app.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    const inField = e.target.closest('input, textarea, select, form');
    touch = store.prefs.swipe && e.touches.length === 1 && canStep() && !inField
      ? { x: t.clientX, y: t.clientY, time: Date.now() }
      : null;
  }, { passive: true });
  app.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    const fast = Date.now() - touch.time < 700;
    touch = null;
    // Un gesto claramente horizontal; no cuenta si se estaba seleccionando texto
    if (!fast || Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const sel = window.getSelection && window.getSelection().toString();
    if (sel) return;
    if (canStep()) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}
