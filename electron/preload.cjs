const { contextBridge, ipcRenderer } = require('electron');

// Expose electron app API
contextBridge.exposeInMainWorld('electronRemote', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },
  dialog: {
    showMessageBoxSync: (options) => ipcRenderer.invoke('dialog:show-message-box-sync', options),
  },
});

// Expose WebSocket API for Browser.ts
contextBridge.exposeInMainWorld('wsModule', {
  onConnection: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('ws:connection', listener);
    return () => ipcRenderer.removeListener('ws:connection', listener);
  },
  onDisconnection: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('ws:disconnection', listener);
    return () => ipcRenderer.removeListener('ws:disconnection', listener);
  },
  getClientCount: () => ipcRenderer.invoke('ws:get-client-count'),
  sendToClients: (data) => ipcRenderer.send('ws:send-to-clients', data),
});

// Expose Discord API to renderer process
const discordApi = {
  // Methods that return promises
  login: (token) => ipcRenderer.invoke('discord:login', token),
  disconnect: () => ipcRenderer.invoke('discord:disconnect'),
  joinVoiceChannel: (channelId) => ipcRenderer.invoke('discord:join-voice-channel', channelId),
  leaveVoiceChannel: () => ipcRenderer.invoke('discord:leave-voice-channel'),
  getCurrentVoiceChannelMembers: () => ipcRenderer.invoke('discord:get-current-voice-channel-members'),
  getBotData: () => ipcRenderer.invoke('discord:get-bot-data'),
  getChannelName: (channelId) => ipcRenderer.invoke('discord:get-channel-name', channelId),
  getRoles: (guildId) => ipcRenderer.invoke('discord:get-roles', guildId),
  botHasRole: (roleId) => ipcRenderer.invoke('discord:bot-has-role', roleId),
  getAllVoiceChannels: () => ipcRenderer.invoke('discord:get-all-voice-channels'),
  getPeopleSpeaking: () => ipcRenderer.invoke('discord:get-people-speaking'),
  getIsLoggedIn: () => ipcRenderer.invoke('discord:get-is-logged-in'),
  
  // Send settings updates to main process
  updateSettings: (settings) => ipcRenderer.send('discord:update-settings', settings),
  updateRecordingState: (isRecording) => ipcRenderer.send('discord:update-recording-state', isRecording),
  updateOrderBottom: (orderBottom) => ipcRenderer.send('discord:update-order-bottom', orderBottom),
  
  // Respond to main process requests
  respondObsScenes: (scenes) => ipcRenderer.send('discord:respond-obs-scenes', scenes),
  respondSceneUuid: (data) => ipcRenderer.send('discord:respond-scene-uuid', data),
  
  // Event listeners (from main to renderer)
  onLoginStateChanged: (callback) => {
    const listener = (_event, isLoggedIn) => callback(isLoggedIn);
    ipcRenderer.on('discord:login-state-changed', listener);
    return () => ipcRenderer.removeListener('discord:login-state-changed', listener);
  },
  onVoiceChannelsChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('discord:voice-channels-changed', listener);
    return () => ipcRenderer.removeListener('discord:voice-channels-changed', listener);
  },
  onVoiceMembersChanged: (callback) => {
    const listener = (_event, members) => callback(members);
    ipcRenderer.on('discord:voice-members-changed', listener);
    return () => ipcRenderer.removeListener('discord:voice-members-changed', listener);
  },
  onVoiceActivity: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('discord:voice-activity', listener);
    return () => ipcRenderer.removeListener('discord:voice-activity', listener);
  },
  onRolesChanged: (callback) => {
    const listener = (_event, roles) => callback(roles);
    ipcRenderer.on('discord:roles-changed', listener);
    return () => ipcRenderer.removeListener('discord:roles-changed', listener);
  },
  
  // Requests from main process (for OBS integration)
  onRequestObsScenes: (callback) => {
    const listener = (_event, userValue) => callback(userValue);
    ipcRenderer.on('discord:request-obs-scenes', listener);
    return () => ipcRenderer.removeListener('discord:request-obs-scenes', listener);
  },
  onRequestSceneUuid: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('discord:request-scene-uuid', listener);
    return () => ipcRenderer.removeListener('discord:request-scene-uuid', listener);
  },
  onCommandStartRecording: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('discord:command-start-recording', listener);
    return () => ipcRenderer.removeListener('discord:command-start-recording', listener);
  },
  onCommandStopRecording: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('discord:command-stop-recording', listener);
    return () => ipcRenderer.removeListener('discord:command-stop-recording', listener);
  },
  onCommandChangeScene: (callback) => {
    const listener = (_event, sceneUuid) => callback(sceneUuid);
    ipcRenderer.on('discord:command-change-scene', listener);
    return () => ipcRenderer.removeListener('discord:command-change-scene', listener);
  },
};

contextBridge.exposeInMainWorld('discordAPI', discordApi);