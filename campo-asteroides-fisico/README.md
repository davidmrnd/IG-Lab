# Proyecto: Entorno Espacial Físico

**Autor:** David Miranda Campos

## Descripción del Proyecto

Este proyecto es una simulación espacial interactiva que integra **física en tiempo real** (motor de cuerpos rígidos) con **animación procedimental**. La escena presenta un campo de asteroides flotando en gravedad cero, un planeta que orbita de forma imparable y un mecanismo de interacción que permite al usuario generar ondas de choque para dispersar los objetos.

El objetivo principal es demostrar la sincronización entre objetos cinemáticos (animados por código) y objetos dinámicos (simulados por física).

## Desarrollo de la Solución

El núcleo del proyecto reside en la coexistencia de dos sistemas de actualización independientes que convergen en el bucle de renderizado:

### 1\. Sistema de Física (Ammo.js)

Se ha implementado un "Mundo Físico" configurado con gravedad cero para simular el vacío espacial.

  * **Cuerpos Dinámicos (Asteroides):** Se generan 100 entidades con forma de caja (`btBoxShape`) y masa variable. Su posición y rotación se calculan en cada frame mediante el motor de física y se sincronizan con las mallas visuales (*Meshes*) de Three.js.
  * **Cuerpos Cinemáticos (Planeta):** El planeta se define como un cuerpo rígido cinemático (`CF_KINEMATIC_OBJECT`). Esto significa que su movimiento no está regido por fuerzas físicas (como colisiones o gravedad), sino que es "imparable" y controlado por lógica de programación, empujando a cualquier asteroide que encuentre en su camino.

### 2\. Sistema de Animación (Tween.js)

Mientras que los asteroides reaccionan al caos físico, el planeta sigue una trayectoria orbital perfecta gestionada por interpolación:

  * Se utiliza `Tween.js` para modificar el ángulo orbital de 0 a $2\pi$ de forma cíclica e infinita.
  * En cada actualización del Tween, se calcula la nueva posición $(x, z)$ y se fuerza la actualización de la matriz de transformación del cuerpo físico del planeta, asegurando que la representación visual y física estén siempre alineadas.

### 3\. Interacción por Raycasting

La interactividad se resuelve mediante un algoritmo de detección y repulsión:

1.  Se proyecta un rayo (*Raycaster*) desde la cámara según las coordenadas del ratón.
2.  Si el rayo intercepta un objeto o el plano de fondo, se determina el punto exacto de impacto en el espacio 3D.
3.  Se itera sobre todos los cuerpos rígidos cercanos, aplicando un impulso vectorial (`applyImpulse`) inversamente proporcional a la distancia del impacto. Esto simula una onda expansiva física que dispersa los objetos de manera realista.



## Puesta en Marcha Local

Para ejecutar la simulación en su máquina local, siga estos pasos.

1.  **Clonar el repositorio y entrar a este proyecto**

    ```bash
    git clone https://github.com/davidmrnd/IG-Lab
    cd IG-Lab/campo-asteroides-fisico
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

-----

## Vídeo de la ejecución de la tarea

[![▶️ Ver demo en YouTube](https://img.youtube.com/vi/Td8JsFNYSMc/hqdefault.jpg)](https://youtu.be/Td8JsFNYSMc)

https://youtu.be/Td8JsFNYSMc

-----

## Demo en Vivo (CodeSandbox)

Para explorar la simulación directamente en tu navegador sin necesidad de instalación, puedes acceder a la demo en vivo alojada en CodeSandbox:

**[[Haz clic aquí para ver la simulación en vivo](https://codesandbox.io/p/devbox/ig2526-s10-forked-yrptcv?workspaceId=ws_8p7URM6ZR4LDfCdE9vXpaU)]**