<script lang="ts">
  import ObsCredentialForm from "../OBSCredentialForm.svelte";
  import obsConnector from "../../connections/OBS";
    import ObsStatus from "../OBSStatus.svelte";

  let websocketUrl = localStorage.getItem("obsWebsocketPort") || "";
  let password = localStorage.getItem("obsWebsockePassword") || "";

  if (websocketUrl && password) {
    obsConnector.login(websocketUrl, password);
  }

  let isObsConnected = $state(false);

  obsConnector.isLoggedIn.subscribe((isLoggedIn) => {
    isObsConnected = isLoggedIn;
    console.log({ isLoggedIn, isObsConnected });
  });
</script>

<div class="px-2">
  <h1 class="py-2 text-center">OBS</h1>
  <hr class="mx-2 pb-2" />
  {#if isObsConnected}
    <ObsStatus />
  {:else}
    <ObsCredentialForm />
  {/if}
</div>
