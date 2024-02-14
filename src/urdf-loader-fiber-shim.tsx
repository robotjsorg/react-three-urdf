import { LoadingManager, Object3D } from "three"
import URDFLoader, { URDFRobot } from "urdf-loader"

export default class URDFLoaderShim extends URDFLoader {
  crossOrigin = "anonymous"
  withCredentials = false
  path = ""
  resourcePath = ""
  requestHeader = {}
  onMeshLoad = (obj: Object3D, err?: Error) => {}
  loadMeshCb = (
    url: string,
    manager: LoadingManager,
    onLoad: (obj: Object3D, err?: Error) => void
  ) => {
    this.defaultMeshLoader(url, manager, (loadedObj: Object3D, err?: Error) => {
      onLoad(loadedObj, err)
      this.onMeshLoad(loadedObj, err)
    })
  }
  load(
    url: string,
    onLoad: (robot: URDFRobot) => void,
    onProgress?: (event: ProgressEvent<EventTarget>) => void,
    onError?: (event: ErrorEvent) => void
  ) {
    super.load(url, onLoad, onProgress as () => void, onError as () => void)
  }
  loadAsync(url: string, onProgress?: (event: ProgressEvent) => void) {
    return new Promise((resolve, reject) => {
      this.load(
        url,
        (value) => {
          resolve(value)
        },
        onProgress,
        () => reject()
      )
    })
  }
  setCrossOrigin(value: string) {
    this.crossOrigin = value
    return this
  }
  setWithCredentials(value: boolean) {
    this.withCredentials = value
    return this
  }
  setPath(value: string) {
    this.path = value
    return this
  }
  setResourcePath(value: string) {
    this.resourcePath = value
    return this
  }
  setRequestHeader(value: { [header: string]: string }) {
    this.requestHeader = value
    return this
  }
}