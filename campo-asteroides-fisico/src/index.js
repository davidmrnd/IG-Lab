import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from "@tweenjs/tween.js";
import Ammo from "ammojs-typed";

let camera, controls, scene, renderer;
const clock = new THREE.Clock();
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let physicsWorld;
let transformAux1;
let tempAmmoVec1;
let tempAmmoVec2;
const rigidBodies = [];

let planetBody, planetMesh;

Ammo(Ammo).then(start);

function start() {
  initGraphics();
  initPhysics();
  createSpaceScene();
  initInput();
  animationLoop();
}

function initGraphics() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  camera.position.set(0, 30, 40);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  const sunLight = new THREE.PointLight(0xffaa00, 2, 100);
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  const sunGeo = new THREE.SphereGeometry(3, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sunMesh);

  window.addEventListener("resize", onWindowResize);
}

function initPhysics() {
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const broadphase = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );

  physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));

  transformAux1 = new Ammo.btTransform();
  tempAmmoVec1 = new Ammo.btVector3(0, 0, 0);
  tempAmmoVec2 = new Ammo.btVector3(0, 0, 0);
}

function createSpaceScene() {
  const numAsteroids = 100;
  const radiusRange = 25;

  for (let i = 0; i < numAsteroids; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 10 + Math.random() * radiusRange;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi);

    const size = 0.5 + Math.random() * 1.5;
    const mass = size * 2;

    const gray = 0.3 + Math.random() * 0.5;
    const color = new THREE.Color(gray, gray, gray);

    createBoxWithPhysics(
      size,
      size,
      size,
      mass,
      new THREE.Vector3(x, y, z),
      randomQuat(),
      color
    );
  }

  const planetRadius = 2;
  const orbitRadius = 18;

  const planetGeo = new THREE.SphereGeometry(planetRadius, 32, 32);
  const planetMat = new THREE.MeshPhongMaterial({
    color: 0x0088ff,
    emissive: 0x001133,
  });
  planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.castShadow = true;
  scene.add(planetMesh);

  const shape = new Ammo.btSphereShape(planetRadius);
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(orbitRadius, 0, 0));
  const motionState = new Ammo.btDefaultMotionState(transform);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    0,
    motionState,
    shape,
    new Ammo.btVector3(0, 0, 0)
  );
  planetBody = new Ammo.btRigidBody(rbInfo);
  planetBody.setCollisionFlags(2);
  physicsWorld.addRigidBody(planetBody);

  const tweenOrbit = new TWEEN.Tween({ angle: 0 })
    .to({ angle: Math.PI * 2 }, 15000)
    .onUpdate((obj) => {
      const x = Math.cos(obj.angle) * orbitRadius;
      const z = Math.sin(obj.angle) * orbitRadius;

      planetMesh.position.set(x, 0, z);

      updateKinematicBody(planetBody, x, 0, z);
    })
    .repeat(Infinity)
    .easing(TWEEN.Easing.Linear.None)
    .start();
}

function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshPhongMaterial({ color: color })
  );
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

  const motionState = new Ammo.btDefaultMotionState(transform);
  const localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(mass, localInertia);

  const body = new Ammo.btRigidBody(
    new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia)
  );

  const randRot = new Ammo.btVector3(
    Math.random(),
    Math.random(),
    Math.random()
  );
  body.setAngularVelocity(randRot);
  body.setDamping(0.05, 0.05);

  mesh.userData.physicsBody = body;
  rigidBodies.push(mesh);
  physicsWorld.addRigidBody(body);
}

function updateKinematicBody(body, x, y, z) {
  const ms = body.getMotionState();
  if (ms) {
    transformAux1.setIdentity();
    tempAmmoVec1.setValue(x, y, z);
    transformAux1.setOrigin(tempAmmoVec1);
    ms.setWorldTransform(transformAux1);
  }
}

function randomQuat() {
  const q = new THREE.Quaternion();
  q.setFromEuler(
    new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
  );
  return q;
}

function initInput() {
  window.addEventListener("pointerdown", function (event) {
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    const target = new THREE.Vector3();

    const intersects = raycaster.intersectObjects(scene.children).filter(
      (obj) => obj.object.isMesh
    );

    if (intersects.length > 0) {
      target.copy(intersects[0].point);
    } else {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

      if (!raycaster.ray.intersectPlane(plane, target)) {
        return;
      }
    }

    const radius = 15;
    const strength = 50;

    for (let i = 0; i < rigidBodies.length; i++) {
      const body = rigidBodies[i].userData.physicsBody;

      const ms = body.getMotionState();
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();

      const distX = p.x() - target.x;
      const distY = p.y() - target.y;
      const distZ = p.z() - target.z;
      const distLen = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

      if (distLen < radius) {
        const factor = strength * (1.0 - distLen / radius);

        if (factor > 0) {
          const impulseX = (distX / distLen) * factor;
          const impulseY = (distY / distLen) * factor;
          const impulseZ = (distZ / distLen) * factor;

          body.activate();

          tempAmmoVec1.setValue(impulseX, impulseY, impulseZ);
          tempAmmoVec2.setValue(0, 0, 0);

          body.applyImpulse(tempAmmoVec1, tempAmmoVec2);
        }
      }
    }

    showExplosionEffect(target);
  });
}

function showExplosionEffect(pos) {
  const geo = new THREE.SphereGeometry(0.5, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);

  new TWEEN.Tween(mesh.scale)
    .to({ x: 10, y: 10, z: 10 }, 500)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  new TWEEN.Tween(mat)
    .to({ opacity: 0 }, 500)
    .onComplete(() => scene.remove(mesh))
    .start();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  const deltaTime = clock.getDelta();

  TWEEN.update();
  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    const ms = objPhys.getMotionState();
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }

  renderer.render(scene, camera);
}