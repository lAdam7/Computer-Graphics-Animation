import Placement from "./Placement.js";
import * as THREE from "../libraries/three.js"
import { GLTFLoader } from "../libraries/GLTFLoader.js"

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }  

class FlagBuilding extends Placement {
    constructor(objName, scene) {
        var texWindowA = new THREE.TextureLoader().load("assets/textures/window2.png");
        texWindowA.wrapS = texWindowA.wrapT = THREE.RepeatWrapping;
        texWindowA.repeat.set(4, 4);
        var texWindowB = new THREE.TextureLoader().load("assets/textures/window2.png");
        texWindowB.wrapS = texWindowB.wrapT = THREE.RepeatWrapping;
        texWindowB.repeat.set(4, 1);

        var meshBlockMiddle = new THREE.Mesh( // connecting box to two larger boxes, transparent so colour can be changed of windows
            new THREE.BoxGeometry(30, 7.5, 18),
            [
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowB, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowB, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowB, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowB, transparent: true })
            ]
        );
        var colourBlockMiddle = new THREE.Mesh( // background colour of the meshBlockMiddle
            new THREE.BoxGeometry(30, 7.5, 18),
            new THREE.MeshBasicMaterial({color: 0xFFE4C4})
        )
        meshBlockMiddle.add(colourBlockMiddle);
        
        var meshBlockLeft = new THREE.Mesh( // left bigger box, transparent so colour can be changed of windows
            new THREE.BoxGeometry(30, 30, 42),
            [
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true })
            ]
        );
        meshBlockLeft.position.set(-30, -3.75, 0);
        var colourBlockLeft = new THREE.Mesh( // background colour of the meshBlockLeft
            new THREE.BoxGeometry(30, 30, 42),
            new THREE.MeshBasicMaterial({color: 0xFFE4C4})
        )
        meshBlockLeft.add(colourBlockLeft);
        
        var meshBlockRight = new THREE.Mesh( // right biffer box, transparent so colour can be changed of windows
            new THREE.BoxGeometry(30, 30, 42),
            [
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0x7E7E7E }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true }),
                new THREE.MeshBasicMaterial({ color: 0xFF0000, map: texWindowA, transparent: true })
            ]
        );
        meshBlockRight.position.set(30, -3.75, 0);
        var colourBlockRight = new THREE.Mesh( // background colour of the meshBlockRight
            new THREE.BoxGeometry(30, 30, 42),
            new THREE.MeshBasicMaterial({ color: 0xFFE4C4 })
        )
        meshBlockRight.add(colourBlockRight);

        var meshPole = new THREE.Mesh( // flag pole
            new THREE.CylinderGeometry(0.6, 0.6, 20, 32),
            new THREE.MeshPhongMaterial({ color: 0x5A615C })
        );
        meshPole.position.y = 25; // top of building

        var plane = new THREE.Mesh( // flag plane
            new THREE.PlaneGeometry(20, 10, 30, 30),
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load("assets/textures/NU_logo.png"),
                side: THREE.DoubleSide // texture on both sides
            })
        );
        plane.position.set(10, 5, 0); // offset from pole

        // used for accessing specific objects and finding previous colour
        var objectStructure = {
            Building: {
                Objects: [
                    meshBlockMiddle,
                    meshBlockRight,
                    meshBlockLeft
                ],
                Colour: 0x7E7E7E
            },
            FlyingFlag: {
                Objects: [
                    plane,
                    meshPole
                ]
            }
        }

        super(objName, meshBlockMiddle, 90, 39, 42, objectStructure);
        this.group = new THREE.Group();
        this.group.add(this.objectStructure.Building.Objects[0]);
        this.objectStructure.Building.Objects[0].add(this.objectStructure.Building.Objects[1]);
        this.objectStructure.Building.Objects[0].add(this.objectStructure.Building.Objects[2]);
        this.objectStructure.Building.Objects[2].add(this.objectStructure.FlyingFlag.Objects[1]);
        this.objectStructure.FlyingFlag.Objects[1].add(this.objectStructure.FlyingFlag.Objects[0]);
        scene.add(this.group);
    }

    wave(geometry, cycle, height, frmOffset) {
        var positionAttribute = geometry.getAttribute('position'); // get all position vertexes
        const vertex = new THREE.Vector3();
        const width = geometry.parameters.width;
        
        for (let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex++) { // for every vertex
            vertex.fromBufferAttribute(positionAttribute, vertexIndex); // get pos for vertex index
            var xPos = (((vertex.x+frmOffset)*cycle)/width)*(2*Math.PI);
            var zPos = Math.sin(xPos)*height;
            
            if (vertex.x > -9) { // flag appears more attached to the pole, due to fixing some vertexs on the x axis
                geometry.attributes.position.setXYZ(vertexIndex, vertex.x, vertex.y, zPos);
            }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    } 

    animateObj(iFrame, scene, directionSlider, strengthSlider) {
        // set rotation based on slider input
        this.objectStructure.FlyingFlag.Objects[1].rotation.y = -this.objectStructure.Building.Objects[0].rotation.y + (Math.PI/2) - degToRad(directionSlider.value);
        // compute offset based on frame count
        let frmOffset = iFrame%(this.objectStructure.FlyingFlag.Objects[0].geometry.parameters.width*(31-strengthSlider.value))
        this.wave(
            this.objectStructure.FlyingFlag.Objects[0].geometry,
            2, .8,
            frmOffset/(31-strengthSlider.value)
        );
    }
}

