<script lang="ts">
  let {
    isOpen = $bindable(false),
  }: {
    isOpen: boolean;
  } = $props();

  function close() {
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      close();
    }
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    onclick={handleBackdropClick}
  >
    <div
      class="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="sticky top-0 bg-slate-700 px-6 py-4 border-b border-slate-600 flex justify-between items-center"
      >
        <h1 class="text-2xl font-bold text-white">Documentation</h1>
        <button
          onclick={close}
          class="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-slate-600"
        >
          ×
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-6 space-y-6 text-gray-200">
        <!-- Overview -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">🎮 Overview</h2>
          <p class="text-gray-300 leading-relaxed">
            PressCorp Stream Controller is an Electron app that integrates
            Discord, OBS, and browser extensions to automate your streaming
            workflow. It monitors voice channel activity, controls OBS scenes,
            and manages audio levels automatically.
          </p>
        </section>

        <!-- Discord Bot Setup -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🤖 Discord Bot Setup
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <p>
              <strong class="text-white">1. Get a Bot Token:</strong>
              Visit the
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                class="text-blue-400 hover:text-blue-300 underline"
                >Discord Developer Portal</a
              >
              to create a bot and get your token.
            </p>
            <p>
              <strong class="text-white">2. Bot Permissions:</strong> Your bot needs
              the following permissions:
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>View Channels</li>
              <li>Send Messages</li>
              <li>Connect to Voice Channels</li>
              <li>Use Slash Commands</li>
              <li>Manage Nicknames (to show recording status)</li>
            </ul>
            <p>
              <strong class="text-white">3. Login:</strong> Paste your bot token
              in the Bot Info panel and click "Log in".
            </p>
          </div>
        </section>

        <!-- Voice Channel Selection -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🎙️ Voice Channel Selection
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <p>
              After logging in, select a voice channel from the tree view. The
              bot will join this channel and monitor activity:
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong class="text-white">Member tracking:</strong> See who's in
                the voice channel
              </li>
              <li>
                <strong class="text-white">Speaking detection:</strong> Monitor who's
                currently speaking
              </li>
              <li>
                <strong class="text-white">Streaming detection:</strong> Detect when
                members start streaming
              </li>
              <li>
                <strong class="text-white">Recording indicator:</strong> Bot's nickname
                changes to show "On Air" when recording
              </li>
            </ul>
          </div>
        </section>

        <!-- Settings Panel -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            ⚙️ Settings Panel
          </h2>
          <div class="space-y-3 text-gray-300 leading-relaxed">
            <div>
              <h3 class="text-lg font-medium text-white mb-1">
                Discord Settings
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong class="text-white">Caster Role:</strong> Members with this
                  role can use slash commands to control OBS
                </li>
                <li>
                  <strong class="text-white">Bot Role:</strong> Members with this
                  role are ignored by the app (useful for other bots)
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-medium text-white mb-1">OBS Scenes</h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong class="text-white">Default Scene:</strong> The scene to
                  return to when no one is streaming
                </li>
                <li>
                  <strong class="text-white">Discord Audio Scene:</strong> Automatically
                  switches to this scene when someone starts streaming (audio only)
                </li>
                <li>
                  <strong class="text-white">Discord Video Scene:</strong> Automatically
                  switches to this scene when the browser opens the video stream
                  (using the browser extension)
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-medium text-white mb-1">
                Audio Volume Control
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong class="text-white">Volume When Speaking:</strong> Background
                  track volume when someone is talking (0-1, where 1 = 100%)
                </li>
                <li>
                  <strong class="text-white">Volume When Silence:</strong> Background
                  track volume when no one is talking
                </li>
                <li>
                  <strong class="text-white">Background Mute Delay:</strong> Seconds
                  to wait after speaking stops before restoring background volume
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-medium text-white mb-1">
                Recording Settings
              </h3>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong class="text-white">Recording Grace Period:</strong> Seconds
                  to wait after the last person leaves before stopping recording
                </li>
                <li>
                  <strong class="text-white">Order Bottom:</strong> When enabled,
                  the bot appears at the bottom of member list when recording (using
                  different ASCII characters around the "ON AIR" prefix)
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- OBS Mixer Panel -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🎚️ OBS Mixer Panel
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <p>
              The OBS Mixer shows all your audio inputs with real-time volume
              meters:
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong class="text-white">🎵 Music Icon:</strong> Click to mark
                an input as a "background track". These tracks will have their volume
                automatically reduced when someone speaks in Discord
              </li>
              <li>
                <strong class="text-white">Volume Control:</strong> Adjust input
                volume with the slider
              </li>
              <li>
                <strong class="text-white">Mute Button:</strong> Click the speaker
                icon to mute/unmute an input
              </li>
              <li>
                <strong class="text-white">Volume Meter:</strong> Visual feedback
                showing current audio levels (green/yellow/red)
              </li>
            </ul>
          </div>
        </section>

        <!-- Slash Commands -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            ⌨️ Discord Slash Commands
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <p>
              Members with the Caster role can use these commands in Discord:
            </p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong class="text-white">/start-recording:</strong> Start OBS recording
              </li>
              <li>
                <strong class="text-white">/stop-recording:</strong> Stop OBS recording
              </li>
              <li>
                <strong class="text-white">/change-scene:</strong> Switch
                between scenes:
                <ul class="list-circle list-inside ml-6 mt-1">
                  <li>
                    <code class="bg-slate-700 px-1 rounded">default</code> - Your
                    configured default scene
                  </li>
                  <li>
                    <code class="bg-slate-700 px-1 rounded">audio</code> - Discord
                    audio scene
                  </li>
                  <li>
                    <code class="bg-slate-700 px-1 rounded">video</code> - Discord
                    video scene
                  </li>
                  <li>
                    <code class="bg-slate-700 px-1 rounded">custom</code> - Choose
                    any scene (with autocomplete)
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        <!-- Browser Extension -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🌐 Browser Extension Integration
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <p>
              The app includes a WebSocket server (port 4444) for browser
              extension communication. Install the userscript to get additional
              features like opening streams directly from the app.
            </p>
            <p class="text-sm text-gray-400">
              Check the <code class="bg-slate-700 px-1 rounded">public/</code> folder
              for the userscript file.
            </p>
          </div>
        </section>

        <!-- Workflow Example -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🎬 Typical Workflow
          </h2>
          <div class="space-y-2 text-gray-300 leading-relaxed">
            <ol class="list-decimal list-inside ml-4 space-y-2">
              <li>
                <strong class="text-white">Setup:</strong> Log in to Discord bot
                and OBS
              </li>
              <li>
                <strong class="text-white">Configure:</strong> Set your roles, scenes,
                and volume levels in Settings
              </li>
              <li>
                <strong class="text-white">Mark Background Tracks:</strong> In OBS
                Mixer, click the music icon on music/game audio tracks
              </li>
              <li>
                <strong class="text-white">Select Voice Channel:</strong> Choose
                the Discord voice channel to monitor
              </li>
              <li>
                <strong class="text-white">Stream:</strong> When members join and
                speak, background tracks auto-duck
              </li>
              <li>
                <strong class="text-white">Recording:</strong> Use slash commands
                or manual controls to start/stop recording
              </li>
              <li>
                <strong class="text-white">Scene Switching:</strong> Scenes automatically
                change when members start streaming
              </li>
            </ol>
          </div>
        </section>

        <!-- Tips -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">💡 Tips</h2>
          <ul class="list-disc list-inside ml-4 space-y-1 text-gray-300">
            <li>
              Test your audio ducking levels before going live by having someone
              speak in the voice channel
            </li>
            <li>
              Use the recording grace period to avoid stopping recording if
              someone briefly disconnects
            </li>
            <li>
              The background mute delay prevents rapid volume changes when
              people pause between sentences
            </li>
            <li>Keep your bot token secure - never share it publicly</li>
          </ul>
        </section>

        <!-- Troubleshooting -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-3">
            🔧 Troubleshooting
          </h2>
          <ul class="list-disc list-inside ml-4 space-y-2 text-gray-300">
            <li>
              <strong class="text-white"
                >Bot takes too long to join voice channel:</strong
              >
              If the bot is slow to join or seems stuck, click the "Reconnect" button
              in the Bot Info panel. The bot will disconnect and reconnect, which
              usually resolves connection issues.
            </li>
            <li>
              <strong class="text-white"
                >Background music volume not reducing:</strong
              >
              Make sure you've properly designated your background tracks by clicking
              the music notes (🎵) icon next to each music/game audio track in the
              OBS Mixer panel. Only tracks marked with this icon will be automatically
              ducked when someone speaks.
            </li>
          </ul>
        </section>
      </div>

      <!-- Footer -->
      <div
        class="sticky bottom-0 bg-slate-700 px-6 py-4 border-t border-slate-600 flex justify-end"
      >
        <button
          onclick={close}
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom scrollbar */
  div::-webkit-scrollbar {
    width: 8px;
  }

  div::-webkit-scrollbar-track {
    background: rgb(51 65 85);
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb {
    background: rgb(100 116 139);
    border-radius: 4px;
  }

  div::-webkit-scrollbar-thumb:hover {
    background: rgb(148 163 184);
  }
</style>
