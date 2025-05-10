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
    alwaysOnTop: false,     // Alt+Tab support enabled
    skipTaskbar: false,     // Ensure window appears in taskbar
    focusable: true,        // Make it focusable for keyboard and Alt+Tab
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setResizable(false);

  // Toggle visibility with Ctrl+Shift+X or Cmd+Shift+X
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    mainWindow.webContents.send('toggle-visibility');
  });

  // Clear chat: Ctrl+R or Cmd+R
  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow.webContents.send('clear-chat');
  });

  // Handle resize events from renderer
  ipcMain.on('resize-window', (event, height) => {
    mainWindow.setSize(windowWidth, height);
  });

  // Visual feedback for focus state
  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1);
  });

  mainWindow.on('blur', () => {
    mainWindow.setOpacity(0.9); // Subtle dim when unfocused
  });

  // Optional: prevent close on `X`, hide instead
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
