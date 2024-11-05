<script lang="ts">
  import BotInfo from "./components/panels/BotInfo.svelte";
  import VoiceChannelSelection from "./components/panels/VoiceChannelPanel.svelte";
  import discordBot from "./connections/DiscordBot";
  import ObsMixerPanel from "./components/panels/OBSMixerPanel.svelte";
  import SettingsPanel from "./components/panels/SettingsPanel.svelte";

  let isBotReady = $state(false);

  discordBot.onLogin(() => {
    isBotReady = true;
  });

  // const nodeVersion = api.node();
  // const chromeVersion = api.chrome();
  // const electronVersion = api.electron();
</script>

<main
  class="container overflow-y-hidden min-h-screen bg-slate-900 text-white min-w-full max-h-screen flex flex-col"
>
  <!-- Top Part -->
  <section class="bot-info flex justify-center items-center">
    <BotInfo />
  </section>

  <!-- Middle Part -->
  <div class="channel panel overflow-y-auto flex-shrink ml-2">
    {#if isBotReady}
      <VoiceChannelSelection />
    {:else}
      Waiting
    {/if}
  </div>
  <div class="settings panel h-full mr-2">
    <SettingsPanel />
  </div>
  <div class="mixer overflow-y-hidden panel h-full mr-2">
    <ObsMixerPanel />
  </div>

  <!-- Footer -->
  <footer class="footer bg-gray-950 bottom-0 left-0 w-full h-14 py-2">
    <div class="flex justify-between items-center mx-6">
      <p class="flex-auto text-xs font-light">Made with 🧡 by Seblor</p>

      <a
        target="_blank"
        rel="noreferrer"
        href="https://ko-fi.com/Seblor"
        class="text-xs flex items-center py-1 px-4 bg-gray-800 hover:bg-indigo-700 text-white
				transition ease-in duration-200 text-center shadow-md focus:outline-none rounded-md"
      >
        Buy me a coffee <span class="ml-3 text-2xl">☕️</span>
      </a>
    </div>
  </footer>
</main>

<style>
  .panel {
    border-radius: 0.25rem;
    --tw-bg-opacity: 0.25;
    background-color: rgb(100 116 139 / var(--tw-bg-opacity));
    --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
      var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  }

  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: min-content min-content 1fr min-content;
    grid-auto-columns: 1fr;
    gap: 0.5em 0.5em;
    grid-auto-flow: row;
    grid-template-areas:
      "bot-info bot-info"
      "channel settings"
      "channel mixer"
      "footer footer";
  }

  .bot-info {
    grid-area: bot-info;
  }

  .footer {
    grid-area: footer;
  }

  .channel {
    grid-area: channel;
  }

  .mixer {
    grid-area: mixer;
  }

  .settings {
    grid-area: settings;
  }
</style>
