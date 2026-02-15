const Discord = require("discord.js");
const DiscordVoice = require("@discordjs/voice");

const IS_DEV = process.env.DEV_ENV === 'true';

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

class DiscordHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.client = null;
    this.isLoggedIn = false;
    this.voiceConnection = null;
    this.peopleSpeaking = {};
    this.appSettings = {};
    this.registeredCommandsGuilds = new Set(); // Track which guilds have commands registered
  }

  // Log only in development
  devLog (...args) {
    if (IS_DEV) {
      console.log(...args);
    }
  }

  // Send events to renderer process
  sendToRenderer (channel, ...args) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  // Update settings from renderer
  updateSettings (settings) {
    this.appSettings = settings;
  }

  // Initialize Discord client
  initializeClient () {
    if (this.client) {
      // Clean up existing client before creating a new one
      try {
        if (this.isLoggedIn) {
          this.client.removeAllListeners();
          this.client.destroy();
        }
      } catch (error) {
        console.warn('Error cleaning up old client:', error);
      }
      this.client = null;
    }

    this.client = new Discord.Client({
      intents: [
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.Guilds,
      ],
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (
        interaction.isAutocomplete()
        && interaction.commandName === SLASH_COMMANDS.changeScene.id
        && interaction.options.getSubcommand() === SLASH_COMMANDS.changeScene.subcommand.scene.values.custom.name
      ) {
        const userValue = interaction.options.getFocused();

        // Request scenes from renderer via IPC
        this.sendToRenderer('discord:request-obs-scenes', userValue);

        // The response will be handled by setSceneAutocomplete method
        return;
      }

      if (!interaction.isCommand()) {
        return;
      }

      const guild = this.client.guilds.cache.get((this.client.channels.cache.get(this.appSettings.selectedChannelId))?.guildId || '')

      if (!guild || interaction.guildId !== guild.id) {
        return;
      }

      const userRoles = Array.isArray(interaction.member.roles) ? interaction.member.roles : [...interaction.member.roles.cache.keys()];

      if (userRoles.includes(this.appSettings.casterRole) === false) {
        return interaction.reply({
          content: 'You do not have the permissions to use this command',
          ephemeral: true,
        });
      }

      switch (interaction.commandName) {
        case SLASH_COMMANDS.startRecording.id:
          this.sendToRenderer('discord:command-start-recording');
          interaction.reply('Recording started');
          break;

        case SLASH_COMMANDS.stopRecording.id:
          this.sendToRenderer('discord:command-stop-recording');
          interaction.reply('Recording stopped');
          break;

        case SLASH_COMMANDS.changeScene.id:
          await this.handleSceneChangeCommand(interaction);
          break;

        default:
          break;
      }
    });

    this.client.on("guildMemberUpdate", async (user) => {
      if (user.voice.channel?.members.get(this.client.user?.id)) {
        const members = user.voice.channel.members.map((member) => ({
          id: member.id,
          name: member.displayName ?? member.user.username,
          isMuted: member.voice.selfMute,
          isStreaming: member.voice.streaming,
          iconUrl: member.user.displayAvatarURL(),
          roles: [...member.roles.cache.keys()],
        }));
        this.sendToRenderer('discord:voice-members-changed', members);
      }
    });

    this.client.on("channelUpdate", async (channel) => {
      if (channel.isVoiceBased()) {
        this.sendToRenderer('discord:voice-channels-changed');
      }
    });

    this.client.on("channelCreate", async (channel) => {
      if (channel.isVoiceBased()) {
        this.sendToRenderer('discord:voice-channels-changed');
      }
    });

    this.client.on("channelDelete", async (channel) => {
      if (channel.isVoiceBased()) {
        this.sendToRenderer('discord:voice-channels-changed');
      }
    });

    this.client.on("roleCreate", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.sendToRenderer('discord:roles-changed', roles);
    });

    this.client.on("roleDelete", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.sendToRenderer('discord:roles-changed', roles);
    });

    this.client.on("roleUpdate", async (role) => {
      const roles = await this.getRoles(role.guild.id);
      this.sendToRenderer('discord:roles-changed', roles);
    });

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      let channelWithBot = null;
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

        const members = channelWithBot.members.map((member) => ({
          id: member.id,
          name: member.displayName ?? member.user.username,
          isMuted: member.voice.selfMute,
          isStreaming: member.voice.streaming,
          iconUrl: member.user.displayAvatarURL(),
          roles: [...member.roles.cache.keys()],
        }));
        this.sendToRenderer('discord:voice-members-changed', members);
      }
    });
  }

  async handleSceneChangeCommand (inter) {
    if (!inter.isChatInputCommand() || inter.commandName !== SLASH_COMMANDS.changeScene.id) {
      return;
    }

    const chosenScene = inter.options.getSubcommand();
    const peopleInVoiceChannel = this.getCurrentVoiceChannelMembers();

    const doesSceneRequireStreamingMember = chosenScene === 'audio' || chosenScene === 'video'
    if (doesSceneRequireStreamingMember && !peopleInVoiceChannel.some((person) => person.isStreaming)) {
      return inter.reply('No one is streaming');
    }

    let sceneToChangeTo;
    let targetSceneName;
    let sceneName;

    switch (chosenScene) {
      case 'audio':
        sceneToChangeTo = this.appSettings.memberStreamAudioSceneUuid;
        targetSceneName = 'configured audio scene';
        break;

      case 'video':
        sceneToChangeTo = this.appSettings.memberStreamVideoSceneUuid;
        targetSceneName = 'configured video scene';
        break;

      case 'default':
        sceneToChangeTo = this.appSettings.defaultSceneUuid;
        targetSceneName = 'configured default scene';
        break;

      case 'custom':
        sceneName = inter.options.getString(SLASH_COMMANDS.changeScene.subcommand.scene.id);
        targetSceneName = `scene named \`${sceneName}\``;
        // Request scene UUID from renderer
        this.sendToRenderer('discord:request-scene-uuid', {
          sceneName,
          interactionId: inter.id
        });
        // The actual scene change will be handled when renderer responds
        return;

      default:
        return inter.reply('Invalid command');
    }

    if (!sceneToChangeTo) {
      return inter.reply(`Could not find ${targetSceneName}`);
    }

    await inter.reply(`Scene changed to ${targetSceneName}`);
    this.sendToRenderer('discord:command-change-scene', sceneToChangeTo);
  }

  // Handle scene change with UUID (called from renderer)
  async handleSceneChangeWithUuid (data) {
    const { sceneUuid } = data;

    // Find the interaction (this is simplified, in production you'd cache interactions)
    if (!sceneUuid) {
      // Send failure response if needed
      return;
    }

    this.sendToRenderer('discord:command-change-scene', sceneUuid);
  }

  // Handle autocomplete response from renderer
  handleSceneAutocomplete (interaction, scenes) {
    if (interaction && !interaction.replied) {
      interaction.respond(scenes.map((scene) => ({
        name: scene.name,
        value: scene.name,
      })));
    }
  }

  // Handle recording state change from OBS
  handleRecordingStateChange (isRecording) {
    if (!this.isLoggedIn) {
      return;
    }

    const channel = this.client.channels.cache.get(this.appSettings.selectedChannelId);
    if (!channel) {
      return;
    }

    const guild = this.client.guilds.cache.get(channel.guildId || '');
    if (!guild) {
      return;
    }

    if (isRecording) {
      guild.members.me?.setNickname(`${this.appSettings.orderBottom ? ON_AIR_PREFIX.bottom : ON_AIR_PREFIX.normal}${this.client.user?.username}`);
    } else {
      guild.members.me?.setNickname(this.client.user?.username);
    }
  }

  // Handle order bottom setting change
  handleOrderBottomChange (orderBottom) {
    if (!this.isLoggedIn) {
      return;
    }

    const channel = this.client.channels.cache.get(this.appSettings.selectedChannelId);
    if (!channel) {
      return;
    }

    const guild = this.client.guilds.cache.get(channel.guildId || '');
    if (!guild) {
      return;
    }

    if (orderBottom && guild.members.me?.nickname?.startsWith(ON_AIR_PREFIX.normal)) {
      guild.members.me?.setNickname(`${ON_AIR_PREFIX.bottom}${this.client.user?.username}`);
    } else if (!orderBottom && guild.members.me?.nickname?.startsWith(ON_AIR_PREFIX.bottom)) {
      guild.members.me?.setNickname(`${ON_AIR_PREFIX.normal}${this.client.user?.username}`);
    }
  }

  async login (token) {
    this.devLog('[Discord] Starting login process...');
    const startTime = Date.now();

    this.initializeClient();
    this.devLog('[Discord] Client initialized');

    try {
      this.devLog('[Discord] Calling client.login()...');
      await this.client.login(token);
      this.devLog(`[Discord] client.login() completed in ${Date.now() - startTime}ms`);

      // Wait for client to be fully ready
      if (!this.client.isReady()) {
        this.devLog('[Discord] Client not ready, waiting for ready event...');
        const readyStart = Date.now();
        await new Promise((resolve) => {
          this.client.once('ready', resolve);
        });
        this.devLog(`[Discord] Ready event received in ${Date.now() - readyStart}ms`);
      } else {
        this.devLog('[Discord] Client already ready');
      }

      this.devLog('[Discord] Fetching guilds...');
      const guildsStart = Date.now();
      await Promise.all([...(await this.client.guilds.fetch()).mapValues((guild) => guild.fetch()).values()]);
      this.devLog(`[Discord] Guilds fetched in ${Date.now() - guildsStart}ms`);

      this.isLoggedIn = true;
      this.sendToRenderer('discord:login-state-changed', true);
      this.devLog('[Discord] Login state changed event sent');

      // Send initial data to renderer
      this.sendToRenderer('discord:voice-channels-changed');
      this.devLog('[Discord] Voice channels changed event sent');

      const rolesStart = Date.now();
      const roles = await this.getRoles();
      this.devLog(`[Discord] Roles fetched in ${Date.now() - rolesStart}ms`);
      this.sendToRenderer('discord:roles-changed', roles);

      // Auto-rejoin voice channel if there was one selected before login
      if (this.appSettings.selectedChannelId) {
        this.devLog(`[Discord] Auto-rejoining previously selected channel: ${this.appSettings.selectedChannelId}`);
        // Use setTimeout to avoid blocking the login response
        setTimeout(() => {
          this.joinVoiceChannel(this.appSettings.selectedChannelId);
        }, 100);
      }

      this.devLog(`[Discord] Login completed successfully in ${Date.now() - startTime}ms`);
      return { success: true };
    } catch (error) {
      console.error('[Discord] Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async disconnect () {
    this.devLog('[Discord] Starting disconnect process...');

    if (!this.client) {
      this.devLog('[Discord] No client to disconnect');
      return { success: true };
    }

    try {
      // Clean up voice connection first
      if (this.voiceConnection) {
        this.devLog('[Discord] Destroying voice connection...');
        this.voiceConnection.destroy();
        this.voiceConnection = null;
      }

      // Reset speaking state
      this.peopleSpeaking = {};

      // Clear registered commands cache
      this.registeredCommandsGuilds.clear();
      this.devLog('[Discord] Cleared command registration cache');

      // Send empty roles before logout
      this.sendToRenderer('discord:roles-changed', []);
      this.isLoggedIn = false;
      this.sendToRenderer('discord:login-state-changed', false);

      // Remove all event listeners before destroying
      this.devLog('[Discord] Removing listeners and destroying client...');
      this.client.removeAllListeners();
      await this.client.destroy();
      this.client = null;
      this.devLog('[Discord] Disconnect completed successfully');
      return { success: true };
    } catch (error) {
      console.error('[Discord] Disconnect error:', error);
      // Even if there's an error, reset state
      this.isLoggedIn = false;
      if (this.client) {
        try {
          this.client.removeAllListeners();
          this.client.destroy();
        } catch (e) {
          this.devLog('[Discord] Error removing listeners:', e);
        }
      }
      this.client = null;
      this.voiceConnection = null;
      this.peopleSpeaking = {};
      this.registeredCommandsGuilds.clear();
      return { success: false, error: error.message };
    }
  }

  async joinVoiceChannel (channelId) {
    this.devLog(`[Discord] Starting joinVoiceChannel for ${channelId}...`);
    const startTime = Date.now();

    if (!this.client) {
      this.devLog('[Discord] Cannot join: Not logged in');
      return { success: false, error: 'Not logged in' };
    }

    try {
      this.devLog('[Discord] Getting channel from cache...');
      const channel = this.client.channels.cache.get(channelId);
      if (!channel || !channel.isVoiceBased() || channel.isDMBased()) {
        this.devLog('[Discord] Invalid channel');
        return { success: false, error: 'Invalid channel' };
      }
      this.devLog(`[Discord] Channel found: ${channel.name} in guild ${channel.guild.name}`);

      // Register commands in background - don't block the join
      if (!this.registeredCommandsGuilds.has(channel.guild.id)) {
        this.devLog(`[Discord] Starting background command registration for guild ${channel.guild.name}...`);
        this.registeredCommandsGuilds.add(channel.guild.id); // Mark as in-progress

        // Register commands asynchronously without blocking
        const commandsStart = Date.now();
        channel.guild.commands.set([
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
        ]).then(() => {
          this.devLog(`[Discord] Background command registration completed in ${Date.now() - commandsStart}ms`);
        }).catch((error) => {
          console.error(`[Discord] Background command registration failed:`, error);
          // Remove from cache so it can be retried
          this.registeredCommandsGuilds.delete(channel.guild.id);
        });
      } else {
        this.devLog(`[Discord] Commands already registered for guild ${channel.guild.name}, skipping`);
      }

      this.devLog('[Discord] Joining voice channel...');
      const joinStart = Date.now();
      this.voiceConnection = DiscordVoice.joinVoiceChannel({
        channelId,
        selfDeaf: false,
        selfMute: true,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      this.devLog(`[Discord] Voice connection established in ${Date.now() - joinStart}ms`);

      this.peopleSpeaking = {};
      this.devLog('[Discord] Setting up voice activity listeners...');

      this.voiceConnection.receiver.speaking.on('start', (userId) => {
        this.peopleSpeaking[userId] = true;
        this.sendToRenderer('discord:voice-activity', {
          isSomeoneSpeaking: true,
          peopleSpeaking: this.peopleSpeaking
        });
      });

      this.voiceConnection.receiver.speaking.on('end', (userId) => {
        this.peopleSpeaking[userId] = false;
        const isSomeoneSpeaking = Object.values(this.peopleSpeaking).some((isSpeaking) => isSpeaking);
        this.sendToRenderer('discord:voice-activity', {
          isSomeoneSpeaking,
          peopleSpeaking: this.peopleSpeaking
        });
      });

      this.devLog(`[Discord] joinVoiceChannel completed successfully in ${Date.now() - startTime}ms`);
      return { success: true };
    } catch (error) {
      console.error('[Discord] Error joining voice channel:', error);
      return { success: false, error: error.message };
    }
  }

  leaveVoiceChannel () {
    if (this.voiceConnection) {
      this.voiceConnection.destroy();
      this.voiceConnection = null;
    }
    return { success: true };
  }

  getCurrentVoiceChannelMembers () {
    if (!this.voiceConnection || !this.client) {
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
    }));
  }

  getBotData () {
    if (!this.isLoggedIn || !this.client) {
      return {
        name: "Unknown",
        iconUrl: "",
      };
    }
    return {
      name: this.client.user?.username,
      iconUrl: this.client.user?.displayAvatarURL(),
    };
  }

  getChannelName (channelId) {
    if (!channelId || !this.client) {
      return '';
    }
    const channel = this.client.channels.cache.get(channelId);
    if (!channel) {
      return '';
    }
    if (channel.isDMBased()) {
      return 'Direct Message';
    }
    return channel.name;
  }

  async getRoles (guildId) {
    if (!this.isLoggedIn || !this.client) {
      return [];
    }

    let guild = this.client.guilds.cache.get(guildId || this.client.channels.cache.get(this.appSettings.selectedChannelId)?.guildId || '');

    // If no guild found, use the first available guild
    if (!guild && this.client.guilds.cache.size > 0) {
      guild = this.client.guilds.cache.first();
    }

    if (!guild) {
      return [];
    }

    const roles = await guild.roles.fetch();
    return [...roles.values()].map((role) => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
    }));
  }

  async botHasRole (roleId) {
    if (!this.voiceConnection || !this.client) {
      return false;
    }

    const guild = this.client.guilds.cache.get(this.voiceConnection.joinConfig.guildId || '');
    if (!guild) {
      return false;
    }

    const role = guild.roles.cache.get(roleId);
    if (!role) {
      return false;
    }

    return guild.members.me?.roles.cache.has(role.id) || false;
  }

  getAllVoiceChannels () {
    if (!this.client) {
      return [];
    }

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

  getPeopleSpeaking () {
    return this.peopleSpeaking;
  }

  getIsLoggedIn () {
    return this.isLoggedIn;
  }
}

module.exports = DiscordHandler;
