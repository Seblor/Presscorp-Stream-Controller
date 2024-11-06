<script lang="ts">
  import { get } from "svelte/store";
  import obsConnector from "../connections/OBS";
  import { obsCredentials } from "../stores/credentials";
  import { onMount } from "svelte";

  let websocketPort = $state(get(obsCredentials).obsWebsocketPort);
  let password = $state(get(obsCredentials).obsWebsocketPassword);

  let isConnecting = $state(false);

  onMount(() => {
    if (websocketPort && password) {
      obsConnector
        .login(websocketPort, password)
        .then(() => {})
        .catch(() => {
          localStorage.removeItem("obsWebsocketPort");
          localStorage.removeItem("obsWebsockePassword");
        });
    }
  });

  async function handleSubmit(event?: Event) {
    event?.preventDefault();
    isConnecting = true;
    if (await obsConnector.login(websocketPort, password)) {
      obsCredentials.update((credentials) => {
        credentials.obsWebsocketPort = websocketPort;
        credentials.obsWebsocketPassword = password;
        return credentials;
      });
    }
    isConnecting = false;
  }
</script>

<form class="flex flex-col gap-2 pb-2 align-middle" onsubmit={handleSubmit}>
  <div class="flex gap-2">
    <label class="flex flex-col text-center gap-2">
      Port:
      <input
        disabled={isConnecting}
        class={`w-32 ${isConnecting ? "bg-slate-700 cursor-not-allowed" : "bg-slate-500"}`}
        type="text"
        bind:value={websocketPort}
      />
    </label>

    <label class="flex flex-col text-center gap-2">
      Password:
      <input
        disabled={isConnecting}
        class={`w-32 ${isConnecting ? "bg-slate-700 cursor-not-allowed" : "bg-slate-500"}`}
        type="password"
        bind:value={password}
      />
    </label>
  </div>

  <div class="flex justify-center">
    <button
      disabled={isConnecting}
      type="submit"
      class={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 ${
        isConnecting
          ? "animate-pulse bg-slate-600 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
      }`}
    >
      Connect
    </button>
  </div>
</form>
