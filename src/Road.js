import * as THREE from "../libraries/three.js"

import Placement from "./Placement.js"

var loader = new THREE.TextureLoader();
export default class Road extends Placement {
    constructor(objName, scene) {
        var sizeX = 30; // default road size
        var sizeY = 1;
        var sizeZ = 6;

        var texRoad = new THREE.TextureLoader().load("assets/textures/road.jpg"); // main road texture
        texRoad.wrapS = texRoad.wrapT = THREE.RepeatWrapping;
        texRoad.repeat.set(1, 0.2);
        var road = new THREE.Mesh( // road mesh
            new THREE.BoxGeometry(sizeX-12, sizeY, sizeZ),
            new THREE.MeshBasicMaterial({color: 0xFFFFFF, map: texRoad})
        );
        
        var texPavement = new THREE.TextureLoader().load("assets/textures/MarbleSurface.jpg"); // path texture
        texPavement.wrapS = texPavement.wrapT = THREE.RepeatWrapping;
        texPavement.repeat.set(0.5, 0.5);
        var leftSideWalk = new THREE.Mesh( // left side walk
            new THREE.BoxGeometry(6, sizeY, sizeZ),
            new THREE.MeshBasicMaterial({color: 0x566960, map: texPavement})
        );
        leftSideWalk.position.x = -12; // relative position
        var rightSideWalk = new THREE.Mesh( // right side walk
            new THREE.BoxGeometry(6, sizeY, sizeZ),
            new THREE.MeshBasicMaterial({color: 0x566960, map: texPavement})
        );
        rightSideWalk.position.x = 12; // relative position
        
        var objectStructure = {
            Pavement: {
                Objects: [
                    leftSideWalk,
                    rightSideWalk
                ],
                Textures: [
                    texPavement
                ],
                Colour: 0x566960
            },
            Road: {
                Objects: [
                    road
                ],
                Textures: [
                    texRoad
                ],
                Colour: 0xFFFFFF
            }
        }

        super(objName, road, sizeX, sizeY, sizeZ, objectStructure);
        this.group = new THREE.Group();
        this.firstClick = false;
        this.setPos = null;  
        this.objName ="Road";
        
        // places roads can connect for indentation to allow other roads to connect
        this.leftRoadIndent = [];
        this.rightRoadIndent = [];
        this.topRoadIndent = [];
        this.bottomRoadIndent = [];
        this.connections = []; // connection pos as string XX:ZZ

        this.group.add(this.objectStructure.Road.Objects[0]);
        this.objectStructure.Road.Objects[0].add(this.objectStructure.Pavement.Objects[0]);
        this.objectStructure.Road.Objects[0].add(this.objectStructure.Pavement.Objects[1]);
        scene.add(this.group);
    }
    // get/setter needed due to additional change
    get firstClick() { return this._firstClick; }
    set firstClick(firstClick) {
        this._firstClick = firstClick;
        this.setPos = (this.rotatedOnXAxis())
            ? this.object.position.x
            : this.object.position.z;
    }