class FireworkBuilding extends Placement {
    constructor(objName, scene) {
        var texWindowA = new THREE.TextureLoader().load("assets/textures/window.png");
        texWindowA.wrapS = texWindowA.wrapT = THREE.RepeatWrapping;
        texWindowA.repeat.set(4, 4);
        var texWindowB = new THREE.TextureLoader().load("assets/textures/window.png");
        texWindowB.wrapT = texWindowB.wrapS = THREE.RepeatWrapping;
        texWindowB.repeat.set(8, 4);

        var meshBlock = new THREE.Mesh( // main block, transparent so colour can be changed of windows
            new THREE.BoxGeometry(30, 24, 60),
            [
                new THREE.MeshBasicMaterial({map: texWindowB, transparent: true}),
                new THREE.MeshBasicMaterial({map: texWindowB, transparent: true}),
                new THREE.MeshBasicMaterial({color: 0x7E7E7E}),
                new THREE.MeshBasicMaterial({color: 0x7E7E7E}),
                new THREE.MeshBasicMaterial({map: texWindowA, transparent: true}),
                new THREE.MeshBasicMaterial({map: texWindowA, transparent: true})
            ]
        );
        var colourBlock = new THREE.Mesh( // background colour of the meshBlockMiddle
            new THREE.BoxGeometry(30, 24, 60),
            new THREE.MeshBasicMaterial({ color: 0xFFE4C4 })
        )
        meshBlock.add(colourBlock);

        var mainCylinder = new THREE.Mesh( // cylinder pointing up
            new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        mainCylinder.rotation.y = Math.PI/4;
        mainCylinder.position.y = 13.5
        meshBlock.add(mainCylinder);

        var cylinder = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        cylinder.position.set(0, -0.3, 1);
        cylinder.rotation.x = Math.PI/6;
        mainCylinder.add(cylinder); // add to center cylinder
        var cylinder = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        cylinder.position.set(0, -0.3, -1);
        cylinder.rotation.x = -Math.PI/6;
        mainCylinder.add(cylinder); // add to center cylinder
        var cylinder = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        cylinder.position.set(1, -0.3, 0);
        cylinder.rotation.z = -Math.PI/6;
        mainCylinder.add(cylinder); // add to center cylinder
        var cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 3, 32),
            new THREE.MeshBasicMaterial({ color: 0x808080 })
        );
        cylinder.position.set(-1, -0.3, 0);
        cylinder.rotation.z = Math.PI/6;
        mainCylinder.add(cylinder); // add to center cylinder
        
