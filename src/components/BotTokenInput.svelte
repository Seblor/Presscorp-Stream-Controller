<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import { discordToken } from "../stores/credentials";

  let token = $state("");

  function handleSubmit() {
    discordToken.set(token);
  }
</script>

<div class="p-4 rounded-lg shadow-lg flex flex-col justify-center grow">
  <form
    onsubmit={preventDefault(handleSubmit)}
    class="flex items-center space-x-4"
  >
    <input
      type="password"
      bind:value={token}
      placeholder="Enter bot token"
      class="flex-grow px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
    />
    <button
      type="submit"
      class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
    >
      Connect
    </button>
  </form>
</div>
