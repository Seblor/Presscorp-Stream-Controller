<script lang="ts">
  import discordBot from "../connections/DiscordBot";
  import mutedIcon from "../assets/mutedIcon.svg";
  import streamingIcon from "../assets/streamingIcon.svg";

  const voiceMembers: {
    id: string;
    name: string;
    isMuted: boolean;
    isStreaming: boolean;
    iconUrl: string;
  }[] = $state([]);

  const speakingMembers = $state([]);

  discordBot.onVoiceMembersChange((members) => {
    voiceMembers.splice(0, voiceMembers.length, ...members);
  });

  discordBot.onVoiceActivity(() => {
    voiceMembers.splice(
      0,
      voiceMembers.length,
      ...discordBot.getCurrentVoiceChannelMembers(),
    );
    speakingMembers.splice(
      0,
      speakingMembers.length,
      ...Object.keys(discordBot.peopleSpeaking).filter(
        (id) => discordBot.peopleSpeaking[id],
      ),
    );
  });
</script>

<div class="flex flex-col">
  {#each voiceMembers as member}
    <div class="flex items-center p-2 relative">
      <img
        class="w-8 h-8 rounded-full"
        src={member.iconUrl}
        alt={member.name}
      />
      <div
        class={`absolute w-8 h-8 rounded-full ${speakingMembers.includes(member.id) ? "border-2 border-green-500" : ""}`}
      ></div>
      <div class="flex ml-2 gap-2">
        <p>{member.name}</p>
        {#if member.isMuted}
          <img src={mutedIcon} alt="voice channel icon" class="mr-1 text-white" />
        {/if}
        {#if member.isStreaming}
          <img src={streamingIcon} alt="voice channel icon" class="mr-1" />
        {/if}
      </div>
    </div>
  {/each}
</div>
