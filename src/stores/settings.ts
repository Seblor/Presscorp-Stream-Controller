import { get, writable } from "svelte/store";

const storedSettings = localStorage.getItem('appSettings');

export const appSettings = writable<{
  selectedChannelId: string,
  botRole: string,
  orderBottom: boolean,
  casterRole: string,
  recordingGracePeriodSeconds: number,
  defaultSceneUuid: string,
  memberStreamVideoSceneUuid: string,
  memberStreamAudioSceneUuid: string,
  defaultSceneOnStream: 'video' | 'audio',
  backgroundVolumeSpeaking: number,
  backgroundVolumeSilence: number,
  backgroundMuteDelaySeconds: number,
  inputsToMuteOnSpeaking: Array<string>,
}>({
  selectedChannelId: "",
  botRole: "",
  orderBottom: false,
  casterRole: "",
  recordingGracePeriodSeconds: 5,
  defaultSceneUuid: "",
  memberStreamVideoSceneUuid: '',
  memberStreamAudioSceneUuid: '',
  defaultSceneOnStream: 'video',
  backgroundVolumeSpeaking: 0.5,
  backgroundVolumeSilence: 1,
  backgroundMuteDelaySeconds: 5,
  inputsToMuteOnSpeaking: [],
  ...storedSettings ? JSON.parse(storedSettings) : {}
})

appSettings.subscribe((value) => {
  if (value.selectedChannelId === '' && value.botRole !== '') {
    appSettings.update((settings) => {
      settings.botRole = '';
      return settings;
    })
  }

  localStorage.setItem('appSettings', JSON.stringify(value));
})

const migrations: Array<Function> = [
  () => {
    if (Object.hasOwn(get(appSettings), 'memberStreamSceneUuid')) {
      appSettings.update((settings) => {
        settings.memberStreamVideoSceneUuid = settings['memberStreamSceneUuid'];
        delete settings['memberStreamSceneUuid'];
        return settings
      })
    }
  }
];

function applyMigrations () {
  migrations.forEach((migration) => migration());
}

applyMigrations();
