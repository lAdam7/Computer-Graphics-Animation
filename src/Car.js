import * as THREE from "three"
import { GLTFLoader } from "three/GLTFLoader"
const gltfLoader = new GLTFLoader();

let storedRoads = []
export default class Car {
    constructor(spawnRoad, scene, roads) {
        storedRoads = roads
        var mainBlock = new THREE.Mesh( // mesh position is changed, that moves the car object
            new THREE.BoxGeometry(7, 4, 7),
            new THREE.MeshBasicMaterial({ color: 0x566960, opacity: 0, transparent: true })
        );

        gltfLoader.load("assets/models/car.glb", function(gltf) {
            gltf.scene.scale.set(2.7, 2.7, 2.7);
            gltf.scene.children[0].material.metalness = 0; // better colour appearance
            mainBlock.add(gltf.scene); // add to mainBlock
        }, undefined, function(error) {
            console.log(error);
        })
        
        this.car = mainBlock                ;
        this.currentlyTurning = false; // car currently turning a corner (90 / 180 degree turns)
        this.turnPoints = null; // array for all positions to take turn
        this.turnPosition = 0; // 0-1 used for quadratic bezier curve
        this.currentRoad = spawnRoad; // the road the car currently is on
        this.nextRoad = null; // the road the car is turning into
        this.destination = null; // where the car will stop to take next turn
        this.firstPoint = null; // first turn position
        this.secondPoint = null; // second turn position
        this.rideHeight = spawnRoad.object.position.y + 0.5; // height car should be on to be on road
        this.turningDirection = null; // can needs to be rotated Left or Right for corner
        this.originalRotationState = null; // spawn rotation
        this.remove = false; // car been removed, main render loop will remove from array that gets called every frame
        // spawn car position on spawn road
        this.car.position.set(spawnRoad.object.position.x+4.5, spawnRoad.object.position.y + 0.5, spawnRoad.object.position.z - 50);
        scene.add(this.car);

        let nextDestination = this.chooseNextDestination(this.currentRoad, null); // choose first position car will go to
        if (nextDestination[0] !== null && nextDestination[1] !== null) {
            this.currentRoad = nextDestination[1];
            this.firstPoint = nextDestination[0];
        }
        let nextDestination2 = this.chooseNextDestination(this.currentRoad, this.firstPoint); // choose second position car will go, so car knows the direction to turn
        if (nextDestination2.length > 1) {
            this.nextRoad = nextDestination2[1];
            this.secondPoint = nextDestination2[0];            
        }
    }
   

    carTurn(v1, v2, v3) { // used for car turning
        return new THREE.QuadraticBezierCurve(v1, v2, v3) // returns Vector2
    }

    findRoadOnPoint(position, notRoad) { // remove the point from the connections array the car is entering
        for ( var i = 0; i < storedRoads.length; i++) {
            if (storedRoads[i].object !== notRoad.object && storedRoads[i].connections.find(element => element === position) === position) {
                return storedRoads[i];
            }
        }
        return null;
    }

    chooseNextDestination(road, currentDestination) { // road-(class), currentDestination-(point already being used, remove from array)
        let connections = null;
        if (currentDestination != null) { // roads are connected
            connections = road.connections.filter(function(value, index, arr) {
                return value !== currentDestination; // remove point just travelled to, so can't go back
            });
        } else {
            connections = road.connections;
        }

        if (connections.length > 0) { // road has other connections choose next point car to travel to
            var nextPoint = connections[Math.floor(Math.random()*connections.length)]; // random connection to road
            var nextRoad = this.findRoadOnPoint(nextPoint, road); // get road from connection (XX:ZZ) string format
            return [nextPoint, nextRoad];
        } else if (this.currentRoad === storedRoads[0]) { // returning to spawn road set pos to enter to the top
            return ["2:-350", storedRoads[0]];
        }
        return [];
    }

    skipTurn() { // choose next points if the car is directly going straight over a road (--|--) since no turn is wanted
        this.currentlyTurning = false;
        this.currentRoad = this.nextRoad;
        this.firstPoint = this.secondPoint;
        let nextDestination = this.chooseNextDestination(this.nextRoad, this.secondPoint);
        if (nextDestination != null) {
            this.currentRoad = nextDestination[1];
            this.firstPoint = nextDestination[0];
        }
        let nextDestination2 = this.chooseNextDestination(this.currentRoad, this.firstPoint);
        if (nextDestination2 != null) {
            this.nextRoad = nextDestination2[1];
            this.secondPoint = nextDestination2[0];
        }
    }

