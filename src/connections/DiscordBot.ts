import { get, writable } from "svelte/store";
import { appSettings } from "../stores/settings";
import obsConnector from "./OBS";

// Type definition for Discord API from preload
declare global {
  interface Window {
    discordAPI: {
      login: (token: string) => Promise<{ success: boolean; error?: string }>;
      disconnect: () => Promise<{ success: boolean; error?: string }>;
      joinVoiceChannel: (channelId: string) => Promise<{ success: boolean; error?: string }>;
      leaveVoiceChannel: () => Promise<{ success: boolean }>;
      getCurrentVoiceChannelMembers: () => Promise<Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>>;
      getBotData: () => Promise<{ name: string, iconUrl: string }>;
      getChannelName: (channelId: string) => Promise<string>;
      getRoles: (guildId?: string) => Promise<Array<{ id: string, name: string, color: string }>>;
      botHasRole: (roleId: string) => Promise<boolean>;
      getAllVoiceChannels: () => Promise<Array<{ guildId: string, guildName: string, guildIconUrl: string, channelName: string, channelId: string }>>;
      getPeopleSpeaking: () => Promise<Record<string, boolean>>;
      getIsLoggedIn: () => Promise<boolean>;
      updateSettings: (settings: unknown) => void;
      updateRecordingState: (isRecording: boolean) => void;
      updateOrderBottom: (orderBottom: boolean) => void;
      respondObsScenes: (scenes: Array<{ name: string, uuid: string }>) => void;
      respondSceneUuid: (data: { sceneUuid?: string, targetSceneName: string, interactionId: string }) => void;
      onLoginStateChanged: (callback: (isLoggedIn: boolean) => void) => () => void;
      onVoiceChannelsChanged: (callback: () => void) => () => void;
      onVoiceMembersChanged: (callback: (members: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>) => void) => () => void;
      onVoiceActivity: (callback: (data: { isSomeoneSpeaking: boolean, peopleSpeaking: Record<string, boolean> }) => void) => () => void;
      onRolesChanged: (callback: (roles: Array<{ id: string, name: string, color: string }>) => void) => () => void;
      onRequestObsScenes: (callback: (userValue: string) => void) => () => void;
      onRequestSceneUuid: (callback: (data: { sceneName: string, interactionId: string }) => void) => () => void;
      onCommandStartRecording: (callback: () => void) => () => void;
      onCommandStopRecording: (callback: () => void) => () => void;
      onCommandChangeScene: (callback: (sceneUuid: string) => void) => () => void;
    };
  }
}

export class DiscordBot {
  isLoggedIn = writable(false);
  peopleSpeaking: Record<string, boolean> = {};

