import * as THREE from "three"

export default class Placement {
    constructor(objName, object, sizeX, sizeY, sizeZ, objectStructure) {
        this.objName = objName; // !'Block' == road 
        this.object = object;
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.sizeZ = sizeZ;
        this.gridIncrementX = 6; // x axis multiply
        this.gridIncrementZ = 6; // z axis multiply
        this.remove = false;

        this.objectStructure = objectStructure;

        this.object.position.y = -50; // every object before moving put below ground
        
        this.boxMesh = null;
        this.box = null;
    }

    calculateSize() { // returns size as a vector
        return new THREE.Vector3(this.sizeX, this.sizeY, this.sizeZ);
    }

    rotatedOnXAxis() { // calculating the rotation of the object
        var currentRotation = THREE.MathUtils.radToDeg(this.object.rotation.y);
        return (currentRotation === 90 || currentRotation === 270);
    }

    rotate(scene) { // every R press
        var temp = this.sizeX; // switch the X & Z sizes around so placement system ajusts for potential size change
        this.sizeX = this.sizeZ;
        this.sizeZ = temp;
        
        this.object.rotation.y += Math.PI/2; // rotate 90 degrees
        if (this.object.rotation.y >= 6.28319) { // reset to 0
            this.object.rotation.y = 0;
        }

        var temp2 = this.gridIncrementX; // switch axis multipliers 
        this.gridIncrementX = this.gridIncrementZ;
        this.gridIncrementZ = temp2;

        scene.remove(this.boxMesh);
        this.boxMesh = new THREE.Mesh(
            new THREE.BoxGeometry(this.sizeX, this.sizeY, this.sizeZ),
            new THREE.MeshBasicMaterial()
        )
        this.boxMesh.position.copy(this.object.position);
        this.box.object = this.boxMesh;
        this.box.update();
    }

    setObjPosition(position, meshGround) { // called every frame if currently placing a object
        var getObjSize = this.calculateSize(); // current size on each axis
        
        // clamp position from mouse within the allowed region
        // allows for mouse input regardless on position if not on the grid improving user-friendliness
        position.clamp(
            new THREE.Vector3(meshGround.position.x - (180) + 3, 0, meshGround.position.z - (180) + 3),
            new THREE.Vector3(meshGround.position.x + (180) - (this.sizeX), 0, meshGround.position.z + (180) - (this.sizeZ))
        );

        var startX = meshGround.position.x - (meshGround.geometry.parameters.width/2); // top of X
        var distanceX = (Math.floor(Math.abs(startX - position.x) / this.gridIncrementX  ) * this.gridIncrementX); // mouse pos to X
        var adjustX = distanceX + (getObjSize.x/2);

        var startZ = meshGround.position.z - (meshGround.geometry.parameters.width/2); // top of Z
        var distanceZ = (Math.floor(Math.abs(startZ - position.z) / this.gridIncrementZ  ) * this.gridIncrementZ); // mouse pos to Z
        var adjustZ = distanceZ + (getObjSize.z/2);
        
        this.object.position.set(
            startX + adjustX,
            (this.sizeY/2) - 12.5, // pos on main land
            startZ + adjustZ
        );
    }

    removeBoxHelper(scene) { // remove box helper before creating another or object has been placed / cancelled
        if (this.boxMesh != null && this.box != null) {
            scene.remove(this.boxMesh);
            scene.remove(this.box);
        }
    }

    createBoxHelper(color, scene) {
        this.removeBoxHelper(scene); // clear current
        var [x, y, z] = [this.sizeX, this.sizeY, this.sizeZ];
        if (this.constructor.name == "SphereBuilding") { // sizes need changing for boxhelper (due to parents of object)
            y = 40;
        } else if (this.constructor.name == "PirateShip") {
            y = 40;
        }
        this.boxMesh = new THREE.Mesh( // create for current size on axis
            new THREE.BoxGeometry(x, y, z),
            new THREE.MeshBasicMaterial()
        )
        this.boxMesh.position.copy(this.object.position); // same pos of object
        if (this.constructor.name == "SphereBuilding") { // higher pos needed for boxhelper (due to parents of object)
            this.boxMesh.position.y += 20;
        } else if (this.constructor.name == "PirateShip") {
            this.boxMesh.position.y += 25;
        }
        this.box = new THREE.BoxHelper(
            this.boxMesh,
            color // red/green
        );
        scene.add(this.box);
    }

    collisionCheck (group, scene) { // Reading material: https://learnopengl.com/In-Practice/2D-Game/Collisions/Collision-detection
        var horizontalCollision = null;
        if (this.object.position.x - (this.sizeX/2) > group.object.position.x - (group.sizeX/2)) { // x axis collision check which side needs to be checked
            horizontalCollision = (this.object.position.x - (this.sizeX/2) < group.object.position.x + (group.sizeX/2));
        } else {
            horizontalCollision = (this.object.position.x + (this.sizeX/2) > group.object.position.x - (group.sizeX/2));
        }

        var verticalCollision = null;
        if (this.object.position.z - (this.sizeZ/2) > group.object.position.z - (group.sizeZ/2)) { // z axis collision check which side needs to be checked
            verticalCollision = (this.object.position.z - (this.sizeZ/2) < group.object.position.z + (group.sizeZ/2));
        } else {
            verticalCollision = (this.object.position.z + (this.sizeZ/2) > group.object.position.z - (group.sizeZ/2));
        }
        
        if (horizontalCollision && verticalCollision) { // object collides with object sent in parameter (colour red)
            this.createBoxHelper(0xFF0000, scene)
        } else { // object doesn't collide (colour green)
            this.createBoxHelper(0x00FF00, scene);
        }
        return (horizontalCollision && verticalCollision);
    }
}