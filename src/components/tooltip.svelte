<script lang="ts">
  let {
    title = "",
    class: classList = "",
    fixed = false,
  }: { title: string; class?: string; fixed?: boolean } = $props();

  let isHovered = $state(false);
  let x = $state(0);
  let y = $state(0);
  let bubble: HTMLDivElement | undefined = $state();

  function mouseOver(event: MouseEvent) {
    isHovered = true;
    x = event.pageX - 5;
    x = Math.min(
      document.body.clientWidth - bubble?.getBoundingClientRect().width,
      Math.max(0, x - bubble?.getBoundingClientRect().width / 2),
    );
    y = event.pageY + 5;
  }
  function mouseMove(event: MouseEvent) {
    x = event.pageX - 5;
    x = Math.min(
      document.body.clientWidth - bubble?.getBoundingClientRect().width,
      Math.max(0, x - bubble?.getBoundingClientRect().width / 2),
    );
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
    bind:this={bubble}
    style="top: {y}px; left: {x}px;"
    class={`tooltip text-center pointer-events-none bg-slate-500 shadow-xl drop-shadow-xl z-40 ${fixed ? "fixed" : "absolute"}`}
  >
    {@html title}
  </div>
{/if}

<style>
  .tooltip {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px;
  }
</style>
