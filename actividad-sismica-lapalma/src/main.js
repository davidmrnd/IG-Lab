import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from 'lil-gui';

let scene, renderer, camera, controls;
let laPalmaMesh;
let objetosSismos = [];
let datosSismos = [];

let fechaDiv;
let infoDiv;
let gui;
let clock;
let minFecha, maxFecha;

let guiControls = {
  opacity: 0.8,
  isPlaying: true,
  speed: 1.0,
  timeSlider: 0,
  playPauseController: null,
  timeSliderController: null
};

const REAL_IMG_WIDTH = 1485;
const REAL_IMG_HEIGHT = 1880;
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10 * (REAL_IMG_HEIGHT / REAL_IMG_WIDTH);
const DISPLACEMENT_SCALE = 1.25;

const MAP_MIN_LON = -18.096491028;
const MAP_MAX_LON = -17.705408327;
const MAP_MIN_LAT = 28.444992237;
const MAP_MAX_LAT = 28.860555405;

const BASE_SPEED = 86400000;

function togglePlayPause() {
  guiControls.isPlaying = !guiControls.isPlaying;
  if (guiControls.playPauseController) {
    guiControls.playPauseController.updateDisplay();
  }
}

init();
animate();

function init() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  const colorTexture = new THREE.TextureLoader().load(
    new URL("/src/assets/la-palma-color.png", import.meta.url));
  const heightmapTexture = new THREE.TextureLoader().load(
    new URL("/src/assets/la-palma-heightmap.png", import.meta.url));

  const material = new THREE.MeshPhongMaterial({
    map: colorTexture,
    displacementMap: heightmapTexture,
    displacementScale: DISPLACEMENT_SCALE,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  guiControls.opacity = 0.8;

  const geometry = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT, 200, 200);
  laPalmaMesh = new THREE.Mesh(geometry, material);
  laPalmaMesh.rotation.x = -Math.PI / 2;
  scene.add(laPalmaMesh);

  fechaDiv = document.createElement("div");
  fechaDiv.style.position = "absolute";
  fechaDiv.style.top = "10px";
  fechaDiv.style.width = "100%";
  fechaDiv.style.textAlign = "center";
  fechaDiv.style.color = "#fff";
  fechaDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
  fechaDiv.style.padding = "5px";
  fechaDiv.style.fontFamily = "Monospace";
  fechaDiv.style.fontSize = "16px";
  fechaDiv.style.zIndex = "100";
  fechaDiv.innerHTML = "Cargando sismos...";
  document.body.appendChild(fechaDiv);

  infoDiv = document.createElement("div");
  infoDiv.style.position = "absolute";
  infoDiv.style.left = "10px";
  infoDiv.style.top = "50px";
  infoDiv.style.width = "250px";
  infoDiv.style.color = "#fff";
  infoDiv.style.backgroundColor = "rgba(0,0,0,0.7)";
  infoDiv.style.padding = "10px";
  infoDiv.style.fontFamily = "Monospace";
  infoDiv.style.fontSize = "12px";
  infoDiv.style.zIndex = "100";
  infoDiv.style.display = "none"; // Inicialmente oculto
  document.body.appendChild(infoDiv);

  gui = new GUI(); 
  
  gui.add(guiControls, 'opacity', 0, 1, 0.01)
     .name('Opacidad Mapa')
     .onChange((value) => {
        laPalmaMesh.material.opacity = value;
     });
  
  guiControls.playPauseController = gui.add(guiControls, 'isPlaying')
     .name('Play/Pause (Espacio)')
     .onChange(togglePlayPause);
  
  guiControls.speedController = gui.add(guiControls, 'speed', 0.1, 20, 0.1)
     .name('Velocidad (x)');

  const csvUrl = new URL("/src/assets/sismos.csv", import.meta.url);
  fetch(csvUrl)
    .then((response) => response.text())
    .then((content) => {
      procesarCSVSismos(content); 
    })
    .catch((error) => {
      console.error("Error al cargar el CSV de sismos:", error);
      fechaDiv.innerHTML = "ERROR AL CARGAR SISMOS.CSV";
    });

  window.addEventListener("resize", onWindowResize, false);
  
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlayPause();
    }
  });

  renderer.domElement.addEventListener('click', onMouseClick, false);

}

function onMouseClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(objetosSismos);

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    if (intersected.visible) {
      const data = intersected.userData;
      infoDiv.innerHTML = `
        <strong>Información del Sismo</strong><br>
        Fecha: ${data.fecha.toLocaleString('es-ES')}<br>
        Latitud: ${data.lat.toFixed(4)}<br>
        Longitud: ${data.lon.toFixed(4)}<br>
        Profundidad: ${data.prof} Km<br>
        Magnitud: ${data.mag}
      `;
      infoDiv.style.display = "block";
    } else {
      infoDiv.style.display = "none";
    }
  } else {
    infoDiv.style.display = "none";
  }
}

