<script lang="ts">
  let { title = "", class: classList = '' }: { title: string; class?: string } =
    $props();

  let isHovered = $state(false);
  let x = $state();
  let y = $state();

  function mouseOver(event: MouseEvent) {
    isHovered = true;
    x = event.pageX + 5;
    y = event.pageY + 5;
  }
  function mouseMove(event: MouseEvent) {
    x = event.pageX + 5;
    y = event.pageY + 5;
  }
  function mouseLeave() {
    isHovered = false;
  }
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={classList}
  onmouseover={mouseOver}
  onmouseleave={mouseLeave}
  onmousemove={mouseMove}
>
  <slot />
</div>

{#if isHovered}
  <div
    style="top: {y}px; left: {x}px;"
    class="tooltip bg-slate-500 shadow-xl drop-shadow-xl z-10"
  >
    {@html title}
  </div>
{/if}

<style>
  .tooltip {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px;
    position: absolute;
  }
</style>
