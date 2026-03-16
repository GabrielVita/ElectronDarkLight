import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import tailwindcss from '@tailwindcss/vite'

// 1. Tente importar o renderer se ele estiver instalado (vimos no seu package.json que ele estava lá)
// import renderer from 'vite-plugin-electron-renderer' 

export default defineConfig({
  base: './', // Adicione esta linha
  plugins: [
    tailwindcss(),
    react(),
    electron({
      main: {
        // Certifique-size que a pasta electron está na raiz
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false, // Opcional: facilita o debug se der erro no build
          },
        },
      },
      preload: {
        // Usamos path.join para garantir que o caminho seja absoluto
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    }),
    // renderer(), // Se o erro 404 persistir, ative este plugin
  ],
  // 2. Adicione esta configuração de build para o frontend
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // 3. Garanta que o servidor comece na porta padrão que o Electron espera
  server: {
    host: '127.0.0.1', // Forçar o host local
    port: 5173,
  }
})