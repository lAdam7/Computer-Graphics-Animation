import * as THREE from "../libraries/three.js"

var scene = new THREE.Scene();

import OrbitControl  from "./CameraControls/Orbit.js"
import TopView from "./CameraControls/TopView.js"
import Road from "./Road.js"
import { FlagBuilding, FireworkBuilding, PirateShip, SphereBuilding } from "./Buildings.js"
import Firework from "./Firework.js"
import Car from "./Car.js"

var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 ); // Perspective projection parameters
camera.position.set(0, 0, 50);

var renderer = new THREE.WebGLRenderer({alpha: true}); // alpha allows background to be changed with CSS
renderer.setSize(window.innerWidth, window.innerHeight); // size of the 2D projection
document.body.appendChild(renderer.domElement); // connecting to the canvas

var orbitControls = new OrbitControl(camera, renderer); // start up orbit controls
var topView = new TopView(camera); // initalize (not enabled on start-up property needs changing for this)

var canPlace = true; // used to detect if the Placement instance can be placed (collision detection)
var buildMode = false; // currently in build view
var sceneControlStatus = false; // scene control menu currently open
var animatingObjects = []; // classes that have a 'animateObj()' method to be called every frame in the render loop
var storedBuildings = []; // classes of currently placed buildings
var storedRoads = []; // classes of currently placed roads
var clPlacement = null; // class of current object being placed (if any)

var texGrass = new THREE.TextureLoader().load("assets/textures/grass.jpg");
texGrass.wrapS = texGrass.wrapT = THREE.RepeatWrapping;
texGrass.repeat.set(60, 60);

var meshGround = new THREE.Mesh( // main floor
    new THREE.BoxGeometry(1080, 5, 1080),
    new THREE.MeshBasicMaterial({ color: 0x006E00, map: texGrass })
);
meshGround.position.set(0, -15, -20);
scene.add(meshGround);

var grid = new THREE.GridHelper(360, 60, 0x000000, 0x000000); // create black grid with 6x6 dimensions
grid.position.set(0, -12.4, -20); // pos to center of main floor

var showControls = false;
var controlsDiv = document.getElementById("controls");
var singleFirework = true; // used to vary between firework modes 
function onKeyPressed(event) {
    switch (event.keyCode) {
        case 90: // Z pressed (IN, show controls)
            if (!showControls) {
                showControls = true;
                controlsDiv.style.visibility = "visible";
            }
            break;
        case 67: // C pressed (cancel placing object)
            if (clPlacement !== null) {
                clPlacement.removeBoxHelper(scene);
                scene.remove(clPlacement.group); // remove object
                clPlacement = null; 
            }
            break;
        case 70: // F pressed (launch firework)            
            for (var i = 0; i < storedBuildings.length; i++) {
                if (storedBuildings[i] instanceof FireworkBuilding) {
                    animatingObjects.push(new Firework(storedBuildings[i].object.position, singleFirework, camera, scene)); // launch firework if its from a FireworkBuilding class
                }
            }
            singleFirework = !singleFirework; // switch to other firework mode for next key press
            break;
        case 13: // Enter pressed (spawn car)
            var createCar = new Car(storedRoads[0], scene, storedRoads); // create car, set spawn road
            animatingObjects.push(createCar); // add to animation render list
            break;
        case 80: // P pressed (scene control menu)
            sceneControl();
            break;
        case 66: // B pressed (build control menu)
            buildControl();
        break;
        case 82: // R pressed (rotate object if currently placing one)
            if (clPlacement !== null) {
                clPlacement.rotate(scene);
            }
        break;
    }
}
window.addEventListener('keydown', onKeyPressed);

function onKeyUp(event) {
    switch(event.keyCode) {
        case 90: // Z un-pressed (OUT, show controls)
            if (showControls) {
                showControls = false;
                controlsDiv.style.visibility = "hidden";
            }
            break;
    }
}
window.addEventListener('keyup', onKeyUp);      

var mouse = new THREE.Vector2(-10000, -10000);
function onMouseMove(event) { // keep mouse vec updated with current location
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 -1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

var hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
hemiLight.position.set( 0, 300, 0 );
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff );
dirLight.position.set( 75, 300, -75 );
scene.add( dirLight );

// Add the spot light
var lightThis = new THREE.SpotLight(0xffffff);
lightThis.position.x = 0;
lightThis.position.y = 50;
lightThis.position.z = 20;
lightThis.intensity = 1.0;
lightThis.penumbra = 0.50;
lightThis.angle = Math.PI/6;
scene.add(lightThis);
lightThis.target.position.x = 0;
lightThis.target.position.y = -50;
lightThis.target.position.z = 0;
scene.add(lightThis.target);

