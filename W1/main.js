import * as THREE from 'three';
import { gsap } from 'gsap';

// 1. Global Setup
let cameraMap = {};
const scene = new THREE.Scene();
const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

// 2. The "Realistic" Renderer Configuration
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance" 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// These lines kill the "flat" look:
renderer.outputColorSpace = THREE.SRGBColorSpace;       // Makes colors vibrant/correct
renderer.toneMapping = THREE.ACESFilmicToneMapping;     // Adds high-dynamic-range contrast
renderer.toneMappingExposure = 1.0;                     // Adjust brightness
renderer.shadowMap.enabled = true;                      // Essential for depth
renderer.shadowMap.type = THREE.PCFSoftShadowMap;       // Soft, realistic shadows

document.body.appendChild(renderer.domElement);

// 3. Environment & Lighting (The Secret to Realism)
// Ambient light is too flat on its own. We need a Directional "Sun"
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
// Setup shadow properties for quality
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.far = 50;
scene.add(sunLight);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// 4. Loading Logic
fetch('scene.json')
    .then(res => res.json())
    .then(json => {
        const loader = new THREE.ObjectLoader();
        
        // Parse the objects
        const loadedObject = loader.parse(json.scene || json);
        scene.add(loadedObject);

        // Parse the Project Camera (OutdoorCam)
        if (json.camera) {
            const projCam = loader.parse(json.camera);
            cameraMap[projCam.name] = projCam;
            scene.add(projCam);
        }

        // Map all other cameras
        scene.traverse((child) => {
            if (child.isCamera && child !== mainCamera) {
                cameraMap[child.name] = child;
                child.visible = false;
            }
            // Ensure materials react to light properly
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        if (cameraMap['DefaultCam']) window.transitionToCamera('DefaultCam', 0);
    });

// 5. Transition Engine
window.transitionToCamera = function(name, duration = 2) {
    const target = cameraMap[name];
    if (!target) return console.warn(`Camera ${name} not found`);

    const targetPos = new THREE.Vector3();
    const targetQua = new THREE.Quaternion();
    target.getWorldPosition(targetPos);
    target.getWorldQuaternion(targetQua);

    gsap.to(mainCamera.position, {
        x: targetPos.x, y: targetPos.y, z: targetPos.z,
        duration: duration, ease: "power2.inOut"
    });

    gsap.to(mainCamera.quaternion, {
        x: targetQua.x, y: targetQua.y, z: targetQua.z, w: targetQua.w,
        duration: duration, ease: "power2.inOut",
        onUpdate: () => mainCamera.updateProjectionMatrix()
    });
};

// 6. Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, mainCamera);
}
animate();

window.addEventListener('resize', () => {
    mainCamera.aspect = window.innerWidth / window.innerHeight;
    mainCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
