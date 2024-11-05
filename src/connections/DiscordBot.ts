import { VoiceConnection, type DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { type Client, type VoiceBasedChannel } from "discord.js";
const Discord = require("discord.js") as typeof import("discord.js");
const DiscordVoice = require("@discordjs/voice") as typeof import("@discordjs/voice");

export class DiscordBot {
  private readonly client: Client;
  isLoggedIn: boolean = false;

  voiceConnection: VoiceConnection | null = null;
  peopleSpeaking: Record<string, boolean> = {};

  waitForLoggedIn: Promise<void> = new Promise(() => { });
  private loggedInResolver: () => void = () => { };

  private readonly eventListeners = {
    'onLogin': [] as Array<() => void>,
    'onVoiceChannelsChange': [] as Array<() => void>,
    'onVoiceChannelsMembersChange': [] as Array<(members: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>) => void>,
    'onVoiceChannelsVoiceActivity': [] as Array<(isSomeoneSpeaking: boolean) => void>,
    'onRolesChange': [] as Array<(roles: Array<{ id: string, name: string, color: string }>) => void>,
  }

  constructor() {
    this.client = new Discord.Client({
      intents: [
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.Guilds,
      ],
    });

    this.client.on("channelUpdate", async (channel) => {
      if (channel.isVoiceBased()) {
        this.eventListeners.onVoiceChannelsChange.forEach((callback) => callback());
      }
    });

    this.client.on("channelCreate", async (channel) => {
      if (channel.isVoiceBased()) {
        this.eventListeners.onVoiceChannelsChange.forEach((callback) => callback());
      }
    });

    this.client.on("channelDelete", async (channel) => {
      if (channel.isVoiceBased()) {
        this.eventListeners.onVoiceChannelsChange.forEach((callback) => callback());
      }
    });

    this.client.on("roleCreate", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.eventListeners.onRolesChange.forEach((callback) => callback(roles));
    });

    this.client.on("roleDelete", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.eventListeners.onRolesChange.forEach((callback) => callback(roles));
    });

    this.client.on("roleUpdate", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.eventListeners.onRolesChange.forEach((callback) => callback(roles));
    });

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      let channelWithBot: VoiceBasedChannel | null = null;
      if (oldState.channel?.members.get(this.client.user?.id)) {
        channelWithBot = oldState.channel;
      }
      if (newState.channel?.members.get(this.client.user?.id)) {
        channelWithBot = newState.channel;
      }
      if (channelWithBot) {

        if (oldState.channel === newState.channel) {
          oldState.channel.members.forEach((member) => {
            if (!newState.channel.members.get(member.id)) {
              delete this.peopleSpeaking[member.id]
            }
          });

          newState.channel.members.forEach((member) => {
            if (!oldState.channel.members.get(member.id)) {
              if (Object.hasOwn(this.peopleSpeaking, member.id)) {
                this.peopleSpeaking[member.id] = false;
              }
            }
          });
        }

        this.eventListeners.onVoiceChannelsMembersChange.forEach((callback) => callback(
          channelWithBot.members.map((member) => ({
            id: member.id,
            name: member.displayName ?? member.user.username,
            isMuted: member.voice.selfMute,
            isStreaming: member.voice.streaming,
            iconUrl: member.user.displayAvatarURL(),
            roles: [...member.roles.cache.keys()],
          }))
        ));
      }
    })
  }

  async login (token: string) {
    this.waitForLoggedIn = new Promise((resolve) => {
      this.loggedInResolver = resolve;
    });
    await this.client.login(token);
    await Promise.all([...(await this.client.guilds.fetch()).mapValues((guild) => guild.fetch()).values()]);
    this.isLoggedIn = true;
    this.loggedInResolver();
    this.eventListeners.onLogin.forEach((callback) => callback());
  }

  disconnect () {
    return this.client.destroy();
  }

  joinVoicechannel (channelId: string) {
    const channel = this.client.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased() || channel.isDMBased()) {
      return;
    }

    this.voiceConnection = DiscordVoice.joinVoiceChannel({
      channelId,
      selfDeaf: false,
      selfMute: true,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
    });

    this.peopleSpeaking = {};

    this.voiceConnection.receiver.speaking.on('start', (userId) => {
      this.peopleSpeaking[userId] = true;
      this.eventListeners.onVoiceChannelsVoiceActivity.forEach((callback) => callback(true));
    });

    this.voiceConnection.receiver.speaking.on('end', (userId) => {
      this.peopleSpeaking[userId] = false;
      this.eventListeners.onVoiceChannelsVoiceActivity.forEach((callback) => callback(Object.values(this.peopleSpeaking).some((isSpeaking) => isSpeaking)));
    });
  }

  leaveVoiceChannel () {
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }
  }

  getCurrentVoiceChannelMembers (): Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }> {
    if (!this.voiceConnection) {
      return [];
    }
    const channelWithBot = this.client.channels.cache.get(this.voiceConnection.joinConfig.channelId);
    if (!channelWithBot?.isVoiceBased()) {
      return [];
    }
    return channelWithBot.members.map((member) => ({
      id: member.id,
      name: member.displayName ?? member.user.username,
      isMuted: member.voice.selfMute,
      isStreaming: member.voice.streaming,
      iconUrl: member.user.displayAvatarURL(),
      roles: [...member.roles.cache.keys()],
    }))
  }

  getBotData () {
    if (!this.isLoggedIn) {
      return {
        name: "Unknown",
        iconUrl: "",
      }
    }
    return {
      name: this.client.user?.username,
      iconUrl: this.client.user?.displayAvatarURL(),
    }
  }

  getChannelName (channelId: string) {
    if (!channelId) {
      return ''
    }
    const channel = this.client.channels.cache.get(channelId);
    if (channel.isDMBased()) {
      return 'Direct Message';
    }
    return channel.name;
  }

  onLogin (callback: () => void) {
    if (this.isLoggedIn) {
      callback();
      return;
    }
    this.eventListeners.onLogin.push(callback);
  }

  onVoiceChannelsChange (callback: (channels: ReturnType<DiscordBot['getAllVoiceChannels']>) => void) {
    this.eventListeners.onVoiceChannelsChange.push(() => callback(this.getAllVoiceChannels()));
  }

  onVoiceActivity (callback: (isSomeoneSpeaking: boolean) => void) {
    this.eventListeners.onVoiceChannelsVoiceActivity.push(callback);
  }

  onVoiceMembersChange (callback: (members: Array<{ id: string, name: string, iconUrl: string, isMuted: boolean, isStreaming: boolean, roles: Array<string> }>) => void) {
    this.eventListeners.onVoiceChannelsMembersChange.push(callback);
  }

  onRolechanged (callback: (roles: Array<{ id: string, name: string, color: string }>) => void) {
    this.eventListeners.onRolesChange.push(callback);
  }

  async getRoles (guildId?: string): Promise<Array<{ id: string, name: string, color: string }>> {
    await this.waitForLoggedIn;
    const guild = this.client.guilds.cache.get(guildId || this.voiceConnection.joinConfig.guildId)

    if (!guild) {
      return Promise.resolve([]);
    }

    const roles = await guild.roles.fetch();
    return [...roles.values()].map((role) => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
    }));
  }

  async botHasRole (roleId: string): Promise<boolean> {
    await this.waitForLoggedIn;
    const guild = this.client.guilds.cache.get(this.voiceConnection?.joinConfig.guildId || '');
    if (!guild) {
      return false;
    }

    const role = guild.roles.cache.get(roleId);
    if (!role) {
      return false;
    }

    return guild.members.me?.roles.cache.has(role.id) || false;
  }

  getAllVoiceChannels (): Array<{
    guildId: string,
    guildName: string,
    guildIconUrl: string,
    channelName: string,
    channelId: string
  }> {
    const channels = [...this.client.guilds.cache.map((guild) => {
      return [...guild.channels.cache.filter((channel) => channel.isVoiceBased()).values()];
    }).values()].flat();

    return channels.map((channel) => {
      return {
        guildId: channel.guild.id,
        guildName: channel.guild.name,
        guildIconUrl: channel.guild.iconURL(),
        channelName: channel.name,
        channelId: channel.id,
      };
    });
  }
}

const discordBot = new DiscordBot();

export default discordBot;
