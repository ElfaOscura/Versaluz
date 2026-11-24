# Versaluz

> Lector de la **Reina-Valera 1960** con búsqueda rápida, filtros por libro, capítulo, versículo o testamento, etiquetas, notas organizadas por categorías, marcalibros y respaldo local.

[![Demo en vivo](https://img.shields.io/badge/Demo-GitHub%20Pages-c89d54?style=for-the-badge)](https://elfaoscura.github.io/Versaluz/)
![Vite](https://img.shields.io/badge/Vite-Vanilla%20JS-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5A0FC8?style=flat-square)

🌐 **Ver en línea:** [https://elfaoscura.github.io/Versaluz/](https://elfaoscura.github.io/Versaluz/)

Construido con **Vite + Tailwind CSS v4** sin framework frontend.

---

## Tabla de contenidos

- [Características principales](#características-principales)
- [De dónde sale el texto y créditos](#de-dónde-sale-el-texto-y-créditos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución en Laragon](#instalación-y-ejecución-en-laragon)
- [Búsqueda y filtros](#búsqueda-y-filtros)
- [Notas, etiquetas y respaldos](#notas-etiquetas-y-respaldos)
- [Instalar como app (PWA)](#instalar-como-app-pwa)
- [Ambiente visual](#ambiente-visual)
- [Extender el proyecto](#extender-el-proyecto)
- [Aviso legal](#aviso-legal)

---

## Características principales

- **Lectura y navegación:** filtrado por libro, capítulo, versículo o testamento (Antiguo y Nuevo Testamento).
- **Búsqueda flexible:** por palabras clave, frases exactas, alternancia con `|` y referencias directas.
- **Estudio personal:** notas con categorías y orden personalizable, resaltados, etiquetas fusionables y marcalibros.
- **Respaldo y exportación:** copia de seguridad en `.json` (con importación aditiva) y exportación legible a `.md`.
- **Modo sin conexión (PWA):** almacena la Biblia en `IndexedDB` y los datos de usuario en `localStorage`.

---

## De dónde sale el texto y créditos

La aplicación obtiene el texto bíblico siguiendo este orden:

1. `public/es_rvr1960.json`, si lo colocas localmente para uso propio (queda excluido del repositorio mediante `.gitignore`).
2. Consulta una fuente externa configurada en `SOURCES` (`src/js/bible.js`), como el repositorio **`thiagobodruk/bible`** en GitHub, si no existe un archivo local.
3. Selección manual del archivo JSON desde la interfaz si ninguna fuente anterior está disponible.

### Créditos del dataset JSON
- **Fuente de datos bíblicos:** [Thiago Bodruk (`thiagobodruk/bible`)](https://github.com/thiagobodruk/bible) por la recopilación y estructuración de textos bíblicos en formato JSON.

Una vez cargado, el texto se guarda en `IndexedDB` para no volver a descargarlo. Las fuentes configuradas se encuentran en `SOURCES` dentro de `src/js/bible.js`.

---

## Estructura del proyecto

```text
index.html                  marcado principal de la página
src/
  main.js                   arranque: carga el texto y conecta los módulos
  style.css                 Tailwind CSS v4 + tokens de color, tipografía y estilos propios
  js/
    util.js                 helpers de DOM, normalización de texto, resaltado y avisos (toast)
    store.js                estado compartido (Biblia, etiquetas, notas y filtros)
    storage.js              localStorage (datos de usuario) e IndexedDB (texto bíblico)
    bible.js                lectura del JSON, referencias ("Juan 3:16") y resolución de filtros
    search.js               análisis de consultas de búsqueda (frases, "|", referencias)
    tags.js                 etiquetas: conteo, alta, baja, renombrar/unir y eliminar
    study.js                notas, resaltados, selección, marcalibros e historial reciente
    notes.js                orden, categorías y filtrado de notas (lógica de datos sin DOM)
    notesview.js            vista/modal "Lista de notas" (con reordenamiento mediante SortableJS)
    share.js                copiar y compartir versículos
    prefs.js                tamaño de fuente, ancho de columna y gestos de deslizar
    daily.js                versículo del día
    theme.js                gestión de tema claro / oscuro
    icons.js                iconografía de la interfaz
    render.js               renderizado de lista, resumen, selectores, aside y etiquetas
    events.js               eventos de búsqueda, filtros, clics y teclado
    backupdata.js           estructura de respaldo, importación aditiva y exportación a Markdown
    backup.js               panel de respaldo (controles y carga/descarga de archivos)
    pwa.js                  registro del service worker e instalación como app
    particles.js            partículas doradas en modo oscuro (tsParticles, carga diferida)
public/
  manifest.webmanifest       manifiesto de aplicación web progresiva (PWA)
  sw.js                     service worker
  icons/                    iconos de la app y apple-touch-icon
  images/                   recursos gráficos públicos (p. ej. imagen-esq.webp)