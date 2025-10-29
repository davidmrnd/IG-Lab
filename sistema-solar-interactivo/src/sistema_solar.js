import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

let scene, renderer;
let camaraOrbital, camaraNave;
let info;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = new Date();
let accglobal = 0.001;
let timestamp;

let gui;

let guiCreate, guiDelete;
let deleteController;

let orbitCamControls, flyCamControls;
let usarVistaNave, usarVistaOrbital;
let elementosUI;
let selectorCamara, selectorRotacion, carpetaCamara;
let reloj;
let infoCamaraOrbital, infoCamaraNave;
let foco_camara;

const newPlanetSettings = {
  nombre: "Planeta-X",
  radio: 2,
  distancia: 300,
  velocidadOrbita: 1000,
};

const deleteSettings = {
  planetToDelete: null,
};

function obtenerNombresObjetos() {
  let nombres = [];
  if (estrella && estrella.userData.name) {
    nombres.push(estrella.userData.name);
  }
  for (const planeta of Planetas) {
    if (planeta.userData.name !== "Nubes") {
      nombres.push(planeta.userData.name);
    }
  }
  return nombres;
}

function updateCameraTargetDropdown() {
  if (selectorCamara) {
    selectorCamara.destroy();
  }

  const nombres = obtenerNombresObjetos();
  selectorCamara = carpetaCamara
    .add(elementosUI, "Objeto seleccionado", nombres)
    .name("Enfocar Astro");

  selectorCamara.onChange(function (valor) {
    const astro =
      [estrella, ...Planetas].find((p) => p.userData.name === valor) ||
      estrella;
    foco_camara = astro;
  });

  if (foco_camara && foco_camara.userData.name) {
    elementosUI["Objeto seleccionado"] = foco_camara.userData.name;
    selectorCamara.setValue(foco_camara.userData.name);
  }
}

init();
animationLoop();

