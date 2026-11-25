// Iconos de trazo en estilo Lucide (https://lucide.dev, licencia ISC), incluidos directamente: no hay que instalar nada.
// Si más adelante prefieres el paquete: npm i lucide  (y reemplazar estas cadenas por sus iconos).

const ic = (inner) =>
  `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">${inner}</svg>`;

export const ICON_TAG = ic('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>');
export const ICON_BM = ic('<path d="M6 3h12v18l-6-4-6 4z"/>');
export const ICON_NOTE = ic('<path d="M5 3h14a2 2 0 0 1 2 2v9l-7 7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 21v-5a2 2 0 0 1 2-2h5"/>');
export const ICON_HL = ic('<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>');
export const ICON_COPY = ic('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');
export const ICON_SHARE = ic('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/>');
export const ICON_CHECK = ic('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>');
