#ifdef GL_ES
precision mediump float;
#endif

// El editor proporciona estos uniforms automáticamente
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse; 

// --- Ruido por Gradiente (de Iñigo Quilez / Guion) ---
vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f); // Curva Hermite
    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
// --- Fin del Ruido por Gradiente ---


// --- Función FBM (Ruido Fractal) ---
// Apila 6 capas de ruido (octavas)
#define OCTAVES 6
float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.0; // Dobla la frecuencia
        amplitude *= 0.5; // Reduce la amplitud
    }
    return value;
}
// --- Fin de FBM ---

// --- Función Principal ---
void main() {
    // Normalizar coordenadas y corregir aspecto
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    // --- MODIFICACIÓN: "Domain Warping" controlado por el ratón ---
    
    // 1. Normalizar posición del ratón (de 0.0 a 1.0)
    // El editor BoS tiene (0,0) abajo-izquierda, igual que GLSL
    vec2 mouse = u_mouse.xy / u_resolution.xy;
    
    // 2. Intensidad de la distorsión basada en mouse.y
    float warp_intensity = mouse.y * 4.0; 
    
    // 3. Vector de distorsión (ruido de ruido)
    vec2 warp_vector = vec2(fbm(st + u_time*0.2), 
                            fbm(st + vec2(11.3, 7.1) + u_time*0.2));

    // 4. Aplicar la distorsión a las coordenadas
    st = st + warp_vector * warp_intensity;
    // --- Fin de la Modificación ---

    
    // Calcular el patrón de ruido fluido usando las coords 'st' (ahora distorsionadas)
    float flow = fbm(st * 3.0 + vec2(u_time * 0.1, 0.0));
    
    // Mapear el ruido (rango -1 a 1) a un color (rango 0 a 1)
    vec3 color = vec3( (flow + 1.0) * 0.5 );
    
    // --- MODIFICACIÓN: Añadir tinte de color basado en mouse.x ---
    color.r += mouse.x * 0.5; // Añade rojo
    color.b -= mouse.x * 0.5; // Quita azul
    
    // Color final del píxel
    gl_FragColor = vec4(color,1.0);
}