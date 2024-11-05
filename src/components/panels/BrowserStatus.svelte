<script lang="ts">
  let isConnected = $state(false)
</script>

<div class="px-2">
  <h1 class="py-2 text-center">Browser</h1>
  <hr class="mx-2 pb-2" />
  {#if isConnected}
    Connected
  {:else}
    Disconnected
  {/if}
</div>
