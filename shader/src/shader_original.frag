#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// --- Ruido por Gradiente (Directo de tu guion / I. Quilez) ---
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

    vec3 color = vec3(0.0);
    
    // Animar el FBM con el tiempo para que fluya
    // (Esta es la única parte "activa" del original)
    float flow = fbm(st * 3.0 + vec2(u_time * 0.1, 0.0));
    
    // Mapear el ruido (rango -1 a 1) a un color (rango 0 a 1)
    color = vec3( (flow + 1.0) * 0.5 );
    
    // Color final del píxel
    gl_FragColor = vec4(color,1.0);
}