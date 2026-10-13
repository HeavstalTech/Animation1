import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, PerspectiveCamera, Text, useGLTF, Html } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function City() {
  const { scene } = useGLTF('/city.glb');
  
  return (
    <group>
      <primitive object={scene} scale={2} position={[0, -0.5, 0]} />
      
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[50, 0.5, 50]} position={[0, -1, 0]} />
      </RigidBody>
    </group>
  );
}

function StreetScene({ is2G }: { is2G: boolean }) {
  return (
    <group>
      <City />

      <RigidBody position={[0, 5, 0]} mass={1500} restitution={0.1}>
        <mesh castShadow>
          <boxGeometry args={[2, 1.5, 4]} />
          <meshStandardMaterial color="royalblue" />
        </mesh>
      </RigidBody>

      <RigidBody position={[3, 10, 2]} colliders="cuboid" mass={80}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 2]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </RigidBody>
    </group>
  );
}

function SpaceScene() {
  return (
    <group position={[0, 500, 0]}>
      <mesh>
        <sphereGeometry args={[50, 64, 64]} />
        <meshStandardMaterial color="#0984e3" wireframe={true} />
      </mesh>
      <Text position={[0, 60, 0]} fontSize={10} color="red">
        GLOBAL GRAVITY: 2.0G
      </Text>
    </group>
  );
}

function CinematicCamera({ stage }: { stage: number }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (!cameraRef.current) return;
    
    if (stage === 0) {
      cameraRef.current.position.lerp(new THREE.Vector3(15, 8, 15), 0.05);
      cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 45, 0.1);
    } else if (stage === 1) {
      cameraRef.current.position.lerp(new THREE.Vector3(5, 2, 8), 0.1);
      cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, 100, 0.1);
      cameraRef.current.rotation.z = THREE.MathUtils.lerp(cameraRef.current.rotation.z, 0.15, 0.1);
    } else if (stage === 2) {
      cameraRef.current.position.lerp(new THREE.Vector3(0, 500, 150), 1);
      cameraRef.current.rotation.z = 0;
    }
    cameraRef.current.updateProjectionMatrix();
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[15, 8, 15]} />;
}

function Loader() {
  return <Html center><div style={{ color: 'white', fontSize: '24px', fontFamily: 'monospace' }}>LOADING ASSETS...</div></Html>;
}

export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState(0); 
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
  const [timeStep, setTimeStep] = useState(1 / 60);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsed === 10 && stage === 0) {
      setStage(1);
      setGravity([0, -19.62, 0]);
      setTimeStep(1 / 240); 
    } 
    else if (elapsed === 15 && stage === 1) {
      setStage(2);
    }
    else if (elapsed === 20 && stage === 2) {
      setStage(3);
      setGravity([0, -9.81, 0]);
      setTimeStep(1 / 60); 
    }
  }, [elapsed, stage]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 10, color: 'white', fontFamily: 'monospace', textShadow: '2px 2px 4px #000' }}>
        <h2>EARTH GRAVITY</h2>
        <h1 style={{ color: stage === 1 || stage === 2 ? '#ff4757' : '#2ed573' }}>
          T+ 00:{elapsed.toString().padStart(2, '0')}
        </h1>
        <p>SCENE: {stage === 0 ? "STREET" : stage === 1 ? "2G IMPACT" : stage === 2 ? "SPACE VIEW" : "AFTERMATH"}</p>
      </div>

      <Canvas shadows dpr={1} performance={{ min: 0.5 }}>
        <Suspense fallback={<Loader />}>
          <CinematicCamera stage={stage} />
          
          {stage < 2 && <Sky sunPosition={[100, 20, 100]} turbidity={stage === 1 ? 20 : 0.1} />}
          <ambientLight intensity={stage === 2 ? 0 : 0.8} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} />

          <Physics gravity={gravity} timeStep={timeStep}>
            <StreetScene is2G={stage >= 1} />
          </Physics>

          {stage >= 2 && <SpaceScene />}
        </Suspense>
      </Canvas>
    </div>
  );
}