    setRoadSize(position, meshGround) {
        position.clamp( // clamp given pos within placable region (grid size)
            new THREE.Vector3(meshGround.position.x - (180) + 3, 0, meshGround.position.z - (180) + 3),
            new THREE.Vector3(meshGround.position.x + (180) - 3, 0, meshGround.position.z + (180) - 3)
        );
        var startGround = (this.rotatedOnXAxis()) // identify relevent axis dependeing on rotation
                        ? meshGround.position.x - (meshGround.geometry.parameters.width/2)
                        : meshGround.position.z - (meshGround.geometry.parameters.width/2);
        var distance = (this.rotatedOnXAxis()) // identify relevent axis depending on rotation
                     ? (Math.floor(Math.abs(startGround - position.x) / 6  ) * 6) + 6
                     : (Math.floor(Math.abs(startGround - position.z) / 6  ) * 6) + 6;
        var difference = (Math.floor(Math.abs(startGround - this.setPos) / 6  ) * 6); // diff between first click and current mouse location
        this.object.scale.z = (1 * ((Math.abs(difference - (distance-6)))/6) + 1); // every 1 adds x6 to length

        if (this.rotatedOnXAxis()) { // position road in correct place, after size change and adjust the relevent size axis
            this.object.position.x = this.setPos - ((difference - (distance-6))/2);
            this.sizeX = (((Math.abs(difference - (distance-6)))/6)+1)*6;
        } else {
            this.object.position.z = this.setPos - ((difference - (distance-6))/2);
            this.sizeZ = (((Math.abs(difference - (distance-6)))/6)+1)*6;
        }

        this.objectStructure.Pavement.Textures[0].repeat.set(0.5, this.object.scale.z/2); // every .5
        this.objectStructure.Road.Textures[0].repeat.set(1, 0.2 * this.object.scale.z); // .2
    }

