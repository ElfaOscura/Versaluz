// Instalación como app y uso sin conexión.
// El service worker solo se registra en la versión compilada (npm run build) y en un contexto seguro:
// https:// o localhost. En http://algo.test (Laragon sin SSL) el navegador no lo permite.
import { $, toast } from './util.js';

let installEvent = null;

export function initPwa() {
  const btn = $('btnInstall');

  // Chrome, Edge y Android avisan cuando la app se puede instalar
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    btn.hidden = true;
    toast('App instalada');
  });
  btn.addEventListener('click', async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    btn.hidden = true;
  });

  if (!('serviceWorker' in navigator) || !window.isSecureContext || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          // Había una versión anterior controlando la página: hay que recargar para usar la nueva
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Hay una versión nueva. Recarga la página para usarla.');
          }
        });
      });
    }).catch(() => { /* sin service worker la app funciona igual, solo que sin modo sin conexión */ });
  });
}
