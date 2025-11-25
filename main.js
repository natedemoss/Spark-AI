const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Load .env into process.env from either resourcesPath (when packaged) or project root (dev).
try {
  // prefer dotenv from node_modules; if missing, skip silently
  const dotenv = require('dotenv');
  const packagedEnv = path.join(process.resourcesPath || __dirname, '.env');
  const localEnv = path.join(__dirname, '.env');
  const envPath = fs.existsSync(packagedEnv) ? packagedEnv : (fs.existsSync(localEnv) ? localEnv : null);
  if (envPath) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env from', envPath);
  } else {
    console.log('.env not found in resources or project root');
  }
} catch (e) {
  console.debug('dotenv not available in main process:', e && e.message);
}

// Diagnostic: write small env debug file to userData so we can inspect packaged runtime env
try {
  const ud = app.getPath && app.getPath('userData') ? app.getPath('userData') : path.join(__dirname, 'user-data');
  const debugPath = path.join(ud, 'env-debug.txt');
  const keyPresent = !!process.env.GROQ_API_KEY;
  const keyPreview = process.env.GROQ_API_KEY ? `${process.env.GROQ_API_KEY.substring(0,6)}...` : 'MISSING';
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(debugPath, `GROQ_API_KEY_PRESENT=${keyPresent}\nPREVIEW=${keyPreview}\nresourcesPath=${process.resourcesPath || ''}\nuserData=${ud}\n`, { encoding: 'utf8' });
  console.log('Wrote env diagnostic to', debugPath);
} catch (e) {
  console.warn('Could not write env diagnostic:', e && e.message);
}
// Ensure Electron uses a writable userData directory inside the project to avoid
// Windows cache permission errors when running from unusual locations.
try {
  const userDataPath = path.join(__dirname, 'user-data');
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
  app.setPath('userData', userDataPath);
  console.log('Set Electron userData to', userDataPath);
} catch (e) {
  console.warn('Could not set custom userData path:', e && e.message);
}

let mainWindow;

function createWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 800;
  const xPosition = Math.floor((width - windowWidth) / 2);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: 50,
    x: xPosition,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setResizable(false);

  globalShortcut.register('CommandOrControl+Shift+X', () => {
    console.log('Toggling visibility with Ctrl+Shift+X');
    mainWindow.webContents.send('toggle-visibility');
  });

  globalShortcut.register('CommandOrControl+R', () => {
    console.log('Clearing chat with Ctrl+R');
    mainWindow.webContents.send('clear-chat');
  });

  // Register Ctrl + Arrow keys for window movement
  globalShortcut.register('CommandOrControl+Up', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - 10);
    console.log('Moving window up');
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + 10);
    console.log('Moving window down');
  });

  globalShortcut.register('CommandOrControl+Left', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - 10, y);
    console.log('Moving window left');
  });

  globalShortcut.register('CommandOrControl+Right', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + 10, y);
    console.log('Moving window right');
  });

  ipcMain.on('resize-window', (event, height) => {
    console.log(`Resizing window to height: ${height}`);
    mainWindow.setSize(windowWidth, height);
  });

  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1);
  });

  mainWindow.on('blur', () => {
    mainWindow.setOpacity(0.9);
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});