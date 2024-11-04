<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  let token = "";

  function handleSubmit() {
    dispatch("tokenSubmit", token);
  }
</script>

<div
  class="w-full bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-lg shadow-lg"
>
  <form
    on:submit|preventDefault={handleSubmit}
    class="flex items-center space-x-4"
  >
    <input
      type="text"
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
