<script>
  import { createEventDispatcher } from "svelte";

  let { botName = "", botIcon = "" } = $props();

  const dispatch = createEventDispatcher();

  function handleReset() {
    if (confirm("Are you sure you want to disconnect?")) {
      dispatch("resetToken");
    }
  }
</script>

<div
  class="w-full bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between"
>
  <div class="flex items-center space-x-4">
    {#if botIcon}
      <img
        src={botIcon}
        alt={botName}
        class="w-12 h-12 rounded-full ring-2 ring-blue-500"
      />
    {:else}
      <div
        class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-400"
      >
        <span class="text-white text-xl font-bold">{botName.charAt(0)}</span>
      </div>
    {/if}
    {#if botName}
      <span class="text-lg font-semibold text-white">{botName}</span>
    {:else}
      <div
        class="text-lg animate-pulse w-48 h-8 rounded-full bg-slate-700 font-semibold text-white"
      ></div>
    {/if}
  </div>
  <div class="flex gap-4">
    <button
      onclick={window.location.reload()}
      class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
    >
      Reconnect
    </button>
    <button
      onclick={handleReset}
      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
    >
      Disconnect
    </button>
  </div>
</div>
