<script lang="ts">
  import { get } from "svelte/store";
  import discordBot from "../../connections/DiscordBot";
  import obsConnector from "../../connections/OBS";

  import { appSettings } from "../../settings";
  import Tooltip from "../tooltip.svelte";

  const roles: Array<{ id: string; name: string; color: string }> = $state([]);
  const scenes: Array<{ uuid: string; name: string }> = $state(
    get(obsConnector.scenes),
  );

  obsConnector.scenes.subscribe((newScenes) => {
    if (newScenes.length === 0) return;

    const defaultScene = $appSettings.defaultSceneUuid;
    const memberStreamScene = $appSettings.memberStreamSceneUuid;

    if (newScenes.find((scene) => scene.uuid === defaultScene) === undefined) {
      appSettings.update((settings) => {
        settings.defaultSceneUuid = "";
        return settings;
      });
    }

    if (
      newScenes.find((scene) => scene.uuid === memberStreamScene) === undefined
    ) {
      appSettings.update((settings) => {
        settings.memberStreamSceneUuid = "";
        return settings;
      });
    }

    scenes.splice(0, scenes.length, ...newScenes);
  });

  discordBot.onLogin(async () => {
    roles.splice(0, roles.length, ...(await discordBot.getRoles()));
  });

  discordBot.onRolechanged(async () => {
    roles.splice(0, roles.length, ...(await discordBot.getRoles()));
  });
</script>

<div class="h-full">
  <h1 class="text-xl text-center py-2">Settings</h1>
  <hr class="mx-4 mb-2" />
  <div class="flex justify-between m-2 gap-2">
    <div class="flex flex-col gap-2 justify-end text-end">
      <div>
        Bot role:
        <select
          bind:value={$appSettings.botRole}
          class="bg-slate-600 rounded w-32"
        >
          {#each roles as role}
            <option
              style={`background-color: ${role.color ?? "rgb(71 85 105)"};`}
              value={role.id}>{role.name}</option
            >
          {/each}
        </select>
      </div>
      <div class="flex gap-2">
        <Tooltip
          title="The grace period after the last person stops speaking before the recording stops."
        >
          <span>Recording grace period (seconds):</span>
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.recordingGracePeriodSeconds}
          class="bg-slate-600 rounded w-12 text-center"
        />
      </div>
    </div>
    <div class="flex flex-col gap-2 text-end">
      <div class="flex gap-2 justify-end">
        <Tooltip
          title="The scene to switch to when <b>no one</b> is streaming on Discord."
        >
          Default scene:
        </Tooltip>
        <select
          bind:value={$appSettings.defaultSceneUuid}
          class="bg-slate-600 rounded w-32"
        >
          {#each scenes as scene}
            <option value={scene.uuid}>{scene.name}</option>
          {/each}
        </select>
      </div>
      <div class="flex gap-2">
        <Tooltip
          title="The scene to switch to when <b>someone</b> is streaming on Discord."
        >
          Streaming scene:
        </Tooltip>
        <select
          bind:value={$appSettings.memberStreamSceneUuid}
          class="bg-slate-600 rounded w-32"
        >
          {#each scenes as scene}
            <option value={scene.uuid}>{scene.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 justify-end">
        <Tooltip
          title="The scene to switch to when <b>no one</b> is streaming on Discord."
        >
          Volume when speaking:
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.backgroundVolumeSpeaking}
          class="bg-slate-600 rounded w-12 text-center"
        />
      </div>
      <div class="flex gap-2 justify-end">
        <Tooltip
          title="The scene to switch to when <b>someone</b> is streaming on Discord."
        >
          Volume when silence:
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.backgroundVolumeSilence}
          class="bg-slate-600 rounded w-12 text-center"
        />
      </div>
    </div>
  </div>
</div>
