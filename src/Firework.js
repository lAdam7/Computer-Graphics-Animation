import * as THREE from "three"

function randFloat(min, max) {
    return Math.random() * (max - min) + min
}

export default class Firework {
    constructor(pos, multiExplode, camera, scene) { // starting pos of firework (x & z) axis
        this.sound = null;
        this.pos = pos; // start pos
        this.remove = false; // remove from animated objects array getting called every frame
        this.dest = []; // destination of particle
        this.colors = []; // colour of particle
        this.geometry = null;
        this.points = null; // Three.Points
        this.from = null; // y pos start
        this.exploding = false;
        this.incrementSpeed = 20;
        this.multiExplode = multiExplode;
        this.material = new THREE.PointsMaterial({
            size: 3,
            color: 0xFFFFFF,
            opacity: 1,
            vertexColors: true,
            transparent: true,
            depthTest: false
        });
        const listener = new THREE.AudioListener();
        camera.add( listener ); // set audio to camera (plays regardless on position)
        const sound = new THREE.Audio( listener );
                
        const audioLoader = new THREE.AudioLoader(); // https://www.zapsplat.com/music/firework-distant-explosion/
        audioLoader.load("assets/sounds/explosion.mp3", function( buffer ) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.75);
        });
        this.sound = sound;
        this.launch(scene); // intial launch / setup
    }

    launch(scene) { // start firework
        this.geometry = new THREE.BufferGeometry();
        this.from = []; // clear
        this.from.push(this.pos.x, Math.random() * (10 - -5) + -5, this.pos.z); // start pos on y axis (first launch)
        this.dest = []; // clear
        this.dest.push(this.pos.x, Math.random() * (125 - 50) + 50, this.pos.z); // end pos on y axis (explosion starts once hits this pos)
        this.colors.push(255, 255, 255); // same colour for initial launch / only one particle for this phase
        
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.from, 3)); // set positions 1x3
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3)); // set rotations  1x3

        this.points = new THREE.Points(this.geometry, this.material); // create points
        scene.add(this.points);
    }

    explode(oldVector, scene) { // launch phase ended and particle has reached its y destination pos
        scene.remove(this.points); // remove old points
        // reset from old particle points
        var oldColors = this.colors;
        this.dest = [];
        this.colors = [];
        this.geometry = new THREE.BufferGeometry();
        this.from = [];
        this.exploding = true;
        this.material.opacity = 1;
        var sameColour = (oldVector.length >= 10 && oldVector.length <= 30) // explosion one colour, or random
                       ? true
                       : false;
       
        var particles = 200;
        var distance = 50
        if (this.multiExplode) { // first explosion just few particles for bigger after
            particles = 4;
            distance = 70;
            this.multiExplode = false;
        }

        const color = new THREE.Color();
        for (var i = 0; i < oldVector.length; i+=3) { // for every particle that just reached destination
            if (sameColour) { color.setRGB(oldColors[i], oldColors[i+1], oldColors[i+2]); } // explosion same colour of first particle
            for (var b = 0; b < particles; b++) { // 200 particles in explosion
                if (!sameColour) { color.setHex( Math.random() * 0xffffff ); } // random colour
                this.colors.push(color.r, color.g, color.b); // explosion unique colour
                this.from.push( // random start pos from explosion start using random
                    randFloat(oldVector[i] - 10, oldVector[i] + 10),
                    randFloat(oldVector[i+1] - 10, oldVector[i+1] + 10),
                    randFloat(oldVector[i+2] - 10, oldVector[i+2] + 10)
                );
                this.dest.push( // destination of particles for explosion using random
                    randFloat(oldVector[i] - distance, oldVector[i] + distance),
                    randFloat(oldVector[i+1] - distance, oldVector[i+1] + distance),
                    randFloat(oldVector[i+2] - distance, oldVector[i+2] + distance)
                );   
            }
        }
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.from, 3)); // set positions 1x3
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3)); // set rotations 1x3
        
        this.points = new THREE.Points(this.geometry, this.material); // create points
        scene.add(this.points);
    }

    animateObj(iFrame, scene) { // called every frame
        if (this.points && this.geometry) { // update points positions towards destination
            var total = this.geometry.getAttribute('position').array; // get set array
            for (var i = 0; i < total.length; i+=3) { // covers x, y, z per iteration move towards destination
                total[i] += (this.dest[i] - total[i]) / this.incrementSpeed; // x
                total[i+1] += (this.dest[i+1] - total[i+1]) / this.incrementSpeed; // y
                total[i+2] += (this.dest[i+2] - total[i+2]) / this.incrementSpeed; // z
            }
            this.geometry.getAttribute('position').needsUpdate = true;

            if(Math.ceil(total[1]) > this.dest[1] - 2 && !this.exploding) { // y pos reached for initial phase start explosion and play sound
                this.sound.play();
                this.explode(total, scene);
            } else if (total.length <= 30 && this.material.opacity <= 0.3 && this.exploding) { // second explosion
                this.explode(total, scene);
            } else if (total.length > 2 && this.material.opacity >= 0) { // explode currently happening, phase the points out
                this.material.opacity -= 0.015;
                this.material.colorsNeedUpdate = true;
            } else if (this.material.opacity <= 0 && total.length > 3) { // firework finished, reset everything and mark for removal
                this.sound.stop();
                scene.remove(this.points);
                scene.remove(this.sound);
                this.dest = [];
                this.colors = [];
                this.geometry = null;
                this.points = null;
                this.remove = true;
            }
        }
    }
}