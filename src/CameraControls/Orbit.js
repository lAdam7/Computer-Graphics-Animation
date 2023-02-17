import { OrbitControls } from "../../libraries/OrbitControls.js"

export default class OrbitControl {
    constructor(camera, renderer) { // setup Orbit controls
        this.controls = new OrbitControls( camera, renderer.domElement );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.75;
        this.controls.screenSpacePanning = false;
    }

    set enableCamera(boolean) { // disabled when in build mode
        this.controls.enabled = boolean;
    }
}