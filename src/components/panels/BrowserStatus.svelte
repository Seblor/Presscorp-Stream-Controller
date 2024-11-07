<script lang="ts">
  let isConnected = $state(false);
  import tamperMonkeyImg from "../../assets/tampermonkey.svg";
  import ScriptIcon from "virtual:icons/mdi/script-text";
  import { connectedBrowsersCount } from "../../connections/Browser";
  import Tooltip from "../tooltip.svelte";
</script>

<div class="flex flex-col size-full">
  <h1 class="py-2 text-center">Browser</h1>
  <hr class="mx-2 pb-2" />
  <div class="px-2 flex grow">
    {#if $connectedBrowsersCount > 0}
      <div class="flex flex-col text-center justify-center">
        <span class="text-2xl">{$connectedBrowsersCount} </span><span
          >connected browser{$connectedBrowsersCount > 1 ? "s" : ""}
        </span>
      </div>
    {:else}
      <div class="flex flex-col grow">
        <span>Disconnected</span>
        <div class="flex flex-col grow justify-center">
          <div class="flex justify-evenly">
            <Tooltip
              title="Tampermonkey: a browser extension to run custom scripts"
            >
              <a href="https://www.tampermonkey.net/#download" target="_blank">
                <img
                  class="size-8"
                  src={tamperMonkeyImg}
                  alt="tampermonkey icon"
                />
              </a>
            </Tooltip>
            <Tooltip
              title="A user script that opens a stream when it is detected"
            >
              <a href="/presscorp-stream-controller.user.js" target="_blank">
                <ScriptIcon class="size-8" />
              </a>
            </Tooltip>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
