// Datos compartidos entre módulos.
// Las claves de versículo son "libro.capítulo.versículo": libro desde 0, capítulo y versículo desde 1 (ej. "42.3.16" = Juan 3:16).

export const store = {
  bible: null,   // [{ name, abbrev, chapters: [[texto, ...], ...] }]
  norm: null,    // mismo esquema que bible, con el texto sin acentos ni mayúsculas
  bookNorm: [],  // nombres de libro normalizados, sin espacios
  abbr: [],      // abreviaturas del archivo
  tags: {},      // { clave: ['etiqueta', ...] }
  notes: {},     // { clave: 'texto de la nota' }
  hl: {},        // { clave: 'yellow' | 'green' | 'rose' | 'blue' }
  cats: [],      // categorías de notas creadas por el usuario: ['Promesas', ...]
  noteCat: {},   // { clave: 'nombre de categoría' } (una por nota)
  noteOrder: [], // orden de la lista de notas: claves, la primera arriba
  bms: [],       // marcalibros: claves de versículo, el más reciente primero
  recent: [],    // capítulos leídos: [{ b, c }], el más reciente primero
  prefs: { size: 2, width: 'normal', swipe: true }, // tamaño de letra (índice), ancho de columna, deslizar para cambiar de capítulo
};

const initialState = () => ({
  q: '', b: -1, c: 0, v: 0, tag: '',
  t: '',           // testamento: '' (ambos) | 'at' | 'nt'
  limit: 150,
  editing: null,   // clave del versículo con un panel abierto
  editMode: '',    // 'tag' | 'note' | 'color'
  sel: [],         // claves de los versículos seleccionados
  selMode: '',     // '' | 'tag' | 'color' (panel de la barra de selección)
  tagDel: '',      // etiqueta que espera confirmación para borrarse (administrador de etiquetas)
  mode: 'welcome',
  groups: [],      // consulta analizada: alternativas de términos (ver search.js)
  terms: [],       // términos sin repetir, para resaltar
});

export const state = initialState();

export const isSearching = () => !!(state.q.trim() || state.tag);

/**
 * Una búsqueda (o un filtro por etiqueta) que empieza mientras lees abarca toda la Biblia, no solo el libro abierto.
 * Solo se limita a un libro si lo eliges en los filtros cuando ya hay resultados.
 * Llámala después de actualizar state.q o state.tag; `wasSearching` es el valor de isSearching() antes del cambio.
 */
export function widenIfStartedSearching(wasSearching) {
  if (!wasSearching && isSearching()) { state.b = -1; state.c = 0; state.v = 0; }
}

export function resetState() {
  Object.assign(state, initialState());
}
