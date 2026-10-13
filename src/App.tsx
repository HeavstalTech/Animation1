import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, CameraShake } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { motion } from 'framer-motion';

export default function App() {
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);
  const [timeLeft, setTimeLeft] = useState(5); 
  const [isDoubleG, setIsDoubleG] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isDoubleG) {
      setGravity([0, -19.62, 0]); 
      setIsDoubleG(true);
    }
  }, [timeLeft, isDoubleG]);
  const formattedTime = `T- 00:0${timeLeft}`;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', position: 'relative' }}>
      
      <motion.div 
        style={{ position: 'absolute', top: 40, left: 40, zIndex: 10, color: 'white', fontFamily: 'monospace' }}
        animate={{ color: isDoubleG ? '#ff4757' : '#ffffff' }}
      >
        <motion.h1 
          style={{ fontSize: '4rem', margin: 0, letterSpacing: '2px' }}
          animate={{ scale: isDoubleG ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: isDoubleG ? Infinity : 0, duration: 0.5 }}
        >
          {timeLeft > 0 ? formattedTime : "GRAVITY DOUBLED"}
        </motion.h1>
        
        <div style={{ fontSize: '1.2rem', marginTop: '10px', opacity: 0.8 }}>
          <p>EARTH MASS: {isDoubleG ? 'ANOMALY DETECTED' : 'NOMINAL'}</p>
          <p>CURRENT GRAVITY: {Math.abs(gravity[1]).toFixed(2)} m/s² {isDoubleG && "(2G)"}</p>
          {isDoubleG && (
            <motion.p 
              style={{ fontWeight: 'bold', color: '#ff4757' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              WARNING: STRUCTURAL INTEGRITY COMPROMISED
            </motion.p>
          )}
        </div>
      </motion.div>

      <Canvas camera={{ position: [0, 5, 15], fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

        {isDoubleG && (
          <CameraShake 
            maxYaw={0.2} maxPitch={0.2} maxRoll={0.2} 
            yawFrequency={15} pitchFrequency={15} rollFrequency={15} 
            intensity={1.5} decay={true} decayRate={0.6} 
          />
        )}

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
