import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Html, PerspectiveCamera, Grid } from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';

function SceneContent({ setAvailableCameras }) {
  // Loading the GLB from /public/scene.glb
  const { scene, cameras } = useGLTF('/scene.glb');
  const mainCamRef = useRef();
  const [cameraMap, setCameraMap] = useState({});
  const { gl } = useThree();

  useEffect(() => {
    // PS1 Rendering Setup: No fancy lighting math, just raw colors
    gl.toneMapping = THREE.NoToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    const map = {};
    cameras.forEach((cam) => { map[cam.name] = cam; });
    setCameraMap(map);
    setAvailableCameras(Object.keys(map));

    // Global camera transition function
    window.transitionToCamera = (name, duration = 1.2) => {
      const target = map[name];
      if (!target) return;

      const targetPos = new THREE.Vector3();
      const targetQua = new THREE.Quaternion();
      target.getWorldPosition(targetPos);
      target.getWorldQuaternion(targetQua);

      gsap.to(mainCamRef.current.position, {
        x: targetPos.x, y: targetPos.y, z: targetPos.z,
        duration: duration, ease: "power2.inOut"
      });
      gsap.to(mainCamRef.current.quaternion, {
        x: targetQua.x, y: targetQua.y, z: targetQua.z, w: targetQua.w,
        duration: duration, ease: "power2.inOut",
        onUpdate: () => mainCamRef.current.updateProjectionMatrix()
      });
    };

    // Initial Camera Position
    if (map['DefaultCam']) {
      window.transitionToCamera('DefaultCam', 0);
    } else {
      mainCamRef.current.position.set(5, 5, 5);
      mainCamRef.current.lookAt(0, 0, 0);
    }
  }, [cameras, gl, setAvailableCameras]);

  return (
    <>
      <PerspectiveCamera makeDefault ref={mainCamRef} fov={75} far={1000} />
      
      {/* Basic "Resident Evil" Lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

      {/* The 3D Model */}
      <primitive object={scene} />

      {/* Retro Grid for orientation */}
      <Grid infiniteGrid fadeDistance={40} sectionColor="#333" cellColor="#111" />

        <mesh position={[-8.9, 6.6, -4]} rotation={[0, -105.2, 0]}>
        <Html transform occlude distanceFactor={2.5}>
          <div className="contact-paper">
            <h2 style={{ borderBottom: '2px solid black', margin: '0 0 10px 0' }}>SIGNAL_ID</h2>
            <p><strong>Nathan Balducci</strong></p>
            <p style={{ fontSize: '12px' }}>Dev Bio: Building digital artifacts.</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <textarea placeholder="Type message..." />
              <button className="send-btn">SEND SIGNAL</button>
            </form>
          </div>
        </Html>
      </mesh>
    </>
  );
}

export default function App() {
  const [camList, setCamList] = useState([]);
  
  // Custom Labels for your UI
  const cameraLabels = {
    'DefaultCam': 'HSDX.AM',
    'ConsoleCam': 'GAMES',
    'OutdoorCam': 'MUSIC',
    'PhoneCam': 'SIGNAL'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
      
      
      <div className="ui-overlay">
        <div className="status-bar">HSDX_OS // USER_LOGIN</div>
        {camList
          .filter(name => cameraLabels[name])
          .map((name) => (
            <button 
              key={name} 
              className="cam-button" 
              onClick={() => window.transitionToCamera(name)}
            >
              {cameraLabels[name]}
            </button>
          ))}
      </div>

      <Canvas 
        dpr={0.4} 
        gl={{ antialias: false }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Suspense fallback={<Html center><div style={{color:'white', fontFamily:'monospace'}}>MOUNTING...</div></Html>}>
          <SceneContent setAvailableCameras={setCamList} />
        </Suspense>
      </Canvas>
    </div>
  );
}
