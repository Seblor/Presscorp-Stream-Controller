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

  discordToken.subscribe((token) => {
    if (token) {
      logIn(token);
    } else {
      discordBot.disconnect();
    }
  });

  async function logIn(userToken: string) {
    // Here you would typically make an API call to validate the token
    // and fetch the bot information. For this example, we'll just set
    // some dummy data.
    token = userToken;
    await discordBot.login(token);
    const botData = discordBot.getBotData();
    botName = botData.name;
    botIcon = botData.iconUrl;
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
