import type { Client } from "discord.js";
const Discord = require("discord.js");

export class DiscordBot {
  private readonly client: Client;
  isLoggedIn: boolean = false;

  constructor() {
    this.client = new Discord.Client({
      intents: [
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.Guilds,
      ],
    });
  }

  login (token: string) {
    return this.client.login(token)
      .then(() => {
        this.isLoggedIn = true;
      });
  }

  disconnect () {
    return this.client.destroy();
  }

  getData () {
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
}

const discordBot = new DiscordBot();

export default discordBot;