        // used for accessing specific objects and finding previous colour
        var objectStructure = {
            Building: {
                Objects: [
                    meshBlock,
                ],
                Colour: 0x7E7E7E
            }
        }

        super(objName, meshBlock, 30, 24, 60, objectStructure);
        this.group = new THREE.Group();
        this.group.add(this.objectStructure.Building.Objects[0]);
        scene.add(this.group);
    }

}

class PirateShip extends Placement {
    constructor(objName, scene) {        
        var base = new THREE.Mesh( // plate below ride
            new THREE.BoxGeometry(36, 1, 18),
            new THREE.MeshBasicMaterial({ color: 0x566960 })
        );
        base.position.y = -3.5;

        const gltfLoader = new GLTFLoader();
        gltfLoader.load("assets/models/ship.glb", function(gltf) { // ad placeholder for placing, replaced with cannonjs aspects when placed
            gltf.scene.scale.set(.5, .5, .5);
            gltf.scene.position.y = 5;
            base.add(gltf.scene);
        }, undefined, function(error) {
            console.log(error);
        })

        var cylinderMesh = new THREE.Mesh( // cylinder at top of ride (main)
            new THREE.CylinderGeometry(1, 1, 15, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        cylinderMesh.rotation.x = Math.PI/2;
        cylinderMesh.position.y = 23;
        base.add(cylinderMesh); // relative to base
        
        var cylinderMeshSide = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(.75, .75, 25, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        cylinderMeshSide.rotation.set(Math.PI/2, 0, Math.PI/8);
        cylinderMeshSide.position.set(-5, 6, 12);
        cylinderMesh.add(cylinderMeshSide);
        
        var cylinderMeshSide = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(.75, .75, 25, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        cylinderMeshSide.rotation.set(Math.PI/2, 0, -Math.PI/8);
        cylinderMeshSide.position.set(5, 6, 12);
        cylinderMesh.add(cylinderMeshSide);
        
        var cylinderMeshSide = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(.75, .75, 25, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        cylinderMeshSide.rotation.set(Math.PI/2, 0, Math.PI/8);
        cylinderMeshSide.position.set(-5, -6, 12);
        cylinderMesh.add(cylinderMeshSide);
        
        var cylinderMeshSide = new THREE.Mesh( // side cylinder
            new THREE.CylinderGeometry(.75, .75, 25, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        cylinderMeshSide.rotation.set(Math.PI/2, 0, -Math.PI/8);
        cylinderMeshSide.position.set(5, -6, 12);
        cylinderMesh.add(cylinderMeshSide);
        
        // used for accessing specific objects and finding previous colour
        var objectStructure = {
            Building: {
                Objects: [
                    base,
                    cylinderMesh
                ]
            },
            spring: {
                Objects: [ // placeholders for cannon.js to be added in startUp()
                    0, 1, 2, 3, 4
                ]
            }
        }

        super(objName, base, 36, 0, 18, objectStructure);
        this.group = new THREE.Group();
        this.group.add(base);
        scene.add(this.group);
    }

    startUp(world, scene) { // called once object has been placed, start-up the physical simulation
         this.objectStructure.Building.Objects[0].remove(this.objectStructure.Building.Objects[0].children[1]); // remove current ship

        var springBlock = new THREE.Mesh( // block to attach ship to, bottom of spring
            new THREE.BoxGeometry(0, 0, 0),
            new THREE.MeshBasicMaterial({ })
        );
        scene.add(springBlock);
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("assets/models/ship.glb", function(gltf) {
            gltf.scene.scale.set(.5, .5, .5);
            springBlock.add(gltf.scene); // attach ship to spring moving block
        }, undefined, function(error) {
            console.log(error);
        })
        this.objectStructure.spring.Objects[3] = springBlock;

        var vecVelocity = (this.rotatedOnXAxis()) // apply velocity on correct axis dependeing on rotation 
                        ? new CANNON.Vec3(0, 0, 20)
                        : new CANNON.Vec3(20, 0, 0);
        
        this.objectStructure.spring.Objects[1] = new CANNON.Body({ // body where ship is attached to
            mass: 10, 
            material: new CANNON.Material(), 
            velocity: vecVelocity // apply velocity so ship can move
        });
        this.objectStructure.spring.Objects[1].addShape(new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5))); // determine rotation of ship
        this.objectStructure.spring.Objects[1].position.set(this.objectStructure.Building.Objects[0].position.x,-4,this.objectStructure.Building.Objects[0].position.z); // relative to placed pos
        world.add(this.objectStructure.spring.Objects[1]);
       
        this.objectStructure.spring.Objects[2] = new CANNON.Body({
            mass: 10, 
            material: new CANNON.Material(), 
            type: 2 // static, stop the body from moving (located in the top main beam)
        });
        this.objectStructure.spring.Objects[2].position.set(this.objectStructure.Building.Objects[0].position.x,11,this.objectStructure.Building.Objects[0].position.z); // relative to placed pos
        world.add(this.objectStructure.spring.Objects[2]);

        // attach spring from statis body to the ship body so the velocity doesn't send ship flying away
        this.objectStructure.spring.Objects[0] = new CANNON.Spring(this.objectStructure.spring.Objects[1],this.objectStructure.spring.Objects[2],{
            localAnchorA: new CANNON.Vec3(0,2.5,0),
            localAnchorB: new CANNON.Vec3(0,0,0),
            restLength : 15,
            stiffness : 100,
            damping : 100,
         });


        this.objectStructure.spring.Objects[4] = new THREE.Mesh( // moving cylinder that attaches the ship to main beam (from both box positions)
            new THREE.CylinderGeometry(.25, .25, 16, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        scene.add(this.objectStructure.spring.Objects[4]);
    }

    animateObj() { // called every frame
        // update the ship mesh with the boxes current pos/rot

        this.objectStructure.spring.Objects[3].position.x = this.objectStructure.spring.Objects[1].position.x;
        this.objectStructure.spring.Objects[3].position.y = this.objectStructure.spring.Objects[1].position.y;
        this.objectStructure.spring.Objects[3].position.z = this.objectStructure.spring.Objects[1].position.z;

        this.objectStructure.spring.Objects[4].position.copy(this.objectStructure.spring.Objects[3].position); // attach moving cylinder to ship box pos
        this.objectStructure.spring.Objects[4].lookAt( // set rotation facing main beam point
            new THREE.Vector3(this.objectStructure.Building.Objects[0].position.x,11,this.objectStructure.Building.Objects[0].position.z)
        );
        if (this.objectStructure.spring.Objects[3].children[0]) { // make sure 3D object is loaded
            if (this.rotatedOnXAxis()) { // object on x axis
                this.objectStructure.spring.Objects[4].rotation.x += Math.PI/2;
                if (this.objectStructure.spring.Objects[4].rotation.x < 0) { // beam always above ship
                    this.objectStructure.spring.Objects[3].children[0].rotation.set(-Math.PI/2, -Math.PI/2, Math.PI/2); // ship rotation
                    this.objectStructure.spring.Objects[4].translateY(-10);
                } else {
                    this.objectStructure.spring.Objects[3].children[0].rotation.set(Math.PI/2, Math.PI/2, -Math.PI/2); // ship rotation
                    this.objectStructure.spring.Objects[4].translateY(10);
                }
            } else { // object on z axis
                this.objectStructure.spring.Objects[4].rotation.y += Math.PI/2;
                if (this.objectStructure.spring.Objects[4].rotation.y < Math.PI/2) { // beam always above 
                    this.objectStructure.spring.Objects[3].children[0].rotation.set(-Math.PI/2, -Math.PI/2, Math.PI/2); // ship rotation
                    this.objectStructure.spring.Objects[4].translateY(-10);
                } else {
                    this.objectStructure.spring.Objects[3].children[0].rotation.set(Math.PI/2, Math.PI/2, -Math.PI/2); // ship rotation
                    this.objectStructure.spring.Objects[4].translateY(10);
                }
            }
            this.objectStructure.spring.Objects[3].quaternion.copy(this.objectStructure.spring.Objects[4].quaternion);
        }
        
        this.objectStructure.spring.Objects[0].applyForce(); // velocity effect
    }
}

class SphereBuilding extends Placement {
    constructor(objName, scene) {
        var geoCylinder = new THREE.CylinderGeometry( 5, 10, 7, 32); // cone on bottom
        var matCylinder = new THREE.MeshBasicMaterial( {color: 0x423e3e} );
        var cylinder = new THREE.Mesh( geoCylinder, [matCylinder, new THREE.MeshBasicMaterial( {color: 0x3cc4e6} ), matCylinder] );
        cylinder.position.y = -10;
        scene.add( cylinder );

        var box = new THREE.Mesh( // bottom plate
            new THREE.BoxGeometry(18, 1, 18),
            new THREE.MeshBasicMaterial({ color: 0x0000FF })
        );
        cylinder.add(box);

        var cylinder2 = new THREE.Mesh( geoCylinder, [matCylinder, new THREE.MeshBasicMaterial( {color: 0x3cc4e6} ), matCylinder]);
        cylinder2.position.y = 30; // cone above ball
        cylinder2.rotation.x = Math.PI;
        cylinder.add( cylinder2 );

        var cylinder3 = new THREE.Mesh( // cone on top
            new THREE.CylinderGeometry(10, 3, 7, 32),
            new THREE.MeshBasicMaterial({ color: 0x423E3E })
        );
        cylinder3.position.y = -7;
        cylinder2.add( cylinder3 );
        
        var geoPoints = new THREE.BufferGeometry();
        var matPoints = new THREE.PointsMaterial({
            size: .1,
            color: 0xFF0000
        });
        var pos = [];
        var radius = 10;
        for (var i = 0; i < 7500; i++) { // reading: https://discourse.threejs.org/t/how-move-all-points-to-sphere/1836/2
            // choose random angle points
            var x = Math.random() * (1 - -1) + -1;
            var y = Math.random() * (1 - -1) + -1;
            var z = Math.random() * (1 - -1) + -1;
            var normalizationFactor = 1 / Math.sqrt( x * x + y * y + z * z );

            pos.push( // increment to sphere radius
                x * normalizationFactor * radius,
                y * normalizationFactor * radius,
                z * normalizationFactor * radius
            );
        }
        geoPoints.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); // set pos array

        var points = new THREE.Points(geoPoints, matPoints);
        points.position.y = 15;
        cylinder.add(points);

        // used for accessing specific objects and finding previous colour
        var objectStructure = {
            Building: {
                Objects: [
                    cylinder,
                    points
                ],
                Colour: 0x7E7E7E
            }
        }

        super(objName, cylinder, 18, 0, 18, objectStructure);
        this.group = new THREE.Group();
        this.group.add(this.objectStructure.Building.Objects[0]);
        scene.add(this.group);
    }

    animateObj(iFrame) {
        if (iFrame % 20 === 0) { // change color every 20 frames
            this.objectStructure.Building.Objects[1].material.color = new THREE.Color(Math.random() * 0xFFFFFF);
        }
        this.objectStructure.Building.Objects[1].rotation.y += 0.01; // rotate
    }
}

export { FlagBuilding, FireworkBuilding, PirateShip, SphereBuilding }