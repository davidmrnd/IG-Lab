import * as THREE from 'three';
import fragShader from './shader_modificado.frag';

function main() {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('app').appendChild(renderer.domElement);

    const vertShader = `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `;

    const uniforms = {
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_time: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2(0, 0) }
    };

    const material = new THREE.ShaderMaterial({
        fragmentShader: fragShader,
        vertexShader: vertShader,
        uniforms: uniforms
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    window.addEventListener('mousemove', (e) => {
        uniforms.u_mouse.value.x = e.clientX;
        uniforms.u_mouse.value.y = window.innerHeight - e.clientY;
    });

    function animate() {
        uniforms.u_time.value = performance.now() / 1000;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}

main();