function createPlanetLabel(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 48;
  context.font = `Bold ${fontSize}px Arial`;

  const metrics = context.measureText(text);
  const textWidth = metrics.width;
  const padding = 10;

  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  context.font = `Bold ${fontSize}px Arial`;
  context.fillStyle = "rgba(255, 255, 255, 1)";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(material);

  const aspect = canvas.width / canvas.height;
  const spriteHeight = 4;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);

  return sprite;
}

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.right = "auto";
  info.style.left = "30px";
  info.style.width = "auto";
  info.style.textAlign = "left";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  document.body.appendChild(info);

  infoCamaraOrbital = document.createElement("div");
  infoCamaraNave = document.createElement("div");

  infoCamaraOrbital.innerHTML =
    "<b>Controles Vista Orbital</b><br>" +
    "<br>" +
    "Zoom: Rueda del ratón<br>" +
    "Movimiento: Arrastrar el ratón<br>";

  infoCamaraNave.innerHTML =
    "<b>Controles Vista Nave</b><br>" +
    "<br>" +
    "Orientar Cámara: Arrastrar el ratón<br>" +
    "Mover Nave: Teclas W, A, S, D<br>" +
    "Girar: Teclas Q, E<br>" +
    "Ascender/Descender: Teclas R, F";
  info.appendChild(infoCamaraOrbital);

  scene = new THREE.Scene();

  camaraOrbital = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camaraOrbital.position.set(0, 150, 300);
  camaraOrbital.lookAt(0, 0, 0);

  camaraNave = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camaraNave.position.set(0, 100, 350);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  orbitCamControls = new OrbitControls(camaraOrbital, renderer.domElement);

  flyCamControls = new FlyControls(camaraNave, renderer.domElement);
  flyCamControls.dragToLook = true;
  flyCamControls.movementSpeed = 10.0;
  flyCamControls.rollSpeed = 0.05;

  reloj = new THREE.Clock();

  flyCamControls.enabled = false;
  usarVistaNave = false;
  usarVistaOrbital = true;

  gui = new GUI();

  guiCreate = gui.addFolder("Crear Astro");
  guiCreate.add(newPlanetSettings, "nombre").name("Nombre");
  guiCreate.add(newPlanetSettings, "radio", 0.5, 10).name("Radio");
  guiCreate.add(newPlanetSettings, "distancia", 20, 500).name("Distancia");
  guiCreate
    .add(newPlanetSettings, "velocidadOrbita", 50, 20000)
    .name("Días de órbita");
  guiCreate.add({ add: addPlanetFromGUI }, "add").name("Añadir Planeta");
  guiCreate.open();

  guiDelete = gui.addFolder("Borrar Astro");
  updateDeleteDropdown();
  guiDelete
    .add({ remove: deleteSelectedPlanet }, "remove")
    .name("Borrar Seleccionado");
  guiDelete.open();

  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);
  const pointLight = new THREE.PointLight(0xffffff, 2, 0);
  scene.add(pointLight);

  const txsun = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/sunmap.jpg", import.meta.url));
  const txmerc = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/mercurymap.jpg", import.meta.url));
  const txbmerc = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/mercurybump.jpg", import.meta.url));
  const txvenus = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/venusmap.jpg", import.meta.url));
  const txbvenus = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/venusbump.jpg", import.meta.url));
  const txtierra = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/earthmap1k.jpg", import.meta.url));
  const txbtierra = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/earthbump1k.jpg", import.meta.url));
  const txspectierra = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/earthspec1k.jpg", import.meta.url));
  const txnubes = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/earthcloudmap.jpg", import.meta.url));
  const txalphanubes = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/earthcloudmaptrans_invert.jpg", import.meta.url));
  const txmarte = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/marsmap1k.jpg", import.meta.url));
  const txbmarte = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/marsbump1k.jpg", import.meta.url));
  const txjupiter = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/jupitermap.jpg", import.meta.url));
  const txsaturno = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/saturnmap.jpg", import.meta.url));
  const txurano = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/uranusmap.jpg", import.meta.url));
  const txneptuno = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/neptunemap.jpg", import.meta.url));
  const txluna = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/moonmap1k.jpg", import.meta.url));
  const txbluna = new THREE.TextureLoader().load(
    new URL("/src/planet_texture_maps/moonbump1k.jpg", import.meta.url));

  estrella = Estrella(10, 0xffffff, txsun);

  const planetData = [
    ["Mercurio", 1, 25, 88, 1407.6, txmerc, txbmerc],
    ["Venus", 2, 40, 225, -5832, txvenus, txbvenus],
    ["Tierra", 2.5, 60, 365, 24, txtierra, txbtierra, txspectierra],
    ["Marte", 2.2, 80, 687, 24.6, txmarte, txbmarte],
    ["Júpiter", 7, 120, 4333, 9.9, txjupiter],
    ["Saturno", 6, 160, 10759, 10.7, txsaturno],
    ["Urano", 5, 200, 30687, -17.2, txurano],
    ["Neptuno", 4.5, 240, 60190, 16.1, txneptuno],
  ];

  for (let data of planetData) {
    const [name, radius, dist, days, rotHrs, texture, bump, spec] = data;
    const orbitSpeed = 1 / days;
    const rotSpeed = 0.0001 * (24 / Math.abs(rotHrs));
    const planeta = Planeta(
      scene,
      radius,
      dist,
      orbitSpeed,
      0xffffff,
      1,
      1,
      texture,
      bump,
      spec,
      undefined,
      rotSpeed
    );
    planeta.userData.name = name;

    const label = createPlanetLabel(name);
    label.position.set(0, radius + 3, 0);
    planeta.add(label);

    if (name === "Tierra") {
      const nubes = Planeta(
        planeta,
        2.52,
        0,
        0,
        0xffffff,
        1,
        1,
        txnubes,
        undefined,
        undefined,
        txalphanubes,
        0.0003
      );
      nubes.userData.name = "Nubes";
      Luna(planeta, 0.7, 6, 6.0, 0xb5b5b5, 0, txluna, txbluna);
    }
  }

  elementosUI = {
    "Objeto seleccionado": "Sol",
    "Rotación automática": false,
    "Vista seleccionada": "Vista Orbital",
    "Velocidad Nave": flyCamControls.movementSpeed,
  };

  carpetaCamara = gui.addFolder("Cámara y Vistas");

  selectorCamara = carpetaCamara
    .add(elementosUI, "Objeto seleccionado", obtenerNombresObjetos())
    .name("Enfocar Astro");
  selectorCamara.onChange(function (valor) {
    const astro =
      [estrella, ...Planetas].find((p) => p.userData.name === valor) ||
      estrella;
    foco_camara = astro;
  });

  selectorRotacion = carpetaCamara
    .add(elementosUI, "Rotación automática")
    .name("Rotar Auto Orbital");
  selectorRotacion.onChange(function (valor) {
    orbitCamControls.autoRotate = valor;
  });

  carpetaCamara
    .add(elementosUI, "Velocidad Nave", 0.1, 50.0)
    .name("Velocidad Nave")
    .onChange((val) => {
      flyCamControls.movementSpeed = val;
    });

  carpetaCamara
    .add(elementosUI, "Vista seleccionada", [
      "Vista Orbital",
      "Vista Nave",
      "Ambas",
    ])
    .name("Modo de Vista")
    .onChange(function (valor) {
      while (
        info.firstChild &&
        info.firstChild !== infoCamaraOrbital &&
        info.firstChild !== infoCamaraNave
      ) {
        info.removeChild(info.firstChild);
      }
      if (info.contains(infoCamaraOrbital)) info.removeChild(infoCamaraOrbital);
      if (info.contains(infoCamaraNave)) info.removeChild(infoCamaraNave);

      if (valor == "Vista Nave") {
        usarVistaNave = true;
        usarVistaOrbital = false;
        selectorCamara.disable();
        selectorRotacion.disable();
        flyCamControls.enabled = true;
        orbitCamControls.enabled = false;
        info.appendChild(infoCamaraNave);
      } else if (valor == "Vista Orbital") {
        usarVistaNave = false;
        usarVistaOrbital = true;
        selectorCamara.enable();
        selectorRotacion.enable();
        flyCamControls.enabled = false;
        orbitCamControls.enabled = true;
        info.appendChild(infoCamaraOrbital);
      } else if (valor == "Ambas") {
        usarVistaNave = true;
        usarVistaOrbital = true;
        selectorCamara.enable();
        selectorRotacion.enable();
        flyCamControls.enabled = true;
        orbitCamControls.enabled = true;
        info.appendChild(infoCamaraOrbital);
        info.appendChild(infoCamaraNave);
      }
    });

  carpetaCamara.open();

  foco_camara = estrella;
  updateDeleteDropdown();
}

