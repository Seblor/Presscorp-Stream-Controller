<script lang="ts">
  import { get } from "svelte/store";
  import obsConnector from "../connections/OBS";
  import SceneIcon from "virtual:icons/mdi/projector-screen";
  import RecordingIcon from "virtual:icons/mdi/radiobox-marked";
  import BroadcastingIcon from "virtual:icons/mdi/broadcast";
  import ObsStatusItem from "./OBSStatusItem.svelte";

  let currentSceneName = $state("");
  let isRecording = $state(get(obsConnector.isRecording));
  let isStreaming = $state(get(obsConnector.isStreaming));

  obsConnector.isRecording.subscribe((newValue) => {
    isRecording = newValue;
  });

  obsConnector.isStreaming.subscribe((newValue) => {
    isStreaming = newValue;
  });

  obsConnector.scenes.subscribe(updateSceneName);
  obsConnector.currentSceneUuid.subscribe(updateSceneName);

  function updateSceneName() {
    currentSceneName =
      get(obsConnector.scenes).find(
        (scene) => scene.uuid === get(obsConnector.currentSceneUuid),
      )?.name || "";
  }
</script>

<div class="flex flex-col gap-2">
  <ObsStatusItem title="Current scene">
    {#snippet iconSlot()}
      <SceneIcon />
    {/snippet}
    {#snippet valueSlot()}
      <pre>{currentSceneName}</pre>
    {/snippet}
  </ObsStatusItem>
  <div class="flex gap-2">
    <ObsStatusItem title="Is recording ?" iconClass={isRecording ? '!text-red-500' : ''}>
      {#snippet iconSlot()}
        <RecordingIcon />
      {/snippet}
      {#snippet valueSlot()}
        <pre>{isRecording ? 'On' : 'Off'}</pre>
      {/snippet}
    </ObsStatusItem>
    <ObsStatusItem title="Is broadcasting ?" iconClass={isStreaming ? '!text-red-500' : ''}>
      {#snippet iconSlot()}
        <BroadcastingIcon />
      {/snippet}
      {#snippet valueSlot()}
        <pre>{isStreaming ? 'On' : 'Off'}</pre>
      {/snippet}
    </ObsStatusItem>
  </div>
</div>
