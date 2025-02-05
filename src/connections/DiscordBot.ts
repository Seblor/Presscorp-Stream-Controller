import { VoiceConnection, type DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { CommandInteraction, type Client, type GuildBasedChannel, type VoiceBasedChannel } from "discord.js";
import { get, writable } from "svelte/store";
import { appSettings } from "../stores/settings";
import obsConnector from "./OBS";
const Discord = require("discord.js") as typeof import("discord.js");
const DiscordVoice = require("@discordjs/voice") as typeof import("@discordjs/voice");

const ON_AIR_PREFIX = {
  normal: '[ON AIR] ',
  bottom: '【ON AIR】',
}

const SLASH_COMMANDS = {
  startRecording: {
    id: 'start-recording',
  },
  stopRecording: {
    id: 'stop-recording',
  },
  changeScene: {
    id: 'change-scene',
    subcommand: {
      scene: {
        id: 'scene',
        values: {
          default: {
            name: 'default',
          },
          audio: {
            name: 'audio',
          },
          video: {
            name: 'video',
          },
          custom: {
            name: 'custom',
            options: {
              scene: 'scene',
            },
          },
        }
      }
    },
  },
}

export class DiscordBot {
  private readonly client: Client;
  isLoggedIn = writable(false);

  voiceConnection: VoiceConnection | null = null;
  peopleSpeaking: Record<string, boolean> = {};

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

    obsConnector.isRecording.subscribe((isRecording) => {
      if (!get(this.isLoggedIn)) {
        return;
      }
      const guild = this.client.guilds.cache.get((this.client.channels.cache.get(get(appSettings).selectedChannelId) as GuildBasedChannel)?.guildId || '')
      if (isRecording) {
        guild.members.me?.setNickname(`${get(appSettings).orderBottom ? ON_AIR_PREFIX.bottom : ON_AIR_PREFIX.normal}${this.client.user?.username}`);
      } else {
        guild.members.me?.setNickname(this.client.user?.username);
      }
    });

    // Dynamically change prefix version if the other is applied
    appSettings.subscribe((value) => {
      const guild = this.client.guilds.cache.get((this.client.channels.cache.get(get(appSettings).selectedChannelId) as GuildBasedChannel)?.guildId || '')
      if (!guild) {
        return;
      }
      if (value.orderBottom && guild.members.me?.nickname?.startsWith(ON_AIR_PREFIX.normal)) {
        guild.members.me?.setNickname(`${ON_AIR_PREFIX.bottom}${this.client.user?.username}`);
      } else if (!value.orderBottom && guild.members.me?.nickname?.startsWith(ON_AIR_PREFIX.bottom)) {
        guild.members.me?.setNickname(`${ON_AIR_PREFIX.normal}${this.client.user?.username}`);
      }
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (
        interaction.isAutocomplete()
        && interaction.commandName === SLASH_COMMANDS.changeScene.id
        && interaction.options.getSubcommand() === SLASH_COMMANDS.changeScene.subcommand.scene.values.custom.name
      ) {
        const userValue = interaction.options.getFocused();
        const matchingScenes = get(obsConnector.scenes).filter((scene) => {
          return scene.name.toLowerCase().includes(userValue.toLowerCase())
        });

        interaction.respond(matchingScenes.map((scene) => ({
          name: scene.name,
          value: scene.name,
        })));
      }
      if (!interaction.isCommand()) {
        return;
      }

      const guild = this.client.guilds.cache.get((this.client.channels.cache.get(get(appSettings).selectedChannelId) as GuildBasedChannel)?.guildId || '')

      if (!guild || interaction.guildId !== guild.id) {
        return;
      }

      const userRoles = Array.isArray(interaction.member.roles) ? interaction.member.roles : [...interaction.member.roles.cache.keys()];

      if (userRoles.includes(get(appSettings).casterRole) === false) {
        return interaction.reply({
          content: 'You do not have the permissions to use this command',
          ephemeral: true,
        });
      }

      switch (interaction.commandName) {
        case SLASH_COMMANDS.startRecording.id:
          interaction.reply('Recording started');
          break;

        case SLASH_COMMANDS.stopRecording.id:
          interaction.reply('Recording stopped');
          break;

        case SLASH_COMMANDS.changeScene.id:
          this.handleSceneChangeCommand(interaction);
          break;

        default:
          break;
      }

      if (interaction.commandName === 'start-recording') {
        obsConnector.startRecording();
        interaction.reply('Recording started');
      }

      if (interaction.commandName === 'stop-recording') {
        obsConnector.stopRecording(true);
        interaction.reply('Recording stopped');
      }
    });

    this.client.on("guildMemberUpdate", async (user) => {
      if (user.voice.channel?.members.get(this.client.user?.id)) {
        this.eventListeners.onVoiceChannelsMembersChange.forEach((callback) => callback(
          user.voice.channel.members.map((member) => ({
            id: member.id,
            name: member.displayName ?? member.user.username,
            isMuted: member.voice.selfMute,
            isStreaming: member.voice.streaming,
            iconUrl: member.user.displayAvatarURL(),
            roles: [...member.roles.cache.keys()],
          }))
        ));
      }
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

  handleSceneChangeCommand (inter: CommandInteraction) {
    if (!inter.isChatInputCommand() || inter.commandName !== SLASH_COMMANDS.changeScene.id) {
      return;
    }

    const chosenScene = inter.options.getSubcommand() as keyof typeof SLASH_COMMANDS.changeScene.subcommand.scene.values;

    const peopleInVoiceChannel = this.getCurrentVoiceChannelMembers();

    const doesSceneRequireStreamingMember = chosenScene === 'audio' || chosenScene === 'video'
    if (doesSceneRequireStreamingMember && !peopleInVoiceChannel.some((person) => person.isStreaming)) {
      return inter.reply('No one is streaming');
    }

    let sceneToChangeTo: string | undefined;
    let targetSceneName: string;
    switch (chosenScene) {
      case 'audio':
        sceneToChangeTo = get(appSettings).memberStreamAudioSceneUuid;
        targetSceneName = 'configured audio scene';
        break;

      case 'video':
        sceneToChangeTo = get(appSettings).memberStreamVideoSceneUuid;
        targetSceneName = 'configured video scene';
        break;

      case 'default':
        sceneToChangeTo = get(appSettings).defaultSceneUuid;
        targetSceneName = 'configured default scene';
        break;
      case 'custom':
        sceneToChangeTo = get(obsConnector.scenes).find((scene) => scene.name === inter.options.getString(SLASH_COMMANDS.changeScene.subcommand.scene.id))?.uuid ?? undefined;
        targetSceneName = `scene named \`${inter.options.getString(SLASH_COMMANDS.changeScene.subcommand.scene.id)}\``;
        break;

      default:
        return inter.reply('Invalid command');
    }

    if (!sceneToChangeTo) {
      return inter.reply(`Could not find ${targetSceneName}`);
    }

    inter.reply(`Scene changed to ${targetSceneName}`);

    return obsConnector.changeScene(sceneToChangeTo);
  }

  async login (token: string) {
    await this.client.login(token);
    await Promise.all([...(await this.client.guilds.fetch()).mapValues((guild) => guild.fetch()).values()]);
    this.isLoggedIn.set(true);
    this.eventListeners.onLogin.forEach((callback) => callback());
  }

  async disconnect () {
    const roles = await this.getRoles();
    this.eventListeners.onRolesChange.forEach((callback) => callback(roles));
    this.isLoggedIn.set(false);
    return this.client.destroy();
  }

  async joinVoicechannel (channelId: string) {
    const channel = this.client.channels.cache.get(channelId);
    if (!channel || !channel.isVoiceBased() || channel.isDMBased()) {
      return;
    }

    await channel.guild.commands.set([
      new Discord.SlashCommandBuilder()
        .setName(SLASH_COMMANDS.startRecording.id)
        .setDescription('start recording')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.MoveMembers),
      new Discord.SlashCommandBuilder()
        .setName(SLASH_COMMANDS.stopRecording.id)
        .setDescription('stop recording')
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.MoveMembers),
      new Discord.SlashCommandBuilder()
        .setName(SLASH_COMMANDS.changeScene.id)
        .setDescription('Changes the scene when a member is streaming')
        .addSubcommand((subCommand) =>
          subCommand
            .setName(SLASH_COMMANDS.changeScene.subcommand.scene.values.default.name)
            .setDescription('The scene to change to the configured default scene')
        )
        .addSubcommand((subCommand) =>
          subCommand
            .setName(SLASH_COMMANDS.changeScene.subcommand.scene.values.audio.name)
            .setDescription('The scene to change to the configured audio scene')
        )
        .addSubcommand((subCommand) =>
          subCommand
            .setName(SLASH_COMMANDS.changeScene.subcommand.scene.values.video.name)
            .setDescription('The scene to change to the configured video scene')
        )
        .addSubcommand((subCommand) =>
          subCommand
            .setName(SLASH_COMMANDS.changeScene.subcommand.scene.values.custom.name)
            .setDescription('The scene to change to any OBS scene')
            .addStringOption((option) =>
              option
                .setName(SLASH_COMMANDS.changeScene.subcommand.scene.values.custom.options.scene)
                .setDescription('The scene to change to')
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.MoveMembers),
    ])

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
    if (!get(this.isLoggedIn)) {
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
    if (get(this.isLoggedIn)) {
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
    if (get(this.isLoggedIn) === false) {
      return []
    }
    const guild = this.client.guilds.cache.get(guildId || (this.client.channels.cache.get(get(appSettings).selectedChannelId) as GuildBasedChannel)?.guildId || '')

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
