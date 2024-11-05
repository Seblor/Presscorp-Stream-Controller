<script lang="ts">
  import BotTokenInput from "../BotTokenInput.svelte";
  import BotInfoDisplay from "../BotInfoDisplay.svelte";
  import discordBot from '../../connections/DiscordBot'

  let inputBotToken = localStorage.getItem("botToken") || "";
  let token = $state(inputBotToken);

  $effect(() => {
    localStorage.setItem("botToken", token);
    if (token !== "") {
      logIn(token);
    }
  });

  let hasToken = $derived.by(() => token !== "");
  let botName = $state("");
  let botIcon = $state("");

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
  function handleResetToken() {
    inputBotToken = "";
    token = "";
    botName = "";
    botIcon = "";
  }
</script>

<div class="w-full">
  {#if hasToken}
    <BotInfoDisplay {botName} {botIcon} on:resetToken={handleResetToken} />
  {:else}
    <BotTokenInput on:tokenSubmit={(event) => logIn(event.detail)} />
  {/if}
</div>
