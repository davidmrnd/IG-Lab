# Proyecto: Shader

**Autor:** David Miranda Campos

### Descripción del Proyecto

Este proyecto consiste en el desarrollo de un **shader de fragmentos interactivo** basado en técnicas de ruido procedimental. La propuesta transforma una visualización pasiva de patrones de ruido fractal en una superficie fluida reactiva, permitiendo al usuario manipular la turbulencia y la crominancia del sistema en tiempo real.

-----

### Motivación

Los algoritmos de ruido, como el Ruido de Perlin o el Ruido Simplex, son fundamentales en la computación gráfica para simular fenómenos naturales (humo, nubes, mármol). Sin embargo, muchas implementaciones básicas se limitan a ser "fondos de pantalla" estáticos o bucles de animación predefinidos.

El objetivo principal de este desarrollo implementar un sistema donde el cursor actúa como un agente físico que perturba el medio fluido. La intención es simular la experiencia táctil de interactuar con un líquido: al mover el ratón, se generan corrientes y distorsiones en la superficie digital.

-----

### Referencia y Estado del Arte

El punto de partida de este proyecto es el algoritmo de **Fractional Brownian Motion (fBm)** aplicado sobre una base de **Gradient Noise** (Ruido de Gradiente).

El código base fue seleccionado de los ejemplos educativos de **Patricio Gonzalez Vivo y Jen Lowe** en *The Book of Shaders* [Gon21], específicamente del capítulo sobre Fractal Brownian Motion.

  * **Shader Original:** Implementación estándar de fBm con 6 octavas de ruido.
  * **Comportamiento Original:** El patrón visual fluye únicamente en función de la variable uniforme `u_time`, creando un desplazamiento constante y lineal sin posibilidad de intervención externa.

-----

### Desarrollo de la Solución

El desarrollo de la interacción se centró en la modificación del **sistema de coordenadas** antes de la renderización del patrón final. A continuación se detallan las etapas de implementación:

#### 1\. Integración de Uniforms de Entrada

Para permitir la interactividad, se integró la variable uniforme `u_mouse`. Dado que las coordenadas del ratón se reciben en píxeles (espacio de pantalla), fue necesario realizar una **normalización** al espacio UV (0.0 a 1.0) para hacerlas coherentes con las coordenadas de textura del shader.

```glsl
vec2 mouse = u_mouse.xy / u_resolution.xy;
```

#### 2\. Implementación de Domain Warping (Distorsión de Dominio)

Esta es la contribución técnica central del shader. En lugar de simplemente desplazar la textura, implementé una técnica conocida como *Domain Warping*.

La técnica consiste en utilizar el resultado de una función de ruido `f(p)` para distorsionar el dominio de entrada de una segunda llamada a la función de ruido `f(p + f(p))`.

  * **Mi modificación:** Vinculé la **magnitud** de esta distorsión a la coordenada vertical (`y`) del ratón.
      * Si el ratón está abajo, el fluido es laminar (suave).
      * Al subir el ratón, se multiplica la intensidad del vector de distorsión, creando un flujo turbulento y caótico.

```glsl
// Cálculo del vector de distorsión (Ruido sobre el propio espacio)
vec2 warp_vector = vec2(fbm(st + u_time*0.2), fbm(st + vec2(11.3, 7.1) + u_time*0.2));

// Aplicación de la intensidad controlada por el usuario
float warp_intensity = mouse.y * 4.0; 
st = st + warp_vector * warp_intensity;
```

#### 3\. Retroalimentación Cromática (Feedback Visual)

Para enriquecer la experiencia visual y confirmar la interacción en ambos ejes, se implementó una modificación del color final basada en el eje horizontal (`x`) del ratón. Se alteran los canales Rojo y Azul de manera inversa, permitiendo transiciones suaves entre tonos cálidos y fríos según la posición horizontal.

-----

### Detalles Técnicos

El núcleo del algoritmo se basa en la superposición de capas de ruido (octavas).

  * **Algoritmo Base:** Gradient Noise (interpolación Hermite cúbica).
  * **Fractalidad:** Se itera un ciclo `for` de 6 pasos (octavas). En cada paso:
      * La **frecuencia** se duplica (`st *= 2.0`).
      * La **amplitud** se reduce a la mitad (`amplitude *= 0.5`).
  * **Interacción:** La modificación de las coordenadas `st` mediante el vector `warp_vector` antes de calcular el `fbm` final es lo que produce el efecto de "aceite sobre agua" o deformación elástica.

-----

### Puesta en Marcha Local

Para ejecutar la simulación en su máquina local, siga estos pasos.

1.  **Clonar el repositorio y entrar a este proyecto**

    ```bash
    git clone https://github.com/davidmrnd/IG-Lab
    cd IG-Lab/shader
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

### Demo Interactiva

Puedes experimentar la simulación de dos formas:

1. **The Book of Shaders:** Ingresa a [The Book of Shaders Editor](https://editor.thebookofshaders.com/) y pega el contenido del archivo `shader_modificado.frag` para probar el shader directamente en tu navegador.

2. **CodeSandbox:** Accede a la demo en vivo alojada en CodeSandbox:  
  **[[Haz clic aquí para ver la simulación en vivo](https://codesandbox.io/p/sandbox/ig2526-s9-forked-pm9tk8)]**

-----

### Referencias Bibliográficas

  * **[Gon21]** Gonzalez Vivo, P., & Lowe, J. (2015). *The Book of Shaders*. Capítulo 13: Fractal Brownian Motion. Recuperado de [https://thebookofshaders.com/13/](https://thebookofshaders.com/13/)
  * **[Qui13]** Quilez, I. (2013). *Domain Warping*. Inigo Quilez Articles. Recuperado de [https://iquilezles.org/articles/warp/](https://iquilezles.org/articles/warp/)
