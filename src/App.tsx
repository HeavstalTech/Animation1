import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';

export default function App() {
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505' }}>
      
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h2>Earth Gravity Simulator</h2>
        <p>Current Gravity: {Math.abs(gravity[1]).toFixed(2)} m/s²</p>
      </div>

      <Canvas camera={{ position: [0, 5, 15], fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

        <Physics gravity={gravity}>
          
          <RigidBody type="fixed" restitution={0.2}>
            <mesh position={[0, -0.5, 0]} receiveShadow>
              <boxGeometry args={[30, 1, 30]} />
              <meshStandardMaterial color="#2d3436" />
            </mesh>
          </RigidBody>

          <RigidBody position={[0, 8, 0]} colliders="ball" restitution={0.9}>
            <mesh castShadow>
              <sphereGeometry args={[1, 32, 32]} />
              <meshStandardMaterial color="#fdcb6e" roughness={0.2} metalness={0.8} />
            </mesh>
          </RigidBody>

          <RigidBody position={[-3, 2, 0]} restitution={0.1}>
            <mesh castShadow><boxGeometry args={[1, 2, 1]}/><meshStandardMaterial color="#e17055"/></mesh>
          </RigidBody>
          <RigidBody position={[-3, 4.5, 0]} restitution={0.1}>
            <mesh castShadow><boxGeometry args={[1, 2, 1]}/><meshStandardMaterial color="#d63031"/></mesh>
          </RigidBody>
          <RigidBody position={[-3, 7, 0]} restitution={0.1}>
            <mesh castShadow><boxGeometry args={[1, 2, 1]}/><meshStandardMaterial color="#c0392b"/></mesh>
          </RigidBody>

        </Physics>

        <OrbitControls />
      </Canvas>
    </div>
  );
}
