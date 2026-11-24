# Versaluz

Lector de la Reina-Valera 1960 con búsqueda, filtros por libro/capítulo/versículo, etiquetas y marcalibro.
Proyecto Vite + Tailwind CSS 4, sin framework.

## Estructura

```
index.html            marcado de la página
src/
  main.js             arranque: carga el texto y conecta todo
  style.css           Tailwind + estilos propios (tokens de color y tipografía arriba)
  js/
    util.js           helpers de DOM, normalización de texto, resaltado, aviso (toast)
    store.js          estado compartido (Biblia, etiquetas, notas, filtros)
    storage.js        localStorage (datos del usuario) e IndexedDB (texto de la Biblia)
    bible.js          lectura del JSON, referencias ("Juan 3:16"), qué mostrar según filtros
    search.js         análisis de la búsqueda (frases, "|", etc.)
    tags.js           etiquetas: contar, agregar, quitar, renombrar/unir, borrar
    study.js          notas, resaltados, selección, marcalibros, recientes
    notes.js          lista de notas: orden, categorías y filtro (datos, sin DOM)
    notesview.js      ventana "Lista de notas" (usa sortablejs para arrastrar)
    share.js          copiar y compartir versículos
    prefs.js          tamaño de letra, ancho de columna, deslizar
    daily.js          versículo del día
    theme.js, icons.js
    render.js         pintar lista, resumen, selectores, aside y administrador de etiquetas
    events.js         búsqueda, filtros, clics, teclado
    backupdata.js     formato del respaldo, importar (sumar) y exportar a Markdown
    backup.js         panel de respaldo (botones y archivos)
    pwa.js            registro del service worker e instalación
    particles.js      partículas doradas del modo oscuro (tsParticles, carga diferida)
public/               manifest, sw.js, iconos (y opcional es_rvr1960.json)
```

## Instalación (una vez)

Necesitas Node.js (Laragon Full lo incluye). Desde el terminal de Laragon, dentro de la carpeta del proyecto:

```
npm install -D vite tailwindcss @tailwindcss/vite
```

`package.json` no trae versiones fijas a propósito: ese comando instala las más recientes
y compatibles entre sí. Después de instalar, queda fijado en `package.json` y `package-lock.json`.

## Verlo en Laragon

1. Copia la carpeta a `C:\laragon\www\versiculeando`.
2. Elige una de las dos formas:

**A. Servidor de desarrollo (recomendado mientras programas)**

```
npm run dev
```
Abre http://localhost:5173. Recarga solo al guardar cambios.

**B. Servido por Apache/Nginx de Laragon**

```
npm run build
```
Abre http://localhost/versiculeando/dist/ (o http://versiculeando.test/dist/ si usas los hosts
automáticos de Laragon). Con `npm run build:watch` se reconstruye al guardar; solo recargas el navegador.

Nota: cada dirección (localhost:5173, versiculeando.test…) guarda sus propios datos en el navegador.
Para pasar tus datos de una a otra, usa "Respaldo de mis datos" en el engranaje.

## De dónde sale el texto de la Biblia

1. `public/es_rvr1960.json`, si lo pones ahí (queda junto al `index.html` final).
2. Si no existe, lo descarga de `github.com/thiagobodruk/bible` (rama master, carpeta json).
3. Si ninguno responde, la app pide seleccionar el archivo a mano.

Una vez cargado se guarda en IndexedDB y no se vuelve a descargar. Las fuentes están en `SOURCES`, en `src/js/bible.js`.

## Agregar cosas

- **Estilos con Tailwind:** los tokens de `src/style.css` también son utilidades: `bg-surface`, `text-ink`,
  `border-line`, `text-accent`, `bg-accent-soft`, `text-ribbon`, `font-read`. Siguen el modo claro/oscuro solos.
  Puedes poner clases de Tailwind en `index.html` o en las plantillas de `src/js/render.js`.
- **Nueva función:** si es datos, `tags.js` o `bible.js`; si es pintar, `render.js`; si es un clic o tecla, `events.js`.
- **Claves de versículo:** `libro.capítulo.versículo`, con libro desde 0 y los otros desde 1 (`42.3.16` = Juan 3:16).

## Búsqueda

