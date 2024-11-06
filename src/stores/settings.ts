import { writable } from "svelte/store";

const storedSettings = localStorage.getItem('appSettings')

export const appSettings = writable<{
  selectedChannelId: string,
  botRole: string,
  recordingGracePeriodSeconds: number,
  defaultSceneUuid: string,
  memberStreamSceneUuid: string,
  backgroundVolumeSpeaking: number,
  backgroundVolumeSilence: number,
  inputsToMuteOnSpeaking: Array<string>,
}>({
  selectedChannelId: "",
  botRole: "",
  recordingGracePeriodSeconds: 5,
  defaultSceneUuid: "",
  memberStreamSceneUuid: "",
  backgroundVolumeSpeaking: 0.5,
  backgroundVolumeSilence: 1,
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