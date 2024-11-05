<script lang="ts">
  import type { Snippet } from "svelte";
  import Tooltip from "./tooltip.svelte";

  let { title, valueSlot, iconSlot, iconClass = '' }: { title: string, valueSlot: Snippet, iconSlot: Snippet, iconClass?: string } = $props();
</script>

<Tooltip {title}>
  <div
    class="p-1 obs-status-item flex gap-2 items-center rounded border border-white shrink"
  >
    <div class={"rounded-l pr-1 border-r bg-slate-800 " + iconClass + " text-slate-500"}>
      {@render iconSlot?.()}
    </div>
    {@render valueSlot?.()}
  </div>
</Tooltip>
