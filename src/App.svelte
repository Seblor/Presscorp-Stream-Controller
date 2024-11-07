<script lang="ts">
  import BotInfo from "./components/panels/BotInfo.svelte";
  import VoiceChannelPanel from "./components/panels/VoiceChannelPanel.svelte";
  import discordBot from "./connections/DiscordBot";
  import ObsMixerPanel from "./components/panels/OBSMixerPanel.svelte";
  import SettingsPanel from "./components/panels/SettingsPanel.svelte";
  import ObsInfo from "./components/panels/OBSInfo.svelte";
  import BrowserStatus from "./components/panels/BrowserStatus.svelte";
  import "./connections/Browser";
  import "./lib/DialogUtils";
  import { checkForUpdate } from "./lib/UpdateChecker";

  let isBotReady = $state(false);

  discordBot.isLoggedIn.subscribe((value) => {
    isBotReady = value;
  });

  let newUpdateAvailable = $state(false);
  let newUpdateVersion = $state("");

  checkForUpdate().then((update) => {
    newUpdateAvailable = update.newUpdateAvailable;
    newUpdateVersion = update.latestUpdateVersion;
  });

  // const nodeVersion = api.node();
  // const chromeVersion = api.chrome();
  // const electronVersion = api.electron();
</script>

<main
  class="container overflow-y-hidden min-h-screen bg-slate-900 text-white min-w-full max-h-screen flex flex-col"
>
  <!-- Top Part -->
  <!-- <section class="bot-info flex justify-center items-center"></section> -->
  <div class="header flex justify-center items-center mt-2 mx-2">
    <div class="bot-info panel">
      <BotInfo />
    </div>
    <div class="obs-info panel">
      <ObsInfo />
    </div>
    <div class="browser-status panel">
      <BrowserStatus />
    </div>
  </div>

  <!-- Middle Part -->
  <div class="channel panel overflow-y-auto flex-shrink ml-2">
    {#if isBotReady}
      <VoiceChannelPanel />
    {:else}
      <div>
        <h1 class="py-2 text-xl text-center">
          Waiting for a Discord bot connection
        </h1>
        <hr class="mx-2 pb-2" />
      </div>
    {/if}
  </div>
  <div class="settings panel h-full mx-2">
    <SettingsPanel />
  </div>
  <div class="mixer overflow-y-hidden panel h-full mr-2">
    <ObsMixerPanel />
  </div>

  <!-- Footer -->
  <footer class="footer bg-gray-950 bottom-0 left-0 w-full h-14 py-2">
    <div class="flex justify-between items-center mx-6">
      <p class="text-xs font-light">Made with 🧡 by Seblor</p>
      {#if newUpdateAvailable}
        <p class="text-xs font-light">
          <a href="https://github.com/Seblor/presscorp-stream-controller/releases/latest" target="_blank">New update available: {newUpdateVersion}</a>
        </p>
      {/if}
      <p>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://ko-fi.com/Seblor"
          class="text-xs flex items-center py-1 px-4 bg-gray-800 hover:bg-indigo-700 text-white
      transition ease-in duration-200 text-center shadow-md focus:outline-none rounded-md"
        >
          Buy me a coffee <span class="ml-3 text-2xl">☕️</span>
        </a>
      </p>
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

  div {
    cursor: default;
  }

  .container {
    display: grid;
    grid-template-columns: 0.4fr 0.6fr;
    grid-template-rows: min-content min-content 1fr min-content;
    grid-auto-columns: 1fr;
    gap: 0.5em 0.5em;
    grid-auto-flow: row;
    grid-template-areas:
      "header header"
      "settings settings"
      "channel mixer"
      "footer footer";
  }

  .footer {
    grid-area: footer;
  }

  .mixer {
    grid-area: mixer;
  }

  .channel {
    grid-area: channel;
  }

  .settings {
    grid-area: settings;
  }

  .header {
    display: grid;
    grid-template-columns: 2.1fr 0.7fr 0.2fr;
    grid-template-rows: minmax(50px, auto);
    gap: 0.5em 0.5em;
    grid-auto-flow: row;
    justify-content: stretch;
    align-content: stretch;
    justify-items: stretch;
    align-items: stretch;
    grid-template-areas: "bot-info obs-info browser-status";
    justify-self: stretch;
    align-self: stretch;
    grid-area: header;
  }

  .bot-info {
    justify-self: stretch;
    align-self: stretch;
    grid-area: bot-info;
  }

  .obs-info {
    justify-self: stretch;
    align-self: stretch;
    grid-area: obs-info;
  }

  .browser-status {
    grid-area: browser-status;
  }
</style>
