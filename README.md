# Versaluz

> Lector web de la **Reina-Valera 1960** para estudiar con calma: búsqueda rápida, filtros, etiquetas, notas con categorías, resaltados, marcalibros, versículo del día, compartir como imagen y respaldo de tus datos. Funciona sin conexión.

[![Demo en vivo](https://img.shields.io/badge/Demo-GitHub%20Pages-c89d54?style=for-the-badge)](https://elfaoscura.github.io/Versaluz/)
![Vite](https://img.shields.io/badge/Vite-Vanilla%20JS-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?style=flat-square)

🌐 **Ver en línea:** <https://elfaoscura.github.io/Versaluz/>

Construido con **Vite + Tailwind CSS v4**, JavaScript puro (módulos ES) y sin framework frontend. Tus notas y etiquetas se guardan **solo en tu navegador**: no hay cuentas ni servidor.

---

## Tabla de contenidos

- [Características](#características)
- [Primeros pasos](#primeros-pasos)
- [Atajos de teclado](#atajos-de-teclado)
- [Búsqueda y filtros](#búsqueda-y-filtros)
- [Estudio personal](#estudio-personal)
- [Mi cuaderno](#mi-cuaderno)
- [Versículo del día](#versículo-del-día)
- [Compartir versículos](#compartir-versículos)
- [Respaldo y exportación](#respaldo-y-exportación)
- [Paseo inicial](#paseo-inicial)
- [Instalar como app (PWA)](#instalar-como-app-pwa)
- [De dónde sale el texto y créditos](#de-dónde-sale-el-texto-y-créditos)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Publicar en GitHub Pages](#publicar-en-github-pages)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Extender el proyecto](#extender-el-proyecto)
- [Ambiente visual](#ambiente-visual)
- [Créditos y licencias](#créditos-y-licencias)
- [Aviso legal](#aviso-legal)

---

## Características

- **Lectura y navegación:** por libro, capítulo, versículo o testamento; flechas del teclado y deslizar en el móvil para cambiar de capítulo; la app retoma donde ibas.
- **Búsqueda flexible:** palabras, frases exactas, alternativas con `|` y referencias directas (`Juan 3:16`).
- **Estudio personal:** etiquetas (renombrables y fusionables), notas con categorías y orden propio, resaltados de cuatro colores y marcalibros.
- **Mi cuaderno:** una vista a todo el ancho con tus notas, etiquetas y textos resaltados.
- **Versículo del día:** 366 versículos con su tema, uno por fecha.
- **Compartir:** imagen lista para redes (con la marca *Versaluz*) o texto con formato de cita.
- **Respaldo y exportación:** copia `.json` con vista previa antes de importar, y apuntes legibles en `.md`.
- **Paseo inicial guiado** para conocer la app en menos de un minuto.
- **Modo claro y oscuro**, con ajustes de tamaño de letra y ancho de columna.
- **PWA:** se instala y abre sin conexión (la Biblia queda en `IndexedDB`).

---

## Primeros pasos

1. Abre la [demo](https://elfaoscura.github.io/Versaluz/). La primera vez descarga el texto y lo guarda en tu navegador.
2. Escribe en el buscador una palabra (`misericordia`) o una referencia (`Salmos 23`).
3. Toca el número de un versículo, o los iconos de su fila, para etiquetarlo, anotarlo, resaltarlo, compartirlo o guardarlo como marcalibro.
4. Abre **Mi cuaderno** (icono de documento junto al engranaje) para ver todo lo tuyo junto.
5. De vez en cuando, haz un respaldo desde el engranaje → **Respaldo de mis datos**.

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `/` | Enfoca el buscador |
| `←` / `→` | Capítulo anterior / siguiente |
| `Esc` | Cierra el menú, el modal, Mi cuaderno o la selección (en ese orden de prioridad) |
| `Ctrl` + `Enter` | Guarda la nota que estás escribiendo |
| `↑` / `↓` en el asa de una nota | Reordena la nota sin arrastrar |

En el móvil puedes **deslizar a los lados** para cambiar de capítulo (se puede desactivar en Ajustes).

---

## Búsqueda y filtros

| Escribes | Encuentra |
|---|---|
| `amor fe` | versículos con las dos palabras, en cualquier orden |
| `"el amor es sufrido"` | la frase exacta |
| `amor \| fe` | una cosa o la otra (combinable: `"el amor" paz \| fe`) |
| `Juan 3:16`, `Salmos 23`, `1 Corintios 13:4-7` | te lleva directo al pasaje |

- La búsqueda siempre empieza en **toda la Biblia**. Para limitarla, usa los filtros de testamento, libro, capítulo, versículo o etiqueta.
- Si no hay resultados en el libro elegido, un botón repite la búsqueda en toda la Biblia.
- Los resultados de varios libros salen agrupados, con un botón por libro y su cantidad.
- El análisis de la consulta está en `src/js/search.js`.

---

## Estudio personal

Cada versículo (en la lectura y en los resultados) tiene una fila de iconos: **etiquetar, compartir, nota, resaltar, copiar, marcalibro y seleccionar**.

- **Etiquetas:** varias por versículo. En Ajustes → **Administrar etiquetas** (ventana modal) puedes renombrarlas; si escribes el nombre de otra existente, se unen. Eliminar pide confirmación y no borra los versículos.
- **Notas:** una por versículo, con categorías propias que puedes crear, asignar y borrar, y con orden personalizado.
- **Resaltados:** amarillo, verde, rosa o azul.
- **Selección múltiple:** con un solo versículo usas sus propios iconos; al seleccionar **2 o más** aparece una barra inferior para copiar, compartir, etiquetar o resaltar todos a la vez.

---

## Mi cuaderno

Vista aparte (no es una ventana) que aprovecha todo el ancho de la pantalla. Se abre con el icono de documento junto al engranaje o desde el panel lateral, y se vuelve a la lectura con **Volver a la lectura**, con `Esc` o con el mismo icono.

| Pestaña | Qué hace |
|---|---|
| **Notas** | Versículo a la izquierda y tu nota a la derecha. Editar, borrar (con confirmación), filtrar por categoría y reordenar arrastrando o con el teclado. |
| **Etiquetas** | Versículos agrupados por etiqueta, con filtro y acceso a *Administrar etiquetas*. |
| **Resaltados** | Lista con referencia, texto, color y nota; filtro por color, **Ir al pasaje** y **Quitar resaltado**. |

Arriba a la derecha, **Exportar .md** descarga tus apuntes como `Mis Notas-Versaluz-AAAA-MM-DD.md`.

---

## Versículo del día

Aparece en la pantalla de inicio con su tema (Amor, Esperanza, Misericordia…) y tres botones: **Compartir imagen**, **Abrir** y **Copiar**. Cada fecha del calendario tiene el suyo (366, incluido el 29 de febrero), igual todo el día y todos los años.

Para cambiar uno, edita `src/data/versiculos-diarios.json`; cada registro es:

```json
{ "fecha": "MM-DD", "ref": "Juan 3:16", "tema": "Amor" }
```

En modo desarrollo (`npm run dev`), si alguna referencia no existe en el texto cargado, la consola del navegador lo avisa y la app usa el versículo del día siguiente.

---

## Compartir versículos

- **1 o 2 versículos:** se genera una imagen (1080×1350, o 1080×1920 si el texto es largo) con tu tema claro u oscuro, la cita y la marca **Versaluz**. Si el navegador comparte archivos (móvil), el botón **Compartir** abre la hoja del sistema; si no, usa **Descargar imagen**.
- **3 o más:** se comparte como texto, porque no cabe bien en una imagen.
- Al copiar o compartir texto, el formato es (los evangelios llevan «San»):

```text
“Y Juan estaba vestido de pelo de camello…” — San Mateo 3:4

Versaluz
```

---

## Respaldo y exportación

Engranaje → **Respaldo de mis datos** (ventana modal: se cierra con la X, con `Esc` o tocando fuera). Arriba muestra la fecha del último respaldo; si hay cambios posteriores, aparece un punto discreto en el engranaje.

| Acción | Resultado |
|---|---|
| **Descargar respaldo (.json)** | `versaluz_AAAA-MM-DD.json` con etiquetas, notas, categorías, resaltados y marcalibros. |
| **Compartir / Guardar en Drive** | Abre la hoja de compartir del dispositivo con ese archivo (elige Google Drive). Si no se puede, lo descarga y explica cómo subirlo. |
| **Copiar al portapapeles / pegar como texto** | Alternativa sin archivos. |
| **Cargar respaldo (.json)** | Muestra una **vista previa** de lo que se sumaría (notas, categorías, etiquetas, resaltados, marcalibros) y pide confirmar. **No pisa** lo existente ni duplica. |
| **Descargar mis apuntes (.md)** | `Mis Notas-Versaluz-AAAA-MM-DD.md`, un documento para leer y estudiar. No sirve para recuperar datos. |

> Tus datos viven solo en este navegador. Si borras los datos del sitio o cambias de dispositivo, los perderás: haz respaldos de vez en cuando.

---

## Paseo inicial

La primera vez que se abre la Biblia aparece una guía de 7 pasos (buscador, filtros, notas y resaltados, Mi cuaderno, respaldo, ajustes e instalación).

- Controles: **Siguiente / Atrás / Saltar**, flechas del teclado y `Esc`.
- En el móvil se muestra como hoja inferior y se recoloca si cambias el tamaño de la pantalla.
- Al terminar o saltarla se guarda la marca `rvr1960.tour` en el navegador. Para verla de nuevo: Engranaje → **Ver guía inicial**.

---

## Instalar como app (PWA)

`public/manifest.webmanifest`, `public/sw.js` e `public/icons/` permiten instalar la app y abrirla sin conexión.

- El service worker solo se activa en la versión compilada (`npm run build`), no con `npm run dev`, y solo en **https://** o **localhost**. GitHub Pages ya es https.
- Tras visitar la app una vez con conexión, abre sin red.
- En Chrome, Edge y Android aparece **Instalar la app** en el engranaje. En iPhone: Compartir → **Añadir a pantalla de inicio**.
- Si publicas una versión nueva, la siguiente visita avisa «Hay una versión nueva» y basta recargar. Para forzar que todos descarten lo guardado, sube el número de `CACHE` en `public/sw.js`.
- Las tipografías Inter y Source Serif se cargan desde Google Fonts; sin conexión se usa una fuente del sistema. Merienda (títulos) va incluida en la app.

---

## De dónde sale el texto y créditos

La app obtiene el texto bíblico en este orden:

1. `public/es_rvr1960.json`, si lo colocas localmente para uso propio (está excluido del repositorio por `.gitignore`).
2. Una fuente externa configurada en `SOURCES` (`src/js/bible.js`), como el repositorio **`thiagobodruk/bible`** en GitHub.
3. Selección manual del archivo JSON desde la interfaz, si ninguna fuente responde.

Una vez cargado, se guarda en `IndexedDB` y no se vuelve a descargar.

**Dataset:** [Thiago Bodruk (`thiagobodruk/bible`)](https://github.com/thiagobodruk/bible), por la recopilación y estructuración de textos bíblicos en formato JSON.

---

## Instalación y desarrollo

Necesitas [Node.js](https://nodejs.org/) (Laragon Full lo incluye).

```bash
git clone https://github.com/ElfaOscura/Versaluz.git
cd Versaluz
npm install
npm run dev
```

Abre <http://localhost:5173>; recarga solo al guardar.

| Script | Para qué sirve |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión de producción en `dist/` |
| `npm run build:watch` | Reconstruye `dist/` al guardar cambios |
| `npm run preview` | Sirve `dist/` en <http://localhost:4173> (sirve para probar la PWA) |

**Dependencias:** `vite`, `tailwindcss` y `@tailwindcss/vite` (desarrollo); `@fontsource/merienda`, `@tsparticles/engine`, `@tsparticles/slim` y `sortablejs` (aplicación).

### Con Laragon (Apache/Nginx)

1. Copia la carpeta a `C:\laragon\www\versaluz`.
2. Ejecuta `npm run build` y abre `http://localhost/versaluz/dist/`. Gracias a `base: './'` en `vite.config.js`, `dist/` funciona desde cualquier carpeta.

> Cada dirección (`localhost:5173`, `versaluz.test`, GitHub Pages…) guarda sus **propios datos** en el navegador. Para pasarlos de una a otra, usa el respaldo.

---

## Publicar en GitHub Pages

El código vive en la rama `main` y el sitio compilado (`dist/`) en la rama `gh-pages`. En el repositorio: **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `(root)`**.

Cada vez que quieras publicar:

```bash
npm run build
```

y sube el **contenido** de `dist/` a la rama `gh-pages`. Dos formas:

**A. Con `git worktree` (no instala nada):**

```bash
# primera vez: carpeta hermana enlazada a la rama gh-pages
git worktree add ../versaluz-pages gh-pages

# cada publicación: copia el contenido de dist/ y súbelo
#   (en Windows: robocopy dist ..\versaluz-pages /MIR /XD .git)
rm -rf ../versaluz-pages/*
cp -r dist/* ../versaluz-pages/
cd ../versaluz-pages
git add -A
git commit -m "Publicar nueva versión"
git push origin gh-pages
```

**B. Con el paquete `gh-pages` (opcional, instala una dependencia de desarrollo):**

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

Notas:

- `dist/` está en `.gitignore`, así que **no** se sube a `main`.
- No hace falta cambiar `base`: `./` funciona en `https://usuario.github.io/Versaluz/`.
- `public/es_rvr1960.json` tampoco se sube (licencia); en la demo, la app descarga el texto de la fuente externa.
- Tras publicar, el service worker avisa de la versión nueva en la siguiente visita.

---

## Estructura del proyecto

```text
index.html                  marcado principal de la página
src/
  main.js                   arranque: carga el texto y conecta los módulos
  style.css                 Tailwind CSS v4 + tokens de color, tipografía y estilos propios
  data/
    versiculos-diarios.json 366 versículos, uno por fecha, con su tema
  js/
    util.js                 helpers de DOM, normalización de texto, resaltado y avisos (toast)
    store.js                estado compartido (Biblia, etiquetas, notas, categorías y filtros)
    storage.js              localStorage (datos de usuario) e IndexedDB (texto bíblico)
    bible.js                lectura del JSON, referencias ("Juan 3:16") y resolución de filtros
    search.js               análisis de consultas (frases, "|", referencias)
    tags.js                 etiquetas: conteo, alta, baja, renombrar/unir y eliminar
    study.js                notas, resaltados, selección, marcalibros e historial reciente
    notes.js                orden, categorías y filtrado de notas (lógica sin DOM)
    notebook.js             vista "Mi cuaderno" (notas, etiquetas y resaltados; SortableJS para reordenar)
    tour.js                 paseo inicial guiado (sin dependencias)
    share.js                formato de las citas, firma «Versaluz», copiar y compartir
    shareimage.js           dibuja la imagen del versículo en un canvas
    shareview.js            ventana de compartir: imagen (1-2 versículos) o texto (3 o más)
    daily.js                versículo del día
    prefs.js                tamaño de letra, ancho de columna y gestos de deslizar
    theme.js                tema claro / oscuro
    icons.js                iconos de la interfaz (estilo Lucide, incluidos en el código)
    render.js               lista, resumen, selectores, panel lateral, barra de selección y etiquetas
    events.js               búsqueda, filtros, clics y teclado
    backupdata.js           formato del respaldo, importación aditiva y exportación a Markdown
    backup.js               ventana modal de respaldo
    pwa.js                  registro del service worker e instalación como app
    particles.js            partículas doradas en modo oscuro (tsParticles, carga diferida)
public/
  manifest.webmanifest      manifiesto PWA
  sw.js                     service worker
  icons/                    iconos de la app y apple-touch-icon
  images/                   recursos gráficos (imagen-esq.webp)
```

---

## Extender el proyecto

- **Estilos con Tailwind:** los tokens de `src/style.css` también son utilidades (`bg-surface`, `text-ink`, `border-line`, `text-accent`, `bg-accent-soft`, `text-ribbon`, `font-read`) y siguen el modo claro/oscuro solos.
- **Dónde poner una función nueva:** datos → `tags.js`, `notes.js` o `bible.js`; pintar → `render.js` (o `notebook.js` para Mi cuaderno); clics y teclas → `events.js`.
- **Claves de versículo:** `libro.capítulo.versículo`, con el libro desde 0 y los demás desde 1 (`42.3.16` = Juan 3:16).
- **Datos del usuario:** claves `rvr1960.*` en `localStorage` (etiquetas, notas, resaltados, marcalibros, categorías, orden, preferencias y marca del paseo). Se mantienen con ese prefijo para no perder datos de versiones anteriores.

---

## Ambiente visual

- **Modo oscuro:** degradado marrón y dorado, partículas doradas (`src/js/particles.js`, cargadas solo en oscuro y apagadas si el sistema pide reducir movimiento) e imagen en la esquina (`public/images/imagen-esq.webp`; su tamaño y opacidad están en `#cornerArt`, en `src/style.css`).
- **Modo claro:** fondo de lino y bordes de pergamino (el borde rasgado es el filtro SVG `#parchment` de `index.html`).
- **Paneles y resultados:** vidrio al 70% con degradado marrón y borde dorado (tokens `--glass-a/b` y `--gold-a/b/c`). El menú de ajustes usa fondo sólido.

---

## Créditos y licencias

- Texto bíblico: Reina-Valera 1960 (ver aviso legal) vía [`thiagobodruk/bible`](https://github.com/thiagobodruk/bible).
- Iconos: [Lucide](https://lucide.dev) (licencia ISC).
- Tipografía de títulos: [Merienda](https://fonts.google.com/specimen/Merienda) mediante `@fontsource/merienda` (SIL OFL).
- [tsParticles](https://particles.js.org/) y [SortableJS](https://sortablejs.github.io/Sortable/) (licencia MIT).
- Proyecto en GitHub: <https://github.com/ElfaOscura/Versaluz> · Apoya el proyecto en [Ko-fi](https://ko-fi.com/naidi_art).

---

## Aviso legal

La **Reina-Valera 1960** es una marca registrada de las Sociedades Bíblicas Unidas. Esta aplicación es de uso personal y de estudio; `.gitignore` excluye `public/es_rvr1960.json` para que no subas el texto con licencia a un repositorio público.
