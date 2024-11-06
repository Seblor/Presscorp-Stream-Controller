<script module>
  // retain module scoped expansion state for each tree node
  const _expansionState = $state({
    /* treeNodeId: expanded <boolean> */
  });
</script>

<script lang="ts">
  import TreeView from './VoiceChannelTreeView.svelte';
  import voiceChannelIcon from '../assets/voiceChannelIcon.svg';

  type TreeData = {
    label: string;
    id: string | null;
    img?: string;
    children?: TreeData[];
  };

  const selectChannel = () => {
    value = tree.id;
  }
  
  let { tree, value = $bindable<string>('') }: {tree: TreeData, value: string} = $props();

  let expanded = $state(_expansionState[tree.label] || !tree.id || false);
  const toggleExpansion = () => {
    expanded = _expansionState[tree.label] = !expanded;
  };
  let arrowDown = $derived(expanded);
</script>

<ul>
  <!-- transition:slide -->
  <li class="my-1">
    {#if tree.children}
       {#if tree.id !== null}
       <!-- svelte-ignore a11y_click_events_have_key_events -->
       <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div onclick={toggleExpansion} class="">
          <div class="flex">
            <div class="flex flex-col justify-center">
              <span class="arrow text-2xl" class:arrowDown>&#x25b6</span>
            </div>
            {#if tree.img}
              <img class="w-12 rounded-full mx-2" src={tree.img} alt="">
            {/if}
            <div class="flex flex-col justify-center text-xl">
              {tree.label}
            </div>
          </div>
        </div>
      {/if}
      {#if expanded}
        {#each tree.children as child}
          <TreeView tree={child} bind:value={value} />
        {/each}
      {/if}
    {:else}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span onclick={selectChannel} class="cursor-pointer flex align-baseline hover:bg-slate-500 bg-opacity-50 rounded">
        <img src={voiceChannelIcon} alt="voice channel icon" class="mr-1"/>
        {tree.label}
      </span>
    {/if}
  </li>
</ul>

<style>
  ul {
    margin: 0;
    list-style: none;
    padding-left: 1.2rem;
    user-select: none;
  }
  .arrow {
    cursor: pointer;
    display: inline-block;
    /* transition: transform 200ms; */
  }
  .arrowDown {
    transform: rotate(90deg);
  }
</style>
