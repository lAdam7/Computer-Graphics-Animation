import * as THREE from "three"

export default class TopView { // build mode top-down camera
    
    constructor(camera) {
        // moving/rotation using 2 variables so if the opposite button is also held camera doesn't move 
        // in only one direciton e.g. (pressing a & d) at same time
        this.camera = camera;
        this.moving = new THREE.Vector3(0, 0, 0); // S & D & o keypress
        this.moving2 = new THREE.Vector3(0, 0, 0); // W & A & i keypress
        this.speed = 0.5; // increment used for moving camera every frame on key presses
        this.enabled = true; // is camera active? (build mode only)
        this.rotation = new THREE.Vector3(0, 0, 0); // e keypress
        this.rotation2 = new THREE.Vector3(0, 0, 0); // q keypress
    }

    startCamera() {
        this.camera.position.set(0, 225, 0); // default camera pos when entering in build mode
        this.camera.lookAt(new THREE.Vector3( 0, 0, 0 )); // rotation directly down
        var self = this; // event listner can access

        function onKey(event) {  // key presses for build cam
            if (!self.enabled) { // remove listerns if cam no longer enabled
                window.removeEventListener('keydown', onKey);
                window.removeEventListener('keyup', onKey);
            }
            
            switch (event.keyCode) { // if keydown enter increment, else 0 (keyup event)
                case 87: // W
                    self.moving2.y = (event.type === 'keydown') ? self.speed : 0;
                break;
                case 83: // S
                    self.moving.y = (event.type === 'keydown') ? -self.speed : 0;
                break;
                case 65: // A
                    self.moving2.x = (event.type === 'keydown') ? -self.speed : 0;
                break;
                case 68: // D
                    self.moving.x = (event.type === 'keydown') ? self.speed : 0;
                break;
                case 81: // q
                    self.rotation2.z = (event.type === 'keydown') ? 0.015: 0;
                break;
                case 69: // e
                    self.rotation.z = (event.type === 'keydown') ? -0.015: 0;
                break;
                case 73: // i
                    self.moving2.z = (event.type === 'keydown') ? -self.speed : 0;
                break;
                case 79: // o
                    self.moving.z = (event.type === 'keydown') ? self.speed : 0;
                break;
            }
        }
        // inital startCamera called, add event listerns for key-press
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
    }

    clear() { // reset all moving vectors (prevents moving in post-direction before exiting build mode prior)
        this.moving.set(0, 0, 0);
        this.moving2.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.rotation2.set(0, 0, 0);
    }

    process() { // called every frame from main render
        // combine all relevent vectors so if A & D are both pressed translation = 0 
        // rather than going in most recent event direction
        this.camera.translateX(this.moving.x + this.moving2.x);
        this.camera.translateY(this.moving.y + this.moving2.y);
        this.camera.translateZ(this.moving.z + this.moving2.z);
        this.camera.rotation.z += (this.rotation.z + this.rotation2.z);
    }
}