function Estrella(rad, col, textura) {
  const geometry = new THREE.SphereGeometry(rad, 64, 64);
  const material = new THREE.MeshBasicMaterial({
    map: textura,
    color: col,
    emissive: 0xffffff,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.userData.name = "Sol";

  scene.add(mesh);
  return mesh;
}

function Planeta(
  padre,
  radio,
  dist,
  speed,
  col,
  f1 = 1,
  f2 = 1,
  texture = undefined,
  texbump = undefined,
  texspec = undefined,
  texalpha = undefined,
  rotationSpeed = 0.01,
  sombra = false
) {
  const geometry = new THREE.SphereGeometry(radio, 64, 64);
  const material = new THREE.MeshPhongMaterial({ color: col });
  if (texture) material.map = texture;
  if (texbump) {
    material.bumpMap = texbump;
    material.bumpScale = 0.1;
  }
  if (texspec) {
    material.specularMap = texspec;
    material.specular = new THREE.Color("gray");
  }
  if (texalpha) {
    material.alphaMap = texalpha;
    material.transparent = true;
    material.side = THREE.DoubleSide;
  }

  const mesh = new THREE.Mesh(geometry, material);

  const orbitShape = new THREE.EllipseCurve(0, 0, dist * f1, dist * f2);
  const points = orbitShape.getPoints(100);
  const orbitGeom = new THREE.BufferGeometry().setFromPoints(
    points.map((p) => new THREE.Vector3(p.x, 0, p.y))
  );
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x888888 });
  const orbit = new THREE.Line(orbitGeom, orbitMat);

  if (padre === scene) {
    scene.add(orbit);
  }

  mesh.userData = {
    dist,
    speed,
    f1,
    f2,
    rotationSpeed,
    angle: Math.random() * Math.PI * 2,
    orbit: orbit,
    name: "Planeta",
  };

  padre.add(mesh);
  Planetas.push(mesh);

  return mesh;
}

function Luna(
  planeta,
  radio,
  dist,
  speed,
  col,
  angle = 0,
  texture = undefined,
  texbump = undefined
) {
  const pivot = new THREE.Object3D();
  pivot.rotation.x = angle;
  planeta.add(pivot);
  const geometry = new THREE.SphereGeometry(radio, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: col });
  if (texture) material.map = texture;
  if (texbump) {
    material.bumpMap = texbump;
    material.bumpScale = 0.05;
  }
  const luna = new THREE.Mesh(geometry, material);
  luna.userData = { dist, speed, angle: Math.random() * Math.PI * 2 };
  Lunas.push(luna);
  pivot.add(luna);
}