var world = new CANNON.World(); // setup cannon.js
world.gravity.set(0,-9.82,0);   // set gravity in negative y direction
world.solver.iterations = 20; // Increase solver iterations (default is 10)
world.solver.tolerance = 0.01;   // Force solver to use all iterations
world.broadphase = new CANNON.NaiveBroadphase();

// events using onclick in HTML for creating objects
document.getElementById("road").onclick = function() { if (clPlacement === null) { clPlacement = new Road("Road", scene); } }
document.getElementById("flagbuilding").onclick = function() { if (clPlacement === null) { clPlacement = new FlagBuilding("Block", scene); } }
document.getElementById("fireworkbuilding").onclick = function() { if (clPlacement === null) { clPlacement = new FireworkBuilding("Block", scene); } }
document.getElementById("pirateship").onclick = function() { if (clPlacement === null) { clPlacement = new PirateShip("Block", scene); } }
document.getElementById("spherebuilding").onclick = function() { if (clPlacement === null) { clPlacement = new SphereBuilding("Block", scene); } }

function hexToRGB(h) { // convert hex colour to RGB format for sky colour changing
    var hexColor = new THREE.Color(h);
    return {red: hexColor.r * 255, green: hexColor.g * 255, blue: hexColor.b * 255};
}

var spawnRoad = new Road("", scene); // create road where cars spawn
spawnRoad.setRoadSize(new THREE.Vector3(0, 0, 114), meshGround); // set size
spawnRoad.object.position.set( // hard-code position as built-in road won't allow out of border due to clamp
    3,
    -12.5 + (.5/2),
    -260
);
storedRoads.push(spawnRoad); // add to roads so connects to road is detected

/////////////////
var directionSlider = document.getElementById("directionRange"); // wind direction for flag
var directionOutput = document.getElementById("directionValue");
directionOutput.innerHTML = directionSlider.value;
directionSlider.oninput = function() { directionOutput.innerHTML = this.value; }

var weatherSlider = document.getElementById("weatherRange"); // weather speed dropping
var weatherOutput = document.getElementById("weatherValue");
weatherOutput.innerHTML = weatherSlider.value;
weatherSlider.oninput = function() { weatherOutput.innerHTML = this.value; }

var strengthSlider = document.getElementById("strengthRange"); // speed the flag moves
var strengthOutput = document.getElementById("strengthValue");
strengthOutput.innerHTML = strengthSlider.value;
strengthSlider.oninput = function() { strengthOutput.innerHTML = this.value; }

var timescaleSlider = document.getElementById("timescaleRange"); // speed the background fades between colours
var timescaleOutput = document.getElementById("timescaleValue");
timescaleOutput.innerHTML = timescaleSlider.value;
timescaleSlider.oninput = function() { timescaleOutput.innerHTML = this.value; updateBackgroundColours(); } // update colour change
document.getElementById("bgColour1").onchange = function() { updateBackgroundColours() }
document.getElementById("bgColour2").onchange = function() { updateBackgroundColours() }

document.getElementById("clearMainMenu").onclick = function() { // remove HTML from first load on project (triggered via button press)
    document.getElementById("mainScreen").style.visibility = "hidden";
}

function buildControl() { // B or Build button pressed
    var UI = document.getElementsByClassName("buildDiv")[0]; // get HTML element
    var id = null;
    if (buildMode) { // currently in build mode
        var pos = 0; // destination px pos
        buildMode = false;
        topView.enabled = false; // disable camera
        topView.clear(); // reset moving vectors
        orbitControls.enableCamera = true;
        document.getElementById("btnBuild").innerText = "Open Build Menu (B)"; // update text
        clearInterval(id); // reset
        id = setInterval(frame, 25);
        function frame() {
            if (pos == -250) { // moving done
                clearInterval(id); 
            } else {
                pos -= 10; // move UI by 10px
                UI.style.left = pos + "px";
            }
        }
        scene.remove(grid); // remove grid from scene
    } else { // not in build mode
        var pos = -200; // destination px pos
        buildMode = true;  
        orbitControls.enableCamera = false; // disable camera
        topView.enabled = true; // enable top view cam
        topView.startCamera(); // add event listners
        document.getElementById("btnBuild").innerText = "Close Build Menu (B)"; // update text
        clearInterval(id); // reset
        id = setInterval(frame, 25);
        function frame() {
            if (pos == 0) { // moving done
                clearInterval(id);
            } else {
                pos += 10; // move UI by 10px
                UI.style.left = pos + "px";
            }
        }
        scene.add(grid); // add grid to scene       
    }
}
document.getElementById("btnBuild").onclick = function() { buildControl() }

