import { writable } from "svelte/store";
import { appSettings } from "./settings";

const storedObsCredentials = localStorage.getItem('obsCredentials') ?? '{}'

export const discordToken = writable<string>(localStorage.getItem('discordCredentials') ?? '')

discordToken.subscribe((value) => {
  if (!value) {
    appSettings.update((settings) => {
      settings.selectedChannelId = '';
      return settings;
    })
  }
  localStorage.setItem('discordCredentials', value);
})

export const obsCredentials = writable<{
  obsWebsocketPort: string,
  obsWebsocketPassword: string,
}>({
  obsWebsocketPort: '',
  obsWebsocketPassword: '',
  ...storedObsCredentials ? JSON.parse(storedObsCredentials) : {}
})

obsCredentials.subscribe((value) => {
  localStorage.setItem('obsCredentials', JSON.stringify(value));
})