    buildPaths(side, sideName) { // removes relevent path and place paths on side to build road in middle
        var sideRoadPos = (sideName === "left" || sideName === "bottom") ? -12 : 12;
        side.sort(function(a, b) { return a - b; });
        var side = side.filter(function(elem, index, self) { return index === self.indexOf(elem); }) // unique check
        // TODO: should use z if bottom or top? wasn't before potential bug
        for (let i = 0; i < this.objectStructure.Pavement.Objects.length; i++) { // find path to be removed and on right side
            if (this.objectStructure.Pavement.Objects[i].position.x === sideRoadPos) {
                this.objectStructure.Road.Objects[0].remove(this.objectStructure.Pavement.Objects[i]);
            }
        }
        
        var startingPos = 0;
        for (let i = 0; i < side.length; i++) { // every relvent indent on side of road
            var roadPos = side[i]; // num of where center of road needs to be

            var texPavement = new THREE.TextureLoader().load("assets/textures/MarbleSurface.jpg"); // path texture
            texPavement.wrapS = texPavement.wrapT = THREE.RepeatWrapping;
            var path = new THREE.Mesh( // path from 0 to where road first starts
                new THREE.BoxGeometry(6, 1, ((roadPos - 1.5) - startingPos)*6),
                new THREE.MeshBasicMaterial({color: 0x566960, map: texPavement})
            );
            texPavement.repeat.set(0.5, 0.5 * (path.geometry.parameters.depth/6));
            path.rotation.y = (sideName === "top" || sideName === "bottom") // correct orientation depending on axis object is on
                                ? Math.PI/2
                                : 0;
            path.position.x = (sideName === "top" || sideName === "bottom") // correct position depending axis object is on
                                ? this.objectStructure.Road.Objects[0].position.x - (this.sizeX/2) + (((roadPos - 1.5) - startingPos)*6)/2 + (startingPos*6)
                                : this.objectStructure.Road.Objects[0].position.x + sideRoadPos;
            path.position.y = this.objectStructure.Road.Objects[0].position.y; // always same height
            path.position.z = (sideName === "top" || sideName === "bottom") // correct position depending axis object is on
                                ? this.objectStructure.Road.Objects[0].position.z - sideRoadPos
                                : this.objectStructure.Road.Objects[0].position.z - (this.sizeZ/2) + (((roadPos - 1.5) - startingPos)*6)/2 + (startingPos*6);
            this.objectStructure.Road.Objects[0].attach(path); // path relative to road pos
            this.objectStructure.Pavement.Objects.push(path);

            startingPos = roadPos - 1.5; // increment startingPos to where path was just added
            
            var texRoad = new THREE.TextureLoader().load("assets/textures/roadEnd.jpg"); // texture that replaces path pos
            texRoad.wrapS = texRoad.wrapT = THREE.RepeatWrapping;
            var path = new THREE.Mesh(
                (sideName === "top" || sideName === "bottom") // correct size on axis depending on axis object is on
                    ? new THREE.BoxGeometry(6, 1, 18)
                    : new THREE.BoxGeometry(18, 1, 6),
                new THREE.MeshBasicMaterial({color: 0xFFFFFF, map: texRoad})
            );

            (sideName === "top" || sideName === "bottom") // repeat texture long ways on path
                ? texRoad.repeat.set(0.2, 1)
                : texRoad.repeat.set(1, 0.2);
            
            path.rotation.y = Math.PI/2;
            path.position.x = (sideName === "top" || sideName === "bottom") // pos relative to axis of object
                                ? this.objectStructure.Road.Objects[0].position.x - (this.sizeX/2) + 9 + (startingPos*6)
                                : this.objectStructure.Road.Objects[0].position.x + sideRoadPos;
            path.position.y = this.objectStructure.Road.Objects[0].position.y;
            path.position.z = (sideName === "top" || sideName === "bottom") // pos relative to axis of object
                                ? this.objectStructure.Road.Objects[0].position.z - sideRoadPos
                                : this.objectStructure.Road.Objects[0].position.z - (this.sizeZ/2) + 9 + (startingPos*6);
            this.objectStructure.Road.Objects[0].attach(path);
            
            startingPos = roadPos + 1.5; // increment startingPos to end of road (ready for last path)
        }
     
        var texPavement = new THREE.TextureLoader().load("assets/textures/MarbleSurface.jpg"); // path texture
        texPavement.wrapS = texPavement.wrapT = THREE.RepeatWrapping;
        var path = new THREE.Mesh( // repeat of first path just on other side
            (sideName === "top" || sideName === "bottom")
                ? new THREE.BoxGeometry(((this.sizeX/6) - startingPos)*6, 1, 6)
                : new THREE.BoxGeometry(6, 1, ((this.sizeZ/6) - startingPos)*6),
            new THREE.MeshBasicMaterial({color: 0x566960, map: texPavement})
        );
        (sideName === "top" || sideName === "bottom") // relative to axis object is on
            ? texPavement.repeat.set(0.5 * (path.geometry.parameters.width/6), 0.5)
            : texPavement.repeat.set(0.5, 0.5 * (path.geometry.parameters.depth/6));
        path.position.x = (sideName === "top" || sideName === "bottom") // relative to axis object is on
                            ? this.objectStructure.Road.Objects[0].position.x + (this.sizeX/2) - ((((this.sizeX/6) - startingPos)*6)/2)
                            : this.objectStructure.Road.Objects[0].position.x + sideRoadPos;
        path.position.y = this.objectStructure.Road.Objects[0].position.y;
        path.position.z = (sideName === "top" || sideName === "bottom") // relative to axis object is on
                            ? this.objectStructure.Road.Objects[0].position.z - sideRoadPos
                            : this.objectStructure.Road.Objects[0].position.z + (this.sizeZ/2) - ((((this.sizeZ/6) - startingPos)*6)/2);
        this.objectStructure.Road.Objects[0].attach(path);
        this.objectStructure.Pavement.Objects.push(path);
    }