function addPlanetFromGUI() {
  const p = newPlanetSettings;
  const orbitSpeed = 1 / p.velocidadOrbita;
  const rotSpeed = 0.0001 * (24 / 24);

  const newPlanet = Planeta(
    scene,
    p.radio,
    p.distancia,
    orbitSpeed,
    0xffffff,
    1,
    1,
    undefined,
    undefined,
    undefined,
    undefined,
    rotSpeed
  );

  newPlanet.userData.name = p.nombre;

  const label = createPlanetLabel(p.nombre);
  label.position.set(0, p.radio + 2, 0);
  newPlanet.add(label);

  updateDeleteDropdown();
  updateCameraTargetDropdown();
}

function deleteSelectedPlanet() {
  const name = deleteSettings.planetToDelete;
  if (!name) return;

  const planet = Planetas.find((p) => p.userData.name === name);
  if (!planet) return;

  if (foco_camara === planet) {
    foco_camara = estrella;
  }

  removePlanet(planet);

  deleteSettings.planetToDelete = null;
  updateDeleteDropdown();

  updateCameraTargetDropdown();
}

function removePlanet(planet) {
  planet.parent.remove(planet);

  if (planet.userData.orbit) {
    planet.userData.orbit.parent.remove(planet.userData.orbit);
    planet.userData.orbit.geometry.dispose();
    planet.userData.orbit.material.dispose();
  }

  Planetas = Planetas.filter((p) => p !== planet);

  planet.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry.dispose();
      obj.material.dispose();
    }

    if (obj.isSprite) {
      obj.material.map.dispose();
      obj.material.dispose();
    }

    const moonIndex = Lunas.indexOf(obj);
    if (moonIndex > -1) {
      Lunas.splice(moonIndex, 1);
    }
  });
}

function updateDeleteDropdown() {
  if (deleteController) {
    deleteController.destroy();
  }

  const planetNames = Planetas.map((p) => p.userData.name).filter(
    (name) => name !== "Nubes"
  );

  planetNames.unshift(null);

  deleteController = guiDelete
    .add(deleteSettings, "planetToDelete", planetNames)
    .name("Seleccionar");
}

function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;
  const delta = reloj.getDelta();

  requestAnimationFrame(animationLoop);

  for (let planet of Planetas) {
    planet.userData.angle += planet.userData.speed;
    planet.position.x = Math.cos(planet.userData.angle) * planet.userData.dist;
    planet.position.z = Math.sin(planet.userData.angle) * planet.userData.dist;
    planet.rotation.y += planet.userData.rotationSpeed;
  }

  for (let luna of Lunas) {
    luna.userData.angle += luna.userData.speed * 0.01;
    luna.position.x = Math.cos(luna.userData.angle) * luna.userData.dist;
    luna.position.z = Math.sin(luna.userData.angle) * luna.userData.dist;
    luna.rotation.y += 0.01;
  }

  if (usarVistaOrbital) {
    orbitCamControls.target.x = foco_camara.position.x;
    orbitCamControls.target.y = foco_camara.position.y;
    orbitCamControls.target.z = foco_camara.position.z;
    orbitCamControls.update();
  }

  if (usarVistaNave) {
    flyCamControls.update(delta);
  }

  let x, y, w, h;

  renderer.setScissorTest(true);

  if (usarVistaNave && usarVistaOrbital) {
    x = 0;
    y = 0;
    w = Math.floor(window.innerWidth * 0.5);
    h = window.innerHeight;

    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);
    camaraOrbital.aspect = w / h;
    camaraOrbital.updateProjectionMatrix();
    renderer.render(scene, camaraOrbital);

    x = Math.floor(window.innerWidth * 0.5);
    y = 0;
    w = Math.floor(window.innerWidth * 0.5);
    h = window.innerHeight;

    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);
    camaraNave.aspect = w / h;
    camaraNave.updateProjectionMatrix();
    renderer.render(scene, camaraNave);
  } else {
    x = 0;
    y = 0;
    w = window.innerWidth;
    h = window.innerHeight;

    renderer.setViewport(x, y, w, h);
    renderer.setScissor(x, y, w, h);

    if (usarVistaOrbital) {
      camaraOrbital.aspect = w / h;
      camaraOrbital.updateProjectionMatrix();
      renderer.render(scene, camaraOrbital);
    } else if (usarVistaNave) {
      camaraNave.aspect = w / h;
      camaraNave.updateProjectionMatrix();
      renderer.render(scene, camaraNave);
    }
  }

  renderer.setScissorTest(false);
}