function procesarCSVSismos(content) { 
  const sep = ";";
  const filas = content.split("\n");
  const encabezados = filas[0].split(sep).map(h => h.trim());

  const indices = {
    fecha: encabezados.indexOf("Fecha"),
    hora: encabezados.indexOf("Hora"),
    lat: encabezados.indexOf("Latitud"),
    lon: encabezados.indexOf("Longitud"),
    prof: encabezados.indexOf("Prof.(Km)"),
    mag: encabezados.indexOf("Mag.")
  };
  if (indices.lat === -1 || indices.lon === -1 || indices.prof === -1 || indices.mag === -1 || indices.fecha === -1 || indices.hora === -1) {
    console.error("ERROR: Faltan columnas en el CSV.");
    console.log("Índices:", indices);
    return;
  }
  const colorBase = new THREE.Color(0xffffff);
  const colorPeligro = new THREE.Color(0xff0000);
  let tempMinFecha = new Date(9999, 0, 1);
  let tempMaxFecha = new Date(1000, 0, 1);
  for (let i = 1; i < filas.length; i++) {
    const columna = filas[i].split(sep);
    if (columna.length > indices.mag) {
      const lat = parseFloat(columna[indices.lat].replace(",", "."));
      const lon = parseFloat(columna[indices.lon].replace(",", "."));
      const prof = parseFloat(columna[indices.prof].replace(",", "."));
      const mag = parseFloat(columna[indices.mag].replace(",", "."));
      const fechaStr = columna[indices.fecha].trim();
      const horaStr = columna[indices.hora].trim();
      if (isNaN(lat) || isNaN(lon) || isNaN(prof) || isNaN(mag) || !fechaStr || !horaStr) continue;
      
      const fecha = convertirFechaSismo(fechaStr, horaStr);
      if (fecha < tempMinFecha) tempMinFecha = fecha;
      if (fecha > tempMaxFecha) tempMaxFecha = fecha;
      
      let mx = Map2Range(lon, MAP_MIN_LON, MAP_MAX_LON, -MAP_WIDTH / 2, MAP_WIDTH / 2);
      let mz = Map2Range(lat, MAP_MIN_LAT, MAP_MAX_LAT, MAP_HEIGHT / 2, -MAP_HEIGHT / 2);
      let my = Map2Range(prof, 0, 50, 0, -2); 
      let t = Map2Range(mag, 1.0, 5.0, 0.0, 1.0);
      t = Math.max(0, Math.min(t, 1));
      let sismoColor = new THREE.Color().lerpColors(colorBase, colorPeligro, t);
      let sismoRadio = Map2Range(mag, 1.0, 5.0, 0.02, 0.1); 
      datosSismos.push({ fecha, mx, my, mz, sismoRadio, sismoColor, lat, lon, prof, mag });
    }
  }
  minFecha = tempMinFecha;
  maxFecha = tempMaxFecha;
  crearTodasLasBolas();

  guiControls.timeSlider = minFecha.getTime();
  
  guiControls.timeSliderController = gui.add(guiControls, 'timeSlider', minFecha.getTime(), maxFecha.getTime(), 1000)
     .name('Time Scrubber')
     .listen() 
     .onChange((timeValue) => {
        if (guiControls.isPlaying) {
          togglePlayPause();
        }
        
        const fechaActual = new Date(timeValue);
        fechaDiv.innerHTML = fechaActual.toLocaleString('es-ES');
        filtrarSismosActivos(fechaActual);
     });

  const fechaInicial = new Date(minFecha.getTime());
  fechaDiv.innerHTML = fechaInicial.toLocaleString('es-ES');
  filtrarSismosActivos(fechaInicial);
  
  console.log(`Cargados ${objetosSismos.length} sismos. Rango: ${minFecha.toLocaleString()} a ${maxFecha.toLocaleString()}`);
}

function crearTodasLasBolas() {
  const sismoGeometry = new THREE.SphereGeometry(1, 16, 16); 
  for (const data of datosSismos) {
    const material = new THREE.MeshBasicMaterial({ color: data.sismoColor });
    const mesh = new THREE.Mesh(sismoGeometry, material);
    mesh.position.set(data.mx, data.my, data.mz);
    mesh.scale.set(data.sismoRadio, data.sismoRadio, data.sismoRadio);
    mesh.userData = {
      fecha: data.fecha,
      lat: data.lat,
      lon: data.lon,
      prof: data.prof,
      mag: data.mag
    };
    mesh.visible = false; 
    objetosSismos.push(mesh);
    scene.add(mesh);
  }
}
function filtrarSismosActivos(fechaActual) {
  for (const sismo of objetosSismos) {
    sismo.visible = (sismo.userData.fecha <= fechaActual);
  }
}
function convertirFechaSismo(fechaStr, horaStr) {
  const [dia, mes, anio] = fechaStr.split('/');
  const [h, m, s] = horaStr.split(':');
  return new Date(anio, mes - 1, dia, h, m, s);
}
function Map2Range(val, vmin, vmax, dmin, dmax) {
  let t = 1 - (vmax - val) / (vmax - vmin);
  if (vmax - vmin === 0) t = 0;
  t = Math.max(0, Math.min(t, 1)); 
  return dmin + t * (dmax - dmin);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();

  if (guiControls.isPlaying && guiControls.timeSliderController) {
    let currentTime = guiControls.timeSlider;
    
    let advanceMs = (BASE_SPEED * guiControls.speed) * delta;
    
    let newTime = currentTime + advanceMs;

    if (newTime >= maxFecha.getTime()) {
      newTime = maxFecha.getTime();
      togglePlayPause();
    }

    guiControls.timeSlider = newTime;
    
    guiControls.timeSliderController.updateDisplay(); 

    const fechaActual = new Date(newTime);
    fechaDiv.innerHTML = fechaActual.toLocaleString('es-ES');
    
    filtrarSismosActivos(fechaActual);
  }

  controls.update();
  renderer.render(scene, camera);
}