  // Cached data for sync access
  private cachedBotData: { name: string, iconUrl: string } = { name: "Unknown", iconUrl: "" };
  private cachedChannelNames: Map<string, string> = new Map();
  private cachedVoiceChannels: Array<{ guildId: string, guildName: string, guildIconUrl: string, channelName: string, channelId: string }> = [];
  private cachedVoiceMembers: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }> = [];

  private readonly eventListeners = {
    'onLogin': [] as Array<() => void>,
    'onVoiceChannelsChange': [] as Array<() => void>,
    'onVoiceChannelsMembersChange': [] as Array<(members: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>) => void>,
    'onVoiceChannelsVoiceActivity': [] as Array<(isSomeoneSpeaking: boolean) => void>,
    'onRolesChange': [] as Array<(roles: Array<{ id: string, name: string, color: string }>) => void>,
  }

  private cleanupFunctions: Array<() => void> = [];

  constructor() {
    // Set up IPC event listeners
    this.setupIpcListeners();

    // Sync OBS recording state to main process
    obsConnector.isRecording.subscribe((isRecording) => {
      if (window.discordAPI) {
        window.discordAPI.updateRecordingState(isRecording);
      }
    });

    // Sync orderBottom setting to main process
    appSettings.subscribe((value) => {
      if (window.discordAPI) {
        window.discordAPI.updateSettings(value);
        window.discordAPI.updateOrderBottom(value.orderBottom);
      }
    });
  }

  private async updateCachedData() {
    if (!window.discordAPI) return;

    // Update bot data
    this.cachedBotData = await window.discordAPI.getBotData();

    // Update voice channels
    this.cachedVoiceChannels = await window.discordAPI.getAllVoiceChannels();

    // Update voice members
    this.cachedVoiceMembers = await window.discordAPI.getCurrentVoiceChannelMembers();
  }

  private setupIpcListeners() {
    if (!window.discordAPI) {
      console.warn('Discord API not available - running without IPC');
      return;
    }

    // Login state changes
    const removeLoginListener = window.discordAPI.onLoginStateChanged(async (isLoggedIn) => {
      this.isLoggedIn.set(isLoggedIn);
      if (isLoggedIn) {
        await this.updateCachedData();
        this.eventListeners.onLogin.forEach((callback) => { callback(); });
      } else {
        // Clear cache on logout
        this.cachedBotData = { name: "Unknown", iconUrl: "" };
        this.cachedChannelNames.clear();
        this.cachedVoiceChannels = [];
        this.cachedVoiceMembers = [];
      }
    });
    this.cleanupFunctions.push(removeLoginListener);

    // Voice channels changed
    const removeVoiceChannelsListener = window.discordAPI.onVoiceChannelsChanged(async () => {
      this.cachedVoiceChannels = await window.discordAPI.getAllVoiceChannels();
      this.eventListeners.onVoiceChannelsChange.forEach((callback) => { callback(); });
    });
    this.cleanupFunctions.push(removeVoiceChannelsListener);

    // Voice members changed
    const removeVoiceMembersListener = window.discordAPI.onVoiceMembersChanged((members) => {
      this.cachedVoiceMembers = members;
      this.eventListeners.onVoiceChannelsMembersChange.forEach((callback) => { callback(members); });
    });
    this.cleanupFunctions.push(removeVoiceMembersListener);

    // Voice activity
    const removeVoiceActivityListener = window.discordAPI.onVoiceActivity((data) => {
      this.peopleSpeaking = data.peopleSpeaking;
      this.eventListeners.onVoiceChannelsVoiceActivity.forEach((callback) => { callback(data.isSomeoneSpeaking); });
    });
    this.cleanupFunctions.push(removeVoiceActivityListener);

    // Roles changed
    const removeRolesListener = window.discordAPI.onRolesChanged((roles) => {
      this.eventListeners.onRolesChange.forEach((callback) => { callback(roles); });
    });
    this.cleanupFunctions.push(removeRolesListener);

    // OBS scenes request (for autocomplete)
    const removeObsScenesListener = window.discordAPI.onRequestObsScenes((userValue) => {
      const matchingScenes = get(obsConnector.scenes).filter((scene) => {
        return scene.name.toLowerCase().includes(userValue.toLowerCase())
      });
      window.discordAPI.respondObsScenes(matchingScenes);
    });
    this.cleanupFunctions.push(removeObsScenesListener);

    // Scene UUID request (for custom scene command)
    const removeSceneUuidListener = window.discordAPI.onRequestSceneUuid((data) => {
      const scene = get(obsConnector.scenes).find((scene) => scene.name === data.sceneName);
      window.discordAPI.respondSceneUuid({
        sceneUuid: scene?.uuid,
        targetSceneName: `scene named \`${data.sceneName}\``,
        interactionId: data.interactionId
      });
    });
    this.cleanupFunctions.push(removeSceneUuidListener);

    // Command handlers from Discord slash commands
    const removeStartRecordingListener = window.discordAPI.onCommandStartRecording(() => {
      obsConnector.startRecording();
    });
    this.cleanupFunctions.push(removeStartRecordingListener);

    const removeStopRecordingListener = window.discordAPI.onCommandStopRecording(() => {
      obsConnector.stopRecording(true);
    });
    this.cleanupFunctions.push(removeStopRecordingListener);

    const removeChangeSceneListener = window.discordAPI.onCommandChangeScene((sceneUuid) => {
      obsConnector.changeScene(sceneUuid);
    });
    this.cleanupFunctions.push(removeChangeSceneListener);
  }

  async login(token: string) {
    if (!window.discordAPI) {
      throw new Error('Discord API not available');
    }
    const result = await window.discordAPI.login(token);
    if (!result.success) {
      throw new Error(result.error || 'Login failed');
    }
    // Sync current settings to main process
    window.discordAPI.updateSettings(get(appSettings));
  }

  async disconnect() {
    if (!window.discordAPI) {
      return;
    }
    try {
      await window.discordAPI.disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async joinVoicechannel(channelId: string) {
    if (!window.discordAPI) {
      throw new Error('Discord API not available');
    }
    const result = await window.discordAPI.joinVoiceChannel(channelId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to join voice channel');
    }
    // Update cached members after joining
    await this.updateCachedData();
  }

  leaveVoiceChannel() {
    if (!window.discordAPI) {
      return;
    }
    window.discordAPI.leaveVoiceChannel();
    this.cachedVoiceMembers = [];
  }

  getCurrentVoiceChannelMembers(): Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }> {
    return this.cachedVoiceMembers;
  }

  getBotData() {
    return this.cachedBotData;
  }

  getChannelName(channelId: string) {
    if (!channelId || !window.discordAPI) {
      return '';
    }
    
    // Check cache first
    if (this.cachedChannelNames.has(channelId)) {
      const cachedName = this.cachedChannelNames.get(channelId);
      if (cachedName) return cachedName;
    }

    // Fetch async and cache
    window.discordAPI.getChannelName(channelId).then(name => {
      this.cachedChannelNames.set(channelId, name);
    });

    // Return from cachedVoiceChannels if available
    const channel = this.cachedVoiceChannels.find(ch => ch.channelId === channelId);
    return channel?.channelName || '';
  }

  onLogin(callback: () => void) {
    if (get(this.isLoggedIn)) {
      callback();
      return;
    }
    this.eventListeners.onLogin.push(callback);
  }

  onVoiceChannelsChange(callback: () => void) {
    this.eventListeners.onVoiceChannelsChange.push(callback);
  }

  onVoiceActivity(callback: (isSomeoneSpeaking: boolean) => void) {
    this.eventListeners.onVoiceChannelsVoiceActivity.push(callback);
  }

  onVoiceMembersChange(callback: (members: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>) => void) {
    this.eventListeners.onVoiceChannelsMembersChange.push(callback);
  }

  onRolechanged(callback: (roles: Array<{ id: string, name: string, color: string }>) => void) {
    this.eventListeners.onRolesChange.push(callback);
  }

  async getRoles(guildId?: string): Promise<Array<{ id: string, name: string, color: string }>> {
    if (!window.discordAPI) {
      return [];
    }
    return await window.discordAPI.getRoles(guildId);
  }

  async botHasRole(roleId: string): Promise<boolean> {
    if (!window.discordAPI) {
      return false;
    }
    return await window.discordAPI.botHasRole(roleId);
  }

  getAllVoiceChannels(): Array<{
    guildId: string,
    guildName: string,
    guildIconUrl: string,
    channelName: string,
    channelId: string
  }> {
    return this.cachedVoiceChannels;
  }

  cleanup() {
    this.cleanupFunctions.forEach(fn => { fn(); });
    this.cleanupFunctions = [];
  }
}

const discordBot = new DiscordBot();

export default discordBot;
