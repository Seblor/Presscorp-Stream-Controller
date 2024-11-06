<script lang="ts">
  import discordBot from "../connections/DiscordBot";
  import mutedIcon from "../assets/mutedIcon.svg";
  import streamingIcon from "../assets/streamingIcon.svg";
  import { appSettings } from "../stores/settings";
  import obsConnector from "../connections/OBS";
  import debounce from "lodash/debounce";
  import { openStream } from "../connections/Browser";

  let botRole = $state("");
  let isSomeoneSpeaking = $state(false);
  let isSomeoneStreaming = $state(false);

  appSettings.subscribe((settings) => {
    botRole = settings.botRole;
  });

  const voiceMembers: {
    id: string;
    name: string;
    isMuted: boolean;
    isStreaming: boolean;
    iconUrl: string;
    roles: Array<string>;
  }[] = $state([]);

  const speakingMembers: string[] = $state([]);

  discordBot.onLogin(async () => {
    updateMembersList(discordBot.getCurrentVoiceChannelMembers());
  });

  discordBot.onVoiceMembersChange((members) => {
    updateMembersList(members);
  });

  discordBot.onVoiceActivity(() => {
    updateMembersList(discordBot.getCurrentVoiceChannelMembers());
    const speakingMemberIds = Object.keys(discordBot.peopleSpeaking);
    speakingMembers.splice(
      0,
      speakingMembers.length,
      ...speakingMemberIds.filter((id) => discordBot.peopleSpeaking[id]),
    );

    if (isSomeoneSpeaking !== speakingMembers.length > 0) {
      isSomeoneSpeaking = speakingMembers.length > 0;

      if (isSomeoneSpeaking) {
        reduceBackgroundVolume();
      } else {
        restoreBackgroundVolume();
      }
    }
  });

  function reduceBackgroundVolume() {
    obsConnector.setInputsVolume(
      $appSettings.inputsToMuteOnSpeaking,
      $appSettings.backgroundVolumeSpeaking,
    );
  }

  const restoreBackgroundVolume = debounce(() => {
    obsConnector.setInputsVolume(
      $appSettings.inputsToMuteOnSpeaking,
      $appSettings.backgroundVolumeSilence,
    );
  }, 5e3);

  function updateMembersList(newList: typeof voiceMembers) {
    voiceMembers.splice(0, voiceMembers.length, ...newList);

    if (botRole) {
      if (
        newList.filter((member) => !member.roles.includes(botRole)).length > 0
      ) {
        obsConnector.startRecording();
      } else {
        obsConnector.stopRecording();
      }
    }

    const streamingMember = newList.find((member) => member.isStreaming);
    if (isSomeoneStreaming !== Boolean(streamingMember)) {
      isSomeoneStreaming = Boolean(streamingMember);
      if (isSomeoneStreaming) {
        openStream(streamingMember.name).then(() => {
          obsConnector.changeScene($appSettings.memberStreamSceneUuid);
        });
      } else {
        obsConnector.changeScene($appSettings.defaultSceneUuid);
      }
    }
  }
</script>

<div class="flex flex-col">
  {#each voiceMembers as member}
    <div
      class={`flex items-center p-2 relative ${member.roles.includes(botRole) ? "opacity-30" : ""}`}
    >
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
          <img
            src={mutedIcon}
            alt="voice channel icon"
            class="mr-1 text-white"
          />
        {/if}
        {#if member.isStreaming}
          <img src={streamingIcon} alt="voice channel icon" class="mr-1" />
        {/if}
      </div>
    </div>
  {/each}
</div>
