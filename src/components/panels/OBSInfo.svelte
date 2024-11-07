<script lang="ts">
  import ObsCredentialForm from "../OBSCredentialForm.svelte";
  import obsConnector from "../../connections/OBS";
  import ObsStatus from "../OBSStatus.svelte";

  let isObsConnected = $state(false);

  obsConnector.isLoggedIn.subscribe((isLoggedIn) => {
    isObsConnected = isLoggedIn;
  });
</script>

<div class="flex flex-col">
  <h1 class="py-2 text-center">OBS</h1>
  <hr class="mx-2 pb-2" />
  <div class="grow flex flex-col justify-center px-2 pb-2">
    {#if isObsConnected}
      <ObsStatus />
    {:else}
      <ObsCredentialForm />
    {/if}
  </div>
</div>