    finalConnectionTest(storedRoads) { // called as soon as road has been placed
        var getCon = this.checkConnections(storedRoads); // find roads that are connected to placed one
        
        if (getCon.length > 0) { // has connections
            for (let i = 0; i < getCon.length; i++) { // loop through all connecting roads
                var clTest = getCon[i]; 
                
                for (let b = 0; b < this.objectStructure.Pavement.Objects.length; b++) { // loop through every path of connecting road
                    var holdVec = new THREE.Vector3();
                    var meshB = this.objectStructure.Pavement.Objects[b];
                    meshB.getWorldPosition(holdVec); // get pos of path (not relative to road)
                    if (!this.rotatedOnXAxis() && clTest.rotatedOnXAxis()) { // connected road on horizontal axis on left or right
                        if (this.object.position.z + (this.sizeZ/2) >= clTest.object.position.z + (clTest.sizeZ/2) && this.object.position.z - (this.sizeZ/2) <= clTest.object.position.z - (clTest.sizeZ/2)) {
                            // connection road directly on left
                            // one pos is the connection to the road (gets both ends of road)
                            var XPosOne = (clTest.objectStructure.Road.Objects[0].position.x - (clTest.sizeX/2)) - 3; 
                            var XPosTwo = (clTest.objectStructure.Road.Objects[0].position.x + (clTest.sizeX/2)) + 3;
                        
                            if (XPosOne === this.objectStructure.Road.Objects[0].position.x + (this.sizeX/2) - 3) {
                                // just placed road on right
                                this.rightRoadIndent.push((Math.abs(clTest.objectStructure.Road.Objects[0].position.z - (this.objectStructure.Road.Objects[0].position.z - (this.sizeZ/2))))/6);
                                this.connections.push((clTest.objectStructure.Road.Objects[0].position.x - clTest.sizeX/2 - 15.1) + ":" + (clTest.objectStructure.Road.Objects[0].position.z));
                                clTest.connections.push((clTest.objectStructure.Road.Objects[0].position.x - clTest.sizeX/2 - 15.1) + ":" + (clTest.objectStructure.Road.Objects[0].position.z));
                            } else {
                                // just placed road on left
                                this.leftRoadIndent.push((Math.abs(clTest.objectStructure.Road.Objects[0].position.z - (this.objectStructure.Road.Objects[0].position.z - (this.sizeZ/2))))/6);
                                this.connections.push((clTest.objectStructure.Road.Objects[0].position.x + clTest.sizeX/2 + 14.9) + ":" + (clTest.objectStructure.Road.Objects[0].position.z));
                                clTest.connections.push((clTest.objectStructure.Road.Objects[0].position.x + clTest.sizeX/2 + 14.9) + ":" + (clTest.objectStructure.Road.Objects[0].position.z));
                            }
                        } else { // connection road on horizontal axis above or below
                            if (this.objectStructure.Road.Objects[0].position.z > clTest.objectStructure.Road.Objects[0].position.z) {
                                // just placed road below
                                clTest.bottomRoadIndent.push((Math.abs(this.objectStructure.Road.Objects[0].position.x - (clTest.objectStructure.Road.Objects[0].position.x - (clTest.sizeX/2))))/6);
                                this.connections.push((this.objectStructure.Road.Objects[0].position.x) + ":" + (this.objectStructure.Road.Objects[0].position.z - this.sizeZ/2 - 15.1));
                                clTest.connections.push((this.objectStructure.Road.Objects[0].position.x) + ":" + (this.objectStructure.Road.Objects[0].position.z - this.sizeZ/2 - 15.1));
                            } else {
                                // just placed road above
                                clTest.topRoadIndent.push((Math.abs(this.objectStructure.Road.Objects[0].position.x - (clTest.objectStructure.Road.Objects[0].position.x - (clTest.sizeX/2))))/6);
                                this.connections.push((this.objectStructure.Road.Objects[0].position.x) + ":" + (this.objectStructure.Road.Objects[0].position.z + this.sizeZ/2 + 14.9));
                                clTest.connections.push((this.objectStructure.Road.Objects[0].position.x) + ":" + (this.objectStructure.Road.Objects[0].position.z + this.sizeZ/2 + 14.9));
                            }
                            if (clTest.topRoadIndent.length > 0) { clTest.buildPaths(clTest.topRoadIndent, "top"); }
                            if (clTest.bottomRoadIndent.length > 0) { clTest.buildPaths(clTest.bottomRoadIndent, "bottom"); }
                        }  
                    } else { // connected road on vertical
                        if (this.object.position.x - (this.sizeX/2) <= clTest.object.position.x - (clTest.sizeX/2) && this.object.position.x + (this.sizeX/2) >= clTest.object.position.x + (clTest.sizeX/2)) {
                            // just placed road is horizontal connecting to vertical road (above or below only)
                            var XPosOne = (this.objectStructure.Road.Objects[0].position.z - (this.sizeZ/2)) + 3;
                            var XPosTwo = (this.objectStructure.Road.Objects[0].position.z + (this.sizeZ/2)) - 3;
                            if ((clTest.object.position.z + (clTest.sizeZ/2) + 3) === XPosOne || (clTest.object.position.z - (clTest.sizeZ/2) - 3) === XPosTwo) {
                                if (clTest.object.position.z + (clTest.sizeZ/2) + 3 === XPosOne) {
                                    // road on top
                                    this.topRoadIndent.push((Math.abs(clTest.objectStructure.Road.Objects[0].position.x - (this.objectStructure.Road.Objects[0].position.x - (this.sizeX/2))))/6);
                                    this.connections.push((clTest.objectStructure.Road.Objects[0].position.x) + ":" + (clTest.objectStructure.Road.Objects[0].position.z + clTest.sizeZ/2 + 15.1));
                                    clTest.connections.push((clTest.objectStructure.Road.Objects[0].position.x) + ":" + (clTest.objectStructure.Road.Objects[0].position.z + clTest.sizeZ/2 + 15.1));
                                } else { // x == XPosTwo
                                    // road on bottom
                                    this.bottomRoadIndent.push((Math.abs(clTest.objectStructure.Road.Objects[0].position.x - (this.objectStructure.Road.Objects[0].position.x - (this.sizeX/2))))/6);
                                    this.connections.push((clTest.objectStructure.Road.Objects[0].position.x) + ":" + (clTest.objectStructure.Road.Objects[0].position.z - clTest.sizeZ/2 - 14.9));
                                    clTest.connections.push((clTest.objectStructure.Road.Objects[0].position.x) + ":" + (clTest.objectStructure.Road.Objects[0].position.z - clTest.sizeZ/2 - 14.9));
                                }
                            }

                        } else {
                            // just placed road is horizontal connecting to vertical road (left or right)
                            var XPosOne = (clTest.objectStructure.Road.Objects[0].position.x + (clTest.sizeX/2)) - 3;
                            var XPosTwo = (clTest.objectStructure.Road.Objects[0].position.x - (clTest.sizeX/2)) + 3;
                            if (Math.floor(holdVec.x) - (this.sizeX/2) - 3 === XPosOne || Math.floor(holdVec.x) + (this.sizeX/2) + 3 === XPosTwo) {
                                if (Math.floor(holdVec.x) - (this.sizeX/2) - 3 === XPosOne) {
                                    // right of connection road
                                    clTest.rightRoadIndent.push((Math.abs(this.objectStructure.Road.Objects[0].position.z - (clTest.objectStructure.Road.Objects[0].position.z - (clTest.sizeZ/2))))/6);
                                    this.connections.push((this.objectStructure.Road.Objects[0].position.x - this.sizeX/2 - 14.9) + ":" + (this.objectStructure.Road.Objects[0].position.z));
                                    clTest.connections.push((this.objectStructure.Road.Objects[0].position.x - this.sizeX/2 - 14.9) + ":" + (this.objectStructure.Road.Objects[0].position.z));
                                } else {
                                    // left of connection road
                                    clTest.leftRoadIndent.push((Math.abs(this.objectStructure.Road.Objects[0].position.z - (clTest.objectStructure.Road.Objects[0].position.z - (clTest.sizeZ/2))))/6);
                                    this.connections.push((this.objectStructure.Road.Objects[0].position.x + this.sizeX/2 + 15.1) + ":" + (this.objectStructure.Road.Objects[0].position.z));
                                    clTest.connections.push((this.objectStructure.Road.Objects[0].position.x + this.sizeX/2 + 15.1) + ":" + (this.objectStructure.Road.Objects[0].position.z));
                                }
                            }
                            if (clTest.rightRoadIndent.length > 0) { clTest.buildPaths(clTest.rightRoadIndent, "right"); }
                            if (clTest.leftRoadIndent.length > 0) { clTest.buildPaths(clTest.leftRoadIndent, "left"); }
                        }
                    }
                }
            }
            if (this.rightRoadIndent.length > 0) { this.buildPaths(this.rightRoadIndent, "right"); }
            if (this.leftRoadIndent.length > 0) { this.buildPaths(this.leftRoadIndent, "left"); }
        }
        if (this.topRoadIndent.length > 0) { this.buildPaths(this.topRoadIndent, "top"); }
        if (this.bottomRoadIndent.length > 0) { this.buildPaths(this.bottomRoadIndent, "bottom"); }
    }

