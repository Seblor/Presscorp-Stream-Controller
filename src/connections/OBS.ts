
import { OBSWebSocket, EventSubscription } from "obs-websocket-js";
import { get, writable } from "svelte/store";
import { appSettings } from "../settings";

class OBSConnector {
  obs = new OBSWebSocket();
  isLoggedIn = writable(false);
  loginPromise: Promise<any>;
  loginResolver: Function = () => { };
  isRecording = writable(false);
  isStreaming = writable(false);
  scenes = writable<Array<{ name: string, uuid: string }>>([]);
  currentSceneUuid = writable<string>("");

  stopRecordGracePeriodTimeout: NodeJS.Timeout | undefined;

  constructor() {
    this.loginPromise = new Promise(resolve => {
      this.loginResolver = resolve;
    })
  }

  async login (port = "4455", password = "sdaBa5DgTQcJEi94") {
    this.obs.connect(`ws://127.0.0.1:${port}`, password, {
      eventSubscriptions:
        EventSubscription.All | EventSubscription.InputVolumeMeters,
    }).then(() => {
      this.loginResolver();
    }).catch((error) => {
      console.error("Error connecting to OBS", error);
    });

    this.loginPromise = Promise.resolve((resolve: Function) => {
      this.loginResolver = resolve;
    });

    this.loginResolver();

    this.isLoggedIn.set(true);

    this.obs.once('Identified', async () => {
      const getRecordingStatusReponse = await this.obs.call('GetRecordStatus')
      this.isRecording.set(getRecordingStatusReponse.outputActive);

      const getStreamingStatusReponse = await this.obs.call('GetStreamStatus')
      this.isStreaming.set(getStreamingStatusReponse.outputActive);

      this.updateScenesList();

      const getCurrentSceneResponse = await this.obs.call('GetCurrentProgramScene')
      this.currentSceneUuid.set(getCurrentSceneResponse.sceneUuid);
    });

    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this.currentSceneUuid.set(data.sceneUuid);
    });

    this.obs.on('RecordStateChanged', (status) => {
      this.isRecording.set(status.outputActive);
    });

    this.obs.on('StreamStateChanged', (status) => {
      this.isStreaming.set(status.outputActive);
    });

    this.obs.on('SceneListChanged', () => {
      this.updateScenesList();
    });

  }

  private async updateScenesList () {
    const getScenesResponse = await this.obs.call('GetSceneList')
    const fetchedScenes = getScenesResponse.scenes as Array<{ sceneIndex: number, sceneName: string, sceneUuid: string }>;
    this.scenes.set(
      fetchedScenes.map((scene) => ({
        name: scene.sceneName,
        uuid: scene.sceneUuid,
      }))
    );
  }

  async startRecording () {
    if (this.stopRecordGracePeriodTimeout !== undefined) {
      clearTimeout(this.stopRecordGracePeriodTimeout);
      this.stopRecordGracePeriodTimeout = undefined;
      return;
    }
    if (!get(this.isRecording)) {
      await this.obs.call("StartRecord");
    }
  }

  stopRecording () {
    this.stopRecordGracePeriodTimeout = setTimeout(async () => {
      if (get(this.isRecording)) {
        await this.obs.call("StopRecord");
      }
      this.stopRecordGracePeriodTimeout = undefined;
    }, get(appSettings).recordingGracePeriodSeconds * 1000);
  }

  setInputsVolume (inputUuids: Array<string>, volume: number) {
    return inputUuids.map((input) => this.obs.call('SetInputVolume', { inputUuid: input, inputVolumeMul: volume }));
  }

  changeScene (sceneUuid: string) {
    return this.obs.call('SetCurrentProgramScene', { sceneUuid });
  }
}

const obsConnector = new OBSConnector();

window["obsConnector"] = obsConnector;

export default obsConnector;
