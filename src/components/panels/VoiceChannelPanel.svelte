<script lang="ts">
  import discordBot from "../../connections/DiscordBot";
  import TreeView from "../VoiceChannelTreeView.svelte";
  import voiceChannelIcon from "../../assets/voiceChannelIcon.svg";
  import DeleteIcon from "virtual:icons/mdi/delete";
  import VoiceChannelMembers from "../VoiceChannelMembers.svelte";
  import { appSettings } from "../../stores/settings";

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

  let selectedChannelName = $state("");

  // Update channel name when settings change
  appSettings.subscribe(() => {
    updateChannelName();
    if ($appSettings.selectedChannelId) {
      discordBot.joinVoicechannel($appSettings.selectedChannelId);
    } else {
      discordBot.leaveVoiceChannel();
    }
  });

  function updateChannelName() {
    if ($appSettings.selectedChannelId) {
      selectedChannelName = discordBot.getChannelName($appSettings.selectedChannelId);
    } else {
      selectedChannelName = "";
    }
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
    // Update channel name when channels are refreshed
    updateChannelName();
  }

  discordBot.onLogin(() => {
    updateChannels();
  });

  discordBot.onVoiceChannelsChange(() => {
    updateChannels();
  });
</script>

<div class="h-full">
  {#if $appSettings.selectedChannelId}
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
            $appSettings.selectedChannelId = "";
          }
        }}
        class="cursor-pointer text-xl absolute top-1/2 -translate-y-1/2 right-0 -translate-x-1/2 text-red-500"
      />
    </div>
    <hr class="mx-2 pb-2" />
    <VoiceChannelMembers />
  {:else}
    <h1 class="text-xl text-center py-2">Choose a voice channel</h1>
    <hr class="mx-4" />
    <TreeView tree={treeData} bind:value={$appSettings.selectedChannelId} />
  {/if}
</div>
<!-- <pre>{JSON.stringify(treeData, null, 2)}</pre> -->