    // modified https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection
    checkConnections(storedRoads) { // returns if added on in same direction etc //
        var linkedRoads = [];

        for (let i=0; i < storedRoads.length; i++) {
            var linkedRoad = storedRoads[i];
            var horizontalCollision = false;
            var verticalCollision = false;

            if (this.rotatedOnXAxis() && linkedRoad.rotatedOnXAxis()) { // ignore if same rotation
            } else if (!this.rotatedOnXAxis() && !linkedRoad.rotatedOnXAxis()) { // ignore if same rotation
            } else if (this.rotatedOnXAxis() && !linkedRoad.rotatedOnXAxis()) { // roads aligned?
                horizontalCollision = (this.object.position.x - (this.sizeX/2) <= linkedRoad.object.position.x + (linkedRoad.sizeX/2));
                verticalCollision = (this.object.position.z - (this.sizeZ/2) >= linkedRoad.object.position.z - (linkedRoad.sizeZ/2))
                                  ? (this.object.position.z - (this.sizeZ/2) <= linkedRoad.object.position.z + (linkedRoad.sizeZ/2))
                                  : (this.object.position.z + (this.sizeZ/2) <= linkedRoad.object.position.z - (linkedRoad.sizeZ/2));

            } else if (!this.rotatedOnXAxis() && linkedRoad.rotatedOnXAxis() && linkedRoad.object.position.x - (linkedRoad.sizeX/2) <= this.object.position.x - 9 && linkedRoad.object.position.x + (linkedRoad.sizeX/2) >= this.object.position.x + 9) {
                if (this.object.position.z - (this.sizeZ/2) - 3 === linkedRoad.object.position.z + (linkedRoad.sizeZ/2) - 3) {
                    linkedRoads.push(linkedRoad);
                } else if (this.object.position.z + (this.sizeZ/2) + 3 === linkedRoad.object.position.z - (linkedRoad.sizeZ/2) + 3) {
                    linkedRoads.push(linkedRoad);
                }
                
            } else if (linkedRoad.rotatedOnXAxis()) { // roads aligned?
                horizontalCollision = (this.object.position.x - (this.sizeX/2) >= linkedRoad.object.position.x - (linkedRoad.sizeX/2))
                                    ? (this.object.position.x - (this.sizeX/2) === linkedRoad.object.position.x + (linkedRoad.sizeX/2))
                                    : (this.object.position.x + (this.sizeX/2) === linkedRoad.object.position.x - (linkedRoad.sizeX/2));
                verticalCollision = (this.object.position.z + (this.sizeZ/2) >= linkedRoad.object.position.z + (linkedRoad.sizeZ/2)
                                  && this.object.position.z - (this.sizeZ/2) <= linkedRoad.object.position.z - (linkedRoad.sizeZ/2));
            }
            
            if (horizontalCollision && verticalCollision) {
                linkedRoads.push(linkedRoad); // roads are connected, return (later added to each roads connection array)
            }
        }
        return linkedRoads;
    }   
}