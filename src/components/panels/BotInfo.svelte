<script lang="ts">
  import BotTokenInput from "../BotTokenInput.svelte";
  import BotInfoDisplay from "../BotInfoDisplay.svelte";
  import discordBot from "../../connections/DiscordBot";
  import { appSettings } from "../../stores/settings";
  import { discordToken } from "../../stores/credentials";

  let inputBotToken = localStorage.getItem("botToken") || "";
  let token = $state(inputBotToken);

  let hasToken = $derived.by(() => token !== "");
  let botName = $state("");
  let botIcon = $state("");

  // Update bot info when login state changes
  discordBot.onLogin(() => {
    updateBotInfo();
  });

  function updateBotInfo() {
    const botData = discordBot.getBotData();
    botName = botData.name;
    botIcon = botData.iconUrl;
  }

  discordToken.subscribe((token) => {
    if (token) {
      logIn(token);
    } else {
      discordBot.disconnect();
      botName = "";
      botIcon = "";
    }
  });

  async function logIn(userToken: string) {
    token = userToken;
    try {
      await discordBot.login(token);
      // Bot info will be updated via onLogin callback
    } catch (error) {
      console.error('Login failed:', error);
      // Clear token on login failure
      discordToken.set("");
    }
  }
</script>

<div class="size-full flex flex-col">
  <h1 class="py-2 text-center">Discord</h1>
  <hr class="mx-2" />
  {#if $discordToken}
    <BotInfoDisplay {botName} {botIcon} />
  {:else}
    <BotTokenInput />
  {/if}
</div>
