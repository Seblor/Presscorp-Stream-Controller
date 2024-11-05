<script lang="ts">
  import { OBSWebSocket, EventSubscription } from "obs-websocket-js";
  import VolumeOnIcon from "virtual:icons/mdi/volume-high";
  import VolumeOffIcon from "virtual:icons/mdi/volume-off";
  import VolumeSlider from "../VolumeSlider.svelte";
  import isEqual from "lodash/isEqual";

  const volumeMeters: {
    inputs: Array<{
      inputLevelsMul: number[][];
      inputName: string;
      inputUuid: string;
    }>;
  } = $state({
    inputs: [],
  });

  const audioTracksList: string[] = $state([]);

  $effect(() => {
    audioTracksList.forEach((inputUuid: string) => {
      fetchInputState(inputUuid);
    });
  });

  async function fetchInputState(inputUuid: string) {
    if (inputState[inputUuid] === undefined) {
      inputState[inputUuid] = {
        isMuted: (await fetchMuteState(inputUuid)).inputMuted,
        volume: (await fetchVolume(inputUuid)).inputVolumeMul,
      };
    } else {
      inputState[inputUuid].isMuted = (
        await fetchMuteState(inputUuid)
      ).inputMuted;
      inputState[inputUuid].volume = (
        await fetchVolume(inputUuid)
      ).inputVolumeMul;
    }
  }

  const inputState: Record<string, { volume: number; isMuted: boolean }> =
    $state({});

  const obs = new OBSWebSocket();

  const loginPromise = obs.connect("ws://127.0.0.1:4455", "sdaBa5DgTQcJEi94", {
    eventSubscriptions:
      EventSubscription.All | EventSubscription.InputVolumeMeters,
  });

  async function main() {
    await loginPromise;
    console.log("Connected to OBS", obs.identified);
    console.log("Identified");

    obs.call("GetSceneList").then((data) => {
      console.log("Scenes:", data);
    });

    obs.addListener("CurrentProgramSceneChanged", (data) => {
      console.log("CurrentProgramSceneChanged", data);
    });

    obs.addListener("InputVolumeMeters", (data) => {
      volumeMeters.inputs = data.inputs as typeof volumeMeters.inputs;
      const newUuids = volumeMeters.inputs.map((input) => input.inputUuid);
      if (!isEqual(audioTracksList, newUuids)) {
        audioTracksList.splice(0, audioTracksList.length, ...newUuids);
      }
    });

    obs.addListener("InputVolumeChanged", (data) => {
      inputState[data.inputUuid].volume = data.inputVolumeMul;
    });

    obs.addListener("InputMuteStateChanged", (data) => {
      inputState[data.inputUuid].isMuted = data.inputMuted;
    });

    obs.addListener("InputCreated", (data) => {
      inputState[data.inputUuid].isMuted = false;
    });

    obs.addListener("InputRemoved", (data) => {
      delete inputState[data.inputUuid];
    });
  }

  function fetchMuteState(inputUuid: string) {
    return obs.call("GetInputMute", { inputUuid });
  }

  async function fetchVolume(inputUuid: string) {
    const response = await obs.call("GetInputVolume", { inputUuid });
    console.log(response);
    return response;
  }

  function setMute(inputUuid: string, shouldMute: boolean) {
    return obs.call("SetInputMute", { inputUuid, inputMuted: shouldMute });
  }

  function setVolume(inputUuid: string, newVolume: number) {
    return obs.call("SetInputVolume", { inputUuid, inputVolumeMul: newVolume });
  }

  main();
</script>

<div class="h-full pb-16">
  <h1 class="text-xl text-center py-2">OBS Mixer</h1>
  <hr class="mx-4 mb-2" />
  <div class="h-full overflow-auto">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    {#each volumeMeters.inputs as input}
      <div class="flex bg-slate-700 rounded-xl m-2">
        <div class="flex justify-center items-center w-12">
          {#if inputState[input.inputUuid]?.isMuted}
            <div
              onclick={() => setMute(input.inputUuid, false)}
              class="cursor-pointer w-8 h-8 ro flex align-middle justify-center rounded-full border-2 border-red-500"
            >
              <VolumeOffIcon class="h-full text-xl text-red-500" />
            </div>
          {:else}
            <div
              onclick={() => setMute(input.inputUuid, true)}
              class="cursor-pointer w-8 h-8 flex align-middle justify-center rounded-full border-2 border-green-500"
            >
              <VolumeOnIcon class="h-full text-xl text-green-500" />
            </div>
          {/if}
        </div>
        <div class="flex grow min-h-12 gap-4">
          <div class="flex align-middle h-full">
            {#if inputState[input.inputUuid]}
              <VolumeSlider
                value={inputState[input.inputUuid].volume}
                color={inputState[input.inputUuid].isMuted ? "salmon" : "green"}
                on:value={(event) => setVolume(input.inputUuid, event.detail)}
              ></VolumeSlider>
            {/if}
          </div>
          <div class="flex flex-col grow justify-center align-middle">
            <h1>{input.inputName}</h1>
            <div class="min-h-4 pb-1">
              {#each input.inputLevelsMul as inputLevels}
                <div class="relative h-2 w-1/2">
                  <div
                    class="absolute h-2 w-2 bg-slate-500"
                    style="width: {inputLevels[2] * 100}%;"
                  ></div>
                  <div
                    class={`absolute h-2 w-2 bg-${inputLevels[1] < 2 / 3 ? "green" : inputLevels[1] < 3 / 20 ? "orange" : "red"}-500`}
                    style="width: {inputLevels[1] * 100}%;"
                  ></div>
                  <div
                    class="absolute h-2 w-2 border-black border-r-2"
                    style="width: {inputLevels[0] * 100}%;"
                  ></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