    // clamp been used for calculatingTurns, so the quadraticbeziercurve can't directly angle making the turn more realistic and not skipping paths
    calculteTurn(p1, p2) {
        if (this.currentRoad.rotatedOnXAxis()) { // going onto a horizontal road
            if (this.car.position.z < this.currentRoad.object.position.z) { // car is above road
                if (parseInt(p1[0]) === parseInt(p2[0])) { // same horizontal keep going in same direction
                    this.skipTurn();
                } else if (parseInt(p1[0]) > parseInt(p2[0])) { // left turn
                    this.turningDirection = "R";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(p2[0], parseInt(p2[1]) + 4.5).clamp(
                            new THREE.Vector2(this.car.position.x - 25, this.car.position.z - 25),
                            new THREE.Vector2(this.car.position.x + 25, this.car.position.z + 25)
                        )
                    );
                } else { // right turn
                    this.turningDirection = "L";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(p2[0], p2[1]).clamp(
                            new THREE.Vector2(this.car.position.x - 14.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 14.5, this.car.position.z + 14.5)
                        )
                    );
                }
            } else { // car is below road
                if (parseInt(p1[0]) === parseInt(p2[0])) { // same horizontal keep going in same direction
                    this.skipTurn();
                } else if (parseInt(p1[0]) > parseInt(p2[0])) { // left turn
                    this.turningDirection = "L";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(p2[0], parseInt(p2[1])).clamp(
                            new THREE.Vector2(this.car.position.x - 14.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 14.5, this.car.position.z + 14.5)
                        )
                    );
                } else { // right turn
                    this.turningDirection = "R";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(p2[0], parseInt(p2[1])-4.5).clamp(
                            new THREE.Vector2(this.car.position.x - 14.5, this.car.position.z - 23.5),
                            new THREE.Vector2(this.car.position.x + 14.5, this.car.position.z + 23.5)
                        )
                    );
                }
            }
        } else { // going onto a vertical road
            if (this.car.position.x < this.currentRoad.object.position.x) { // car on left of road
                if (parseInt(p1[1]) === parseInt(p2[1])) { // same vertical keep going in same direction
                    this.skipTurn();
                } else if (parseInt(p1[1]) > parseInt(p2[1])) { // turning up
                    this.turningDirection = "L";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(parseInt(p2[0]), p2[1]).clamp(
                            new THREE.Vector2(this.car.position.x - 14.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 14.5, this.car.position.z + 14.5)
                        )
                    );
                } else { // turning down
                    this.turningDirection = "R";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(parseInt(p2[0])+4.5, p2[1]).clamp(
                            new THREE.Vector2(this.car.position.x - 23.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 23.5, this.car.position.z + 14.5)
                        )
                    );
                }
            } else { // car on right of road
                if (parseInt(p1[1]) === parseInt(p2[1])) { // same vertical keep going in same direction
                    this.skipTurn();
                } else if (parseInt(p1[1]) > parseInt(p2[1])) { // turning up
                    this.turningDirection = "R";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(parseInt(p2[0])-4.5, p2[1]).clamp(
                            new THREE.Vector2(this.car.position.x - 23.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 23.5, this.car.position.z + 14.5)
                        )
                    );
                } else { // turning down
                    this.turningDirection = "L";
                    this.turnPoints = this.carTurn(
                        new THREE.Vector2(this.car.position.x, this.car.position.z),
                        new THREE.Vector2(p1[0], p1[1]),
                        new THREE.Vector2(parseInt(p2[0])+4.5, p2[1]).clamp(
                            new THREE.Vector2(this.car.position.x - 14.5, this.car.position.z - 14.5),
                            new THREE.Vector2(this.car.position.x + 14.5, this.car.position.z + 14.5)
                        )
                    );
                }
            }
        }
        this.originalRotationState = this.car.children[0].rotation.y; // inital rotation store, for changing of next angle
    }

    removeCar(scene) { // delete car
        scene.remove(this.car); 
        this.remove = true; // stop render calling animateObj
    }
    
    animateObj(iFrame, scene) {
        if (this.car.position.z < -310) { // car high up (near top of top road) delete car
            this.removeCar(scene);
        } else if (this.currentRoad != null && this.firstPoint != null && this.secondPoint != null && this.firstPoint.length > 1 && this.secondPoint.length > 1) {
            var chars = this.firstPoint.split(":"); // split first point pos to get XX:ZZ
            
            if (this.currentlyTurning && this.turnPoints != null) { // currently turning
                this.turnPosition += 0.01; // increment turn % (1 === full turn complete)
                var point = this.turnPoints.getPointAt((this.turnPosition < 1) ? this.turnPosition : 1); // where car should be
                this.car.position.set(point.x, this.rideHeight, point.y);
                
                if (this.turningDirection == "L") { // turning Left
                    this.car.children[0].rotation.y = this.originalRotationState + (this.turnPosition*(3.14159/2));
                } else { // turning Right
                    this.car.children[0].rotation.y = this.originalRotationState - (this.turnPosition*(3.14159/2));
                }

                if (this.turnPosition >= 1) { // car has finished turning, find next destination for car, shuffle second point as first
                    this.currentlyTurning = false;
                    this.turnPoints = null;
                    this.currentRoad = this.nextRoad;
                    this.firstPoint = this.secondPoint;
                    
                    let nextDestination = this.chooseNextDestination(this.currentRoad, this.firstPoint);
                    if (nextDestination != null) {
                        this.nextRoad = nextDestination[1];
                        this.secondPoint = nextDestination[0];
                    }
                }
            
            } else if (this.car.position.distanceTo(new THREE.Vector3(parseInt(chars[0]), this.rideHeight, parseInt(chars[1]))) <= 20) {
                // car is close enough to first point, calculate the turn points and start turning
                var chars2 = this.secondPoint.split(":"); // get the X & Z poistion of the direction the car needs to be going
                this.currentlyTurning = true;
                this.calculteTurn(chars, chars2); // quadraticbeziercurve
                this.turnPosition = 0; // reset to 0 before moving begins (if 1 would teleport car instantly to end of turn)
            } else { // keep moving to point
                //console.log("onAxis");
                if (Math.abs(chars[0] - (this.car.position.x)) < 5) { // moving on Z axis
                    //alert("we on same z axis");
                    if (chars[1] > this.car.position.z) { // car needs to move up or down
                        this.car.translateZ(0.2);
                    } else {
                        this.car.translateZ(-0.2);
                    }
                } else { // moving on X axis
                    if (chars[0] > this.car.position.x) { // car needs to move left or right
                        this.car.translateX(0.2);
                    } else {
                        this.car.translateX(-0.2);
                    }
                }
            }
        }
    }
}