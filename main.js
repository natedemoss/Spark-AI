const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

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