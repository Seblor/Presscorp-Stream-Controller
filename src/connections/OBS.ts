
import { OBSWebSocket, EventSubscription } from "obs-websocket-js";
import { get, writable } from "svelte/store";
import { appSettings } from "../stores/settings";

class OBSConnector {
  obs = new OBSWebSocket();
  isLoggedIn = writable(false);
  isRecording = writable(false);
  isStreaming = writable(false);
  scenes = writable<Array<{ name: string, uuid: string }>>([]);
  currentSceneUuid = writable<string>("");

  stopRecordGracePeriodTimeout: NodeJS.Timeout | undefined;

  async login (port = "4455", password = "sdaBa5DgTQcJEi94"): Promise<boolean> {
    const connectionResult = await this.obs.connect(`ws://127.0.0.1:${port}`, password, {
      eventSubscriptions:
        EventSubscription.All | EventSubscription.InputVolumeMeters,
    })
      .then(() => {
        return this.obs.identified || new Promise<boolean>((resolve) => {
          this.obs.once('Identified', () => resolve(true));
        });
      })
      .catch((error) => {
        console.error("Error connecting to OBS", error);
        return false
      });

    if (!connectionResult) {
      return false;
    }

    this.isLoggedIn.set(true);

    const getRecordingStatusReponse = await this.obs.call('GetRecordStatus')
    this.isRecording.set(getRecordingStatusReponse.outputActive);

    const getStreamingStatusReponse = await this.obs.call('GetStreamStatus')
    this.isStreaming.set(getStreamingStatusReponse.outputActive);

    this.updateScenesList();

    const getCurrentSceneResponse = await this.obs.call('GetCurrentProgramScene')
    this.currentSceneUuid.set(getCurrentSceneResponse.sceneUuid);

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

    return true;
  }

  private async updateScenesList () {
    if (!get(this.isLoggedIn)) {
      return;
    }
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
    if (!get(this.isLoggedIn)) {
      return;
    }
    if (this.stopRecordGracePeriodTimeout !== undefined) {
      clearTimeout(this.stopRecordGracePeriodTimeout);
      this.stopRecordGracePeriodTimeout = undefined;
      return;
    }
    if (!get(this.isRecording)) {
      await this.obs.call("StartRecord");
    }
  }

  async stopRecording (force: boolean = false) {
    if (!get(this.isLoggedIn)) {
      return;
    }
    if (force) {
      await this.obs.call("StopRecord");
      return;
    }
    this.stopRecordGracePeriodTimeout = setTimeout(async () => {
      if (get(this.isRecording)) {
        await this.obs.call("StopRecord");
      }
      this.stopRecordGracePeriodTimeout = undefined;
    }, get(appSettings).recordingGracePeriodSeconds * 1000);
  }

  async setInputsVolume (inputUuids: Array<string>, volume: number) {
    if (!get(this.isLoggedIn)) {
      return;
    }
    return inputUuids.map((input) => this.obs.call('SetInputVolume', { inputUuid: input, inputVolumeMul: volume }));
  }

  async changeScene (sceneUuid: string) {
    if (!get(this.isLoggedIn)) {
      return;
    }
    if (sceneUuid) {
      return this.obs.call('SetCurrentProgramScene', { sceneUuid });
    }
  }
}

const obsConnector = new OBSConnector();

window["obsConnector"] = obsConnector;

export default obsConnector;
