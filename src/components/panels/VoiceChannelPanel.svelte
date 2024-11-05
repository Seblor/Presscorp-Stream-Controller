<script lang="ts">
  import discordBot from "../../connections/DiscordBot";
  import TreeView from "../VoiceChannelTreeView.svelte";
  import voiceChannelIcon from "../../assets/voiceChannelIcon.svg";
  import DeleteIcon from "virtual:icons/mdi/delete";
  import VoiceChannelMembers from "../VoiceChannelMembers.svelte";

  type TreeData = {
    label: string;
    id: string | null;
    img?: string;
    children?: TreeData[];
  };

  let treeData: TreeData = $state({
    label: "Voice Channels",
    id: null,
    children: [],
  });

  let selectedChannelId = $state(
    localStorage.getItem("selectedChannelId") || "",
  );

  let selectedChannelName = $derived.by(() => {
    return discordBot.getChannelName(selectedChannelId);
  });

  $effect(() => {
    setVoiceChannelId(selectedChannelId);
  });

  function setVoiceChannelId(newId: string) {
    if (newId) {
      localStorage.setItem("selectedChannelId", selectedChannelId);
      discordBot.joinVoicechannel(selectedChannelId);
    } else {
      discordBot.leaveVoiceChannel();
    }
    selectedChannelId = newId;
  }

  function updateChannels() {
    treeData.children = [];
    discordBot.getAllVoiceChannels().forEach((channel) => {
      let guild = treeData.children.find(
        (guild) => guild.id === channel.guildId,
      );
      if (guild === undefined) {
        guild = {
          id: channel.guildId,
          label: channel.guildName,
          img: channel.guildIconUrl,
          children: [],
        };
        treeData.children.push(guild);
      }

      guild.children.push({
        label: channel.channelName,
        id: channel.channelId,
      });
    });
  }

  discordBot.onLogin(() => {
    updateChannels();
  });

  discordBot.onVoiceChannelsChange(() => {
    updateChannels();
  });
</script>

<div class="h-full">
  {#if selectedChannelId}
    <div class="relative">
      <h1 class="text-xl text-center py-2">
        <span class="flex justify-center">
          <img src={voiceChannelIcon} alt="voice channel icon" class="mr-1" />
          {selectedChannelName}
        </span>
      </h1>
      <DeleteIcon
        onclick={() => {
          if (confirm("Are you sure you want to unset this channel?")) {
            selectedChannelId = "";
          }
        }}
        class="cursor-pointer text-xl absolute top-1/2 -translate-y-1/2 right-0 -translate-x-1/2 text-red-500"
      />
    </div>
    <hr class="mx-4 mb-2" />
    <VoiceChannelMembers />
  {:else}
    <h1 class="text-xl text-center py-2">Choose a voice channel</h1>
    <hr class="mx-4" />
    <TreeView tree={treeData} bind:value={selectedChannelId} />
  {/if}
</div>
<!-- <pre>{JSON.stringify(treeData, null, 2)}</pre> -->