| Escribes | Encuentra |
|---|---|
| `amor fe` | versículos con las dos palabras, en cualquier orden |
| `"el amor es sufrido"` | la frase exacta |
| `amor \| fe` | una cosa o la otra (se puede combinar: `"el amor" paz \| fe`) |
| `Juan 3:16`, `Salmos 23`, `1 Corintios 13:4-7` | te lleva directo al pasaje |

La búsqueda siempre empieza en toda la Biblia, aunque estés leyendo un libro. Para limitarla, elige libro, capítulo,
versículo o testamento en los filtros. Si no hay resultados en ese libro, un botón repite la búsqueda en toda la Biblia.

Los resultados de varios libros salen agrupados, con un botón por libro y su cantidad.
En los filtros puedes limitar por Antiguo o Nuevo Testamento (`src/js/search.js` tiene el análisis de la consulta).

## Respaldo, exportar e importar

Engranaje → **Respaldo de mis datos**:

- **Descargar respaldo (.json)** guarda etiquetas, notas, resaltados y marcalibros. **Importar desde archivo** (o pegar el texto) los suma a lo que ya tienes:
  no pisa notas ni resaltados existentes y no duplica etiquetas ni marcalibros.
- **Descargar mis versículos (.md)** genera un documento legible: marcalibros, luego cada etiqueta con sus versículos (y tus notas), y al final lo que tiene nota o resaltado sin etiqueta.
  Sirve para imprimir, o abrir en Obsidian, Notion o Word.

## Lista de notas

Engranaje → **Lista de notas**, o el botón en primer lugar del aside. Cada nota muestra el versículo a la izquierda y tu nota a la derecha.

- **Editar** y **borrar** (el borrado pide una segunda pulsación). Tocar la referencia te lleva al versículo.
- **+ Categoría** asigna una categoría a la nota; ahí mismo puedes crear una nueva. Arriba, los botones filtran por categoría, y puedes borrar la categoría seleccionada (sus notas quedan sin categoría).
- **Ordenar:** arrastra desde el asa de la izquierda (funciona con el dedo). Con el teclado, enfoca el asa y usa las flechas arriba y abajo. Si hay un filtro activo, solo se reacomodan las notas visibles.
- Las categorías y el orden van en el respaldo (`.json`) y las categorías en el Markdown.

## Administrar etiquetas

Engranaje → **Administrar etiquetas** (o el enlace al final de Etiquetas en el aside). Cada etiqueta tiene su nombre editable:
si escribes el de otra que ya existe, se unen. **Eliminar** pide una segunda pulsación para confirmar y solo quita la etiqueta; los versículos se quedan.

## Instalar como app (PWA)

`public/manifest.webmanifest`, `public/sw.js` e `public/icons/` hacen que la app se pueda instalar y abrir sin conexión.

- El service worker solo se activa con `npm run build` (no con `npm run dev`) y solo en **https://** o **localhost**.
  En `http://versiculeando.test` (Laragon sin SSL) el navegador no lo permite. Prueba en `http://localhost/versiculeando/dist/`,
  con `npm run preview` (http://localhost:4173) o activa SSL en Laragon (Menú → Apache → SSL → Enabled).
  GitHub Pages ya es https.
- Después de visitar la app una vez con conexión, abre sin red. El texto de la Biblia ya queda guardado en el navegador.
- En Chrome, Edge y Android aparece "Instalar la app" en el engranaje. En iPhone: Compartir → Añadir a pantalla de inicio.
- Si cambias la app y subes una versión nueva, la siguiente visita avisa "Hay una versión nueva" y basta recargar.
  Para forzar que todos descarten lo guardado, sube el número de `CACHE` en `public/sw.js`.

## Aviso

La RVR1960 es marca registrada de Sociedades Bíblicas Unidas. `.gitignore` excluye
`public/es_rvr1960.json` para que no lo subas a un repositorio público. Uso personal.

## Ambiente visual

- **Modo oscuro:** degradado marrón y dorado, partículas doradas (`src/js/particles.js`, paquetes `@tsparticles/engine` y `@tsparticles/slim`, cargados solo en oscuro y apagados si el sistema pide reducir movimiento) e imagen en la esquina (`public/imagen-esq.webp`; su tamaño y opacidad están en `#cornerArt`, en `src/style.css`).
- **Modo claro:** fondo de lino y bordes de pergamino (el borde rasgado es el filtro `#parchment` de `index.html`).
- **Paneles y resultados:** vidrio al 70% con degradado marrón y borde dorado. Los colores son los tokens `--glass-a/b` y `--gold-a/b/c`.
