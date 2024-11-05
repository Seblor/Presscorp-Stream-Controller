<script>
  import obsConnector from "../connections/OBS";

  let websocketPort = "";
  let password = "";

  if (websocketPort && password) {
    obsConnector.login(websocketPort, password);
  }

  function handleSubmit() {
    localStorage.setItem("obsWebsocketPort", websocketPort);
    localStorage.setItem("obsWebsockePassword", password);
    obsConnector.login(websocketPort, password);
  }
</script>

<form
  class="flex flex-col gap-2 align-middle"
  on:submit|preventDefault={handleSubmit}
>
  <div class="flex gap-2">
    <label class="flex flex-col text-center gap-2">
      Port:
      <input class="w-32 bg-slate-500" type="text" bind:value={websocketPort} />
    </label>

    <label class="flex flex-col text-center gap-2">
      Password:
      <input class="w-32 bg-slate-500" type="password" bind:value={password} />
    </label>
  </div>

  <div class="flex justify-center">
    <button
      type="submit"
      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
    >
      Connect
    </button>
  </div>
</form>
