// Modules to control application life and create native browser window
const { log } = require('console')
const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const http = require('http');
const fs = require('fs');
const remoteModule = require('@electron/remote/main')
const DiscordHandler = require('./discord-handler.cjs');
const WebSocketHandler = require('./websocket-handler.cjs');

remoteModule.initialize()


if (require('electron-squirrel-startup')) app.quit();

const isDevEnvironment = process.env.DEV_ENV === 'true'

// enable live reload for electron in dev mode
if (isDevEnvironment) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;
let discordHandler;
let websocketHandler;

const createWindow = () => {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 775,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  // Initialize Discord handler
  discordHandler = new DiscordHandler(mainWindow);
  
  // Initialize WebSocket handler
  websocketHandler = new WebSocketHandler(mainWindow);

  remoteModule.enable(mainWindow.webContents)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // define how electron will load the app
  if (isDevEnvironment) {

    // if your vite app is running on a different port, change it here
    mainWindow.loadURL('http://localhost:5173/');

    // Open the DevTools.
    mainWindow.webContents.on("did-frame-finish-load", () => {
      mainWindow.webContents.openDevTools();
    });

    log('Electron running in dev mode: 🧪')

  } else {

    // when not in dev mode, load the build file instead
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));

    log('Electron running in prod mode: 🚀')
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') app.quit()
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  if (req.url === '/presscorp-stream-controller.user.js') {
    console.log(path.join(__dirname, 'public', 'presscorp-stream-controller.user.js'));
    res.end(fs.readFileSync(path.join(__dirname, '..', 'public', 'presscorp-stream-controller.user.js'), 'utf8'));
  }
});

httpServer.listen(4445);

// Discord IPC Handlers
ipcMain.handle('discord:login', async (_event, token) => {
  return await discordHandler.login(token);
});

ipcMain.handle('discord:disconnect', async () => {
  return await discordHandler.disconnect();
});

ipcMain.handle('discord:join-voice-channel', async (_event, channelId) => {
  return await discordHandler.joinVoiceChannel(channelId);
});

ipcMain.handle('discord:leave-voice-channel', () => {
  return discordHandler.leaveVoiceChannel();
});

ipcMain.handle('discord:get-current-voice-channel-members', () => {
  return discordHandler.getCurrentVoiceChannelMembers();
});

ipcMain.handle('discord:get-bot-data', () => {
  return discordHandler.getBotData();
});

ipcMain.handle('discord:get-channel-name', (_event, channelId) => {
  return discordHandler.getChannelName(channelId);
});

ipcMain.handle('discord:get-roles', async (_event, guildId) => {
  return await discordHandler.getRoles(guildId);
});

ipcMain.handle('discord:bot-has-role', async (_event, roleId) => {
  return await discordHandler.botHasRole(roleId);
});

ipcMain.handle('discord:get-all-voice-channels', () => {
  return discordHandler.getAllVoiceChannels();
});

ipcMain.handle('discord:get-people-speaking', () => {
  return discordHandler.getPeopleSpeaking();
});

ipcMain.handle('discord:get-is-logged-in', () => {
  return discordHandler.getIsLoggedIn();
});

// Settings updates from renderer
ipcMain.on('discord:update-settings', (_event, settings) => {
  discordHandler.updateSettings(settings);
});

ipcMain.on('discord:update-recording-state', (_event, isRecording) => {
  discordHandler.handleRecordingStateChange(isRecording);
});

ipcMain.on('discord:update-order-bottom', (_event, orderBottom) => {
  discordHandler.handleOrderBottomChange(orderBottom);
});

// Responses from renderer for OBS integration
ipcMain.on('discord:respond-obs-scenes', (_event, _scenes) => {
  // Store scenes or handle autocomplete
  // This would need more implementation depending on how you want to handle it
});

ipcMain.on('discord:respond-scene-uuid', (_event, data) => {
  discordHandler.handleSceneChangeWithUuid(data);
});

// App IPC Handlers
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

// Dialog IPC Handlers
ipcMain.handle('dialog:show-message-box-sync', (_event, options) => {
  return dialog.showMessageBoxSync(mainWindow, options);
});

// WebSocket IPC Handlers
ipcMain.handle('ws:get-client-count', () => {
  return websocketHandler.getClientCount();
});

ipcMain.on('ws:send-to-clients', (_event, data) => {
  websocketHandler.sendToClientsAndWaitForResponse(data);
});