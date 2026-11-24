import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function excludeDistFiles(files = []) {
  return {
    name: 'exclude-dist-files',
    closeBundle() {
      for (const relPath of files) {
        const target = path.resolve(__dirname, 'dist', relPath);
        if (fs.existsSync(target)) {
          fs.rmSync(target, { recursive: true, force: true });
        }
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : './',
  plugins: [
    tailwindcss(),
    excludeDistFiles(['es_rvr1960.json']),
  ],
}));