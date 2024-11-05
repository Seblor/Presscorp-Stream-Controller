import { writable } from "svelte/store";

const storedSettings = localStorage.getItem('appSettings')

export const appSettings = writable<{
  botRole: string,
  recordingGracePeriodSeconds: number,
  defaultSceneUuid: string,
  memberStreamSceneUuid: string,
  backgroundVolumeSpeaking: number,
  backgroundVolumeSilence: number,
  inputsToMuteOnSpeaking: Array<string>,
}>({
  botRole: "",
  recordingGracePeriodSeconds: 5000,
  defaultSceneUuid: "",
  memberStreamSceneUuid: "",
  backgroundVolumeSpeaking: 1,
  backgroundVolumeSilence: 0.5,
  inputsToMuteOnSpeaking: [],
  ...storedSettings ? JSON.parse(storedSettings) : {}
})

appSettings.subscribe((value) => {
  localStorage.setItem('appSettings', JSON.stringify(value));
})