function sceneControl() { // P or Scene button pressed
    var UI = document.getElementsByClassName("sceneControlDiv")[0]; // get HTML element
    var id = null;
    if (sceneControlStatus) { // currently scene UI open
        var pos = 0; // destination px pos
        sceneControlStatus = false;
        document.getElementById("btnSceneControl").innerText = "Open Scene Control (P)"; // update text
        clearInterval(id); // reset
        id = setInterval(frame, 25);
        function frame() {
            if (pos == -250) { // moving done
                clearInterval(id);
            } else {
                pos -= 10; // move UI by 10px
                UI.style.right = pos + "px";
            }
        }
    } else { // open scene control UI
        var pos = -200; // destination px pos
        sceneControlStatus = true;  
        document.getElementById("btnSceneControl").innerText = "Close Scene Control (P)"; // update text
        clearInterval(id); // reset
        id = setInterval(frame, 25);
        function frame() {
            if (pos == 0) { // moving done
                clearInterval(id);
            } else {
                pos += 10; // move UI by 10px
                UI.style.right = pos + "px";
            }
        }
    }
}
document.getElementById("btnSceneControl").onclick = function() { sceneControl() }

function onMouseDown() { // mouse click event
    if(clPlacement !== null && !canPlace) { // in a placable positon
        if (clPlacement !== null && clPlacement.objName === "Block") {
            storedBuildings.push(clPlacement);
            document.getElementById("buildings").innerText = "Buildings: " + storedBuildings.length; // update scene control UI building counter
            clPlacement.removeBoxHelper(scene); // return to normal colour from green/red
            if (clPlacement instanceof PirateShip) { // set-up springs / cannon.js
                clPlacement.startUp(world, scene);
            }
            if (typeof clPlacement.animateObj === "function") { // class got an 'animateObj()' method add it to the array for rendering every frame
                animatingObjects.push(clPlacement);
            }
            clPlacement = null; // clear
        } else if (clPlacement instanceof Road) { //road
            if (!clPlacement.firstClick) { // not done, start resizing
                clPlacement.firstClick = true;
            } else {
                clPlacement.removeBoxHelper(scene); // return to normal colour from green/red
                clPlacement.finalConnectionTest(storedRoads); // does road connect with any other roads
                storedRoads.push(clPlacement);
                document.getElementById("roads").innerText = "Roads: " + storedRoads.length; // update scene control UI road counter
                clPlacement = null; // clear
            }
        }
    }
}
window.addEventListener('mousedown', onMouseDown, false);
////////////////////

// colours for changing starting colour, finish colour and increment needed (increment e.g. 1% of diff of start to finish)
var [r, g, b, rG, gG, bG, currentR, currentG, currentB, incrementR, incrementG, incrementB] = [];
function updateBackgroundColours() { // triggers on event of colour change/timescale change from HTML scene control
    var bgColour1 = hexToRGB(document.getElementById("bgColour1").value); // first colour
    [r, g, b] = [bgColour1.red, bgColour1.green, bgColour1.blue]; // starting colour
    [currentR, currentG, currentB] = [r, g, b]; // current pos (incremented with the incrementR..G..B)

    var bgColour2 = hexToRGB(document.getElementById("bgColour2").value); // second colour
    [rG, gG, bG] = [bgColour2.red, bgColour2.green, bgColour2.blue]; // end colour
    
    var timescale = (51-timescaleSlider.value) * 40; // calculate time based on timescale slider
    // how much to increment every frame
    incrementR = Math.abs(r - rG)/timescale;
    incrementG = Math.abs(g - gG)/timescale;
    incrementB = Math.abs(b - bG)/timescale;
}
updateBackgroundColours(); // use default colours set in scene controls

function colourUpdate() { // called every frame from render
    if (Math.floor(currentR) !== rG) { // not reached destination
        currentR = (r > rG) // if increment is - or +
                   ? currentR - incrementR
                   : currentR + incrementR;
    }
    if (Math.floor(currentG) !== gG) { // not reached destination
        currentG = (g > gG) // if increment is - or +
                   ? currentG - incrementG
                   : currentG + incrementG;
    }
    if (Math.floor(currentB) !== bG) { // not reached destination
        currentB = (b > bG) // if increment is - or +
                   ? currentB - incrementB
                   : currentB + incrementB;
    }
    if (Math.floor(currentR) === rG && Math.floor(currentG) === gG && Math.floor(currentB) === bG) { // switch
        var [holdR, holdG, holdB] = [r, g, b]; // temp
        [r, g, b] = [rG, gG, bG]; // switch
        [currentR, currentG, currentB] = [r, g, b]; // set to new starting colours
        [rG, gG, bG] = [holdR, holdG, holdB]; // finish swap
    }
    document.body.style.backgroundColor = "rgb(" + currentR + ", " + currentG + ", " + currentB + ")"; // update
}

var blockCam = new THREE.Mesh( // used for rain particles to be calcualted around it, keeping within camera
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshBasicMaterial({ color: 0xFFE4C4, opacity: 0, transparent: true })
);
scene.add(blockCam);

