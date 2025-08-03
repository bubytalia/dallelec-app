import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Use an array of alias definitions rather than a simple object. This syntax
    // makes it easier to provide multiple alias entries and avoids subtle errors
    // when comments or missing commas break the JSON-like object notation. Each
    // alias has a `find` (the module name) and a `replacement` (the path to
    // resolve to). The first alias maps `@` to the `src` directory. The second
    // alias forces imports of `jspdf` to use the UMD build, which exposes a
    // default export. Without this, html2pdf.js will try to import the ES
    // version of jsPDF, which no longer has a default export and causes an
    // error【880506289190762†L205-L207】.
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      // Nota: il wrapper `src/jspdf.js` non è più necessario perché non
      // utilizziamo più html2pdf.js. Rimuoviamo quindi l'alias per `jspdf` e
      // lasciamo che Vite risolva automaticamente il pacchetto `jspdf`
      // installato in node_modules.
    ],
  },
})
