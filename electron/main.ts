import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron' // Adicionado ipcMain
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL 
  ? path.join(process.env.APP_ROOT, 'public') 
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  // Alterado para 'dark' para combinar com seu layout
  nativeTheme.themeSource = 'dark' 

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b' ,
      symbolColor: '#71717a',
      height: 35
      },
    icon: path.join(process.env.VITE_PUBLIC, 'logo_app_cocite.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // --- COMANDOS DA JANELA (Para seus botões customizados) ---
  ipcMain.on('window-controls:close', () => {
    win?.close()
  })

  ipcMain.on('window-controls:minimize', () => {
    win?.minimize()
  })

  ipcMain.on('window-controls:maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)