// prevent rain drop being really close to the camera
function randomFloatRain(fValue, sValue, differenceAllowed) {
    var location = 0;
    while (Math.abs(location - differenceAllowed) <= differenceAllowed) {
        location = Math.random() * (sValue - fValue) + fValue;
    }
    return location;
}

var texRain = new THREE.TextureLoader().load("assets/textures/rain.png");
var geoRain = new THREE.BufferGeometry();
var pos = [];
for (var i = 0; i < 1000; i++) {
    pos.push(
        randomFloatRain(-100, 100, 20), 
        randomFloatRain(-30, 60, 0.1), 
        randomFloatRain(-100, 100, 20)
        );
}
geoRain.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
var points = new THREE.Points(
    geoRain,
    new THREE.PointsMaterial({
        size: .2,
        map: texRain,
        color: 0xC4D3DF,
        opacity: .5,
        alphaTest: .5
    })
);
blockCam.add(points); // add relative to blockCam

var iFrame = 0;
var timestep = 1.0 / 60.0; // seconds
function animate() {
    requestAnimationFrame(animate);
    world.step(timestep);
    
    if (weatherSlider.value != 0 && !buildMode) { // don't calculate if rain not moving
        points.material.opacity = 0.5; // make sure rain visible
        var currentRainDrops = geoRain.getAttribute('position').array;
        for (var i = 0; i < 4500; i+=3) { // access float32bufferattribute values x,y,z
            currentRainDrops[i+1] -= weatherSlider.value/25;;
            if (currentRainDrops[i+1] < -10) { // respawn higher up
                currentRainDrops[i] = Math.random() * (100 - -100) + -100; // x
                currentRainDrops[i+1] = 20; // y
                currentRainDrops[i+2] = Math.random() * (100 - -100) + -100; // z
            }
        }
        geoRain.getAttribute('position').needsUpdate = true;
    } else {
        points.material.opacity = 0; // make invisible
    }
    // put blockCam at camera pos, so now is always close
    blockCam.position.x = camera.position.x; blockCam.position.z = camera.position.z; blockCam.position.y = camera.position.y;
    
    colourUpdate(); // update background colour

    if (buildMode) { // build mode active, call top view camera to update positions
        topView.process();
    }
    for ( var i = animatingObjects.length-1; i >= 0; i--) { // loop down array of objects that need animating every frame
         if (animatingObjects[i].remove) { // if .remove set to true remove from array (reason for looping down array)
            animatingObjects.splice(i, 1);
        } else {
            animatingObjects[i].animateObj(iFrame, scene, directionSlider, strengthSlider); // call the animation function in class
        }
    }
    mouseMoving();
    iFrame ++;
    renderer.render(scene, camera);
}

var raycaster = new THREE.Raycaster();
function mouseMoving() { // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children);
    for ( var i = 0; i < intersects.length; i++) {
        if (clPlacement !== null && clPlacement.objName === "Block") { // not a road
            clPlacement.setObjPosition(intersects[i].point, meshGround); // position object depending on ,ouse pos
            canPlace = false; // reset

            for (let i = 0; i < storedBuildings.length; i++) { // loop all buildings
                if (clPlacement.collisionCheck(storedBuildings[i], scene)) { // if collides with building returns true
                    canPlace = true; 
                    break; // collision detected, no need to keep looping
                }
            }
            if (!canPlace) { // no collision detected, check roads
                for (let i = 0; i < storedRoads.length; i++) { // loop all roads
                    if (clPlacement.collisionCheck(storedRoads[i], scene)) { // if collides with road returns true
                        canPlace = true;
                        break; // collision detected, no need to keep looping
                    }
                }
            }

        } else if (clPlacement instanceof Road) { // road
            if (clPlacement != null && !clPlacement.firstClick) { // only re-position if not changing size of road
               clPlacement.setObjPosition(intersects[i].point, meshGround);
            } else if (clPlacement != null && clPlacement.firstClick) { // already clicked once, resize depending on mouse pos
                clPlacement.setRoadSize(intersects[i].point, meshGround);
            }
            canPlace = false; // reset

            for (let i = 0; i < storedBuildings.length; i++) { // loop all bubildings
                if (clPlacement.collisionCheck(storedBuildings[i], scene)) { // if collides with building returns true
                    canPlace = true;
                    break; // collision detected, no need to keep looping
                }
            }
            if (!canPlace) { // no collision detected, check roads
                for (let i = 0; i < storedRoads.length; i++) { // if collides with road returns true
                    if (clPlacement.collisionCheck(storedRoads[i], scene)) {
                        canPlace = true;
                        break; // collision detected, no need to keep looping
                    }
                }
            }
        }
    }
}
animate();