# Proyecto: Actividad Sísmica de La Palma

**Autor:** David Miranda Campos

## Descripción del Proyecto

Visualización interactiva en 3D de la actividad sísmica en la isla de La Palma, desarrollada con `Three.js`. El proyecto muestra datos geográficos y eventos sísmicos en un mapa tridimensional, permitiendo explorar patrones espaciales y temporales de la actividad volcánica.

## Puesta en Marcha Local

Para ejecutar la simulación en su máquina local, siga estos pasos.

1.  **Clonar el repositorio y entrar a este proyecto**

    ```bash
    git clone https://github.com/davidmrnd/IG-Lab
    cd IG-Lab/actividad-sismica-lapalma
    ```

2.  **Instalar Node.js:**
    Asegúrese de tener una versión reciente de [Node.js](https://nodejs.org/en) instalada. Puede verificar su instalación con:

    ```bash
    node --version
    npm --version
    ```

3.  **Instalar dependencias:**
    Abra un terminal en el directorio raíz del proyecto y ejecute:

    ```bash
    npm install
    ```

4.  **Iniciar el servidor:**
    Una vez termine la instalación, inicie el servidor de desarrollo local:

    ```bash
    npm run start
    ```

5.  **Abrir en el navegador:**
    La consola le indicará la dirección local donde se está ejecutando el servidor (generalmente `http://localhost:1234`). Abra esa URL en su navegador.

6.  Para detener la simulación, pulse `Ctrl + C` en el terminal.


## Guía de Interacción y Controles

### Navegación en el mapa 3D

La navegación se implementa mediante la extensión `OrbitControls` de Three.js, que permite manipular la cámara de forma intuitiva usando el ratón. 

- **Rotar la vista:** Mantenga pulsado el botón izquierdo del ratón y arrastre para girar la cámara alrededor del mapa.
- **Zoom:** Use la rueda del ratón para acercar o alejar la vista.
- **Desplazar:** Mantenga pulsado el botón derecho del ratón y arrastre para mover la cámara lateralmente.

### Interacción con la interfaz lil-gui

La aplicación utiliza la biblioteca `lil-gui` para ofrecer una interfaz gráfica interactiva que permite modificar parámetros de la visualización en tiempo real. Para interactuar con lil-gui:

- **Ver detalles de actividad sísmica:** Si hace clic en alguna esfera que representa un evento sísmico en el mapa, se mostrará la información relevante de esa actividad, como la magnitud, fecha y ubicación.
- **Abrir/ocultar el panel:** Haga clic en el icono de la esquina superior derecha para mostrar u ocultar el panel de controles.
- **Modificar parámetros:** Use los controles deslizantes, casillas y menús desplegables para ajustar opciones como la fecha, opacidad de la isla y otros aspectos.
- **Cambios en tiempo real:** Las modificaciones se aplican inmediatamente en la visualización 3D.

---

## Vídeo de la ejecución de la tarea

[![▶️ Ver demo en YouTube](https://img.youtube.com/vi/IDVIDEO/hqdefault.jpg)](https://youtu.be/IDVIDEO)

https://youtu.be/IDVIDEO

---

## Demo en Vivo (CodeSandbox)

Para explorar la simulación directamente en tu navegador sin necesidad de instalación, puedes acceder a la demo en vivo alojada en CodeSandbox:

**[[Haz clic aquí para ver la simulación en vivo](https://codesandbox.io/p/sandbox/)]**