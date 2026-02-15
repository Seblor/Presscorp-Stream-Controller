<script lang="ts">
  import { get } from "svelte/store";
  import discordBot from "../../connections/DiscordBot";
  import obsConnector from "../../connections/OBS";
  import { appSettings } from "../../stores/settings";
  import Tooltip from "../tooltip.svelte";
  import debounce from "lodash/debounce";

  const roles: Array<{ id: string; name: string; color: string }> = $state([]);
  const scenes: Array<{ uuid: string; name: string }> = $state(
    get(obsConnector.scenes),
  );

  const updateRoles = debounce(async () => {
    roles.splice(0, roles.length, ...(await discordBot.getRoles()));
  }, 500);

  discordBot.isLoggedIn.subscribe(async (isLoggedIn) => {
    updateRoles();
  });

  appSettings.subscribe(async (settings) => {
    updateRoles();
  });

  obsConnector.scenes.subscribe((newScenes) => {
    if (newScenes.length === 0) return;

    const defaultScene = $appSettings.defaultSceneUuid;
    const memberStreamScene = $appSettings.memberStreamVideoSceneUuid;

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
        settings.memberStreamVideoSceneUuid = "";
        return settings;
      });
    }

    scenes.splice(0, scenes.length, ...newScenes);
  });

  discordBot.isLoggedIn.subscribe(async (value) => {
    if (value) {
      updateRoles();
    }
  });

  discordBot.onRolechanged(async () => {
    updateRoles();
  });
</script>

<div class="h-full">
  <h1 class="text-xl text-center py-2">Settings</h1>
  <hr class="mx-2" />
  <div class="flex justify-evenly m-2 gap-2">
    <div class="flex flex-col gap-2 justify-around text-end">
      <div>
        <Tooltip
          class="inline"
          title="Members with this role will be able to use the slash commands."
        >
          Caster role:
        </Tooltip>
        <select
          bind:value={$appSettings.casterRole}
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
      <div>
        <Tooltip
          title="Every Discord member with this role will be ignored by this app."
          class="inline"
        >
          Bot role:
        </Tooltip>
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
      <div class="flex">
        <Tooltip
          title="Will prepend【ON AIR】instead of [ON AIR] when recording to display the bot at the end of the users list.<br>Those characters are japanese characters marks and are ordered after usual characters."
          class="inline"
        >
          Show bot at the bottom:
        </Tooltip>
        <div class="m-auto">
          <label class="relative flex grow justify-center text-center gap-2">
            <input
              bind:checked={$appSettings.orderBottom}
              type="checkbox"
              class="bg-slate-600 sr-only peer"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
            ></div>
          </label>
        </div>
      </div>
      <div class="flex gap-2">
        <Tooltip
          title="The grace period after the last person leaves the channel before the recording stops."
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
    <div class="flex flex-col gap-2 justify-around text-end">
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
          title="The scene to switch to when <b>someone</b> is streaming on Discord and you want to share the <b>audio</b>.<br>This scene will be automatically switched to when a voicechat member starts streaming."
        >
          Discord audio scene:
        </Tooltip>
        <select
          bind:value={$appSettings.memberStreamAudioSceneUuid}
          class="bg-slate-600 rounded w-32"
        >
          <option value=""></option>
          {#each scenes as scene}
            <option value={scene.uuid}>{scene.name}</option>
          {/each}
        </select>
      </div>
      <div class="flex gap-2">
        <Tooltip
          title="The scene to switch to when <b>someone</b> is streaming on Discord and you want to share the <b>video</b>.<br>Triggered manually with the Discord slash command."
        >
          Discord video scene:
        </Tooltip>
        <select
          bind:value={$appSettings.memberStreamVideoSceneUuid}
          class="bg-slate-600 rounded w-32"
        >
          <option value=""></option>
          {#each scenes as scene}
            <option value={scene.uuid}>{scene.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="flex flex-col justify-around gap-2">
      <div class="flex gap-2 justify-end">
        <Tooltip
          title="The volume of the background tracks when someone is speaking in the voice channel. (0 = muted, 100 = original volume)"
        >
          Volume when speaking:
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.backgroundVolumeSpeaking}
          class="bg-slate-600 rounded w-16 text-center"
        />
      </div>
      <div class="flex gap-2 justify-end">
        <Tooltip
          title="The volume of the background tracks when no one is speaking in the voice channel. (0 = muted, 100 = original volume)"
        >
          Volume when silence:
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.backgroundVolumeSilence}
          class="bg-slate-600 rounded w-16 text-center"
        />
      </div>
      <div class="flex gap-2">
        <Tooltip
          title="The grace period after the last person stops speaking before the background tracks restore their volume."
        >
          <span>Background mute delay (seconds):</span>
        </Tooltip>
        <input
          type="number"
          bind:value={$appSettings.backgroundMuteDelaySeconds}
          class="bg-slate-600 rounded w-12 text-center"
        />
      </div>
    </div>
  </div>
</div>
