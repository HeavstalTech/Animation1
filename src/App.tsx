import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Sky, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ==========================================
// SCENE DIRECTOR & SCRIPT CONSTANTS
// ==========================================
const SCRIPT = {
  BEFORE_END: 8,    // 0-8s: Normal
  DURING_END: 13,   // 8-13s: 0G
  AFTER_END: 25     // 13-25s: 1G Return
};

// ==========================================
// 3D COMPONENTS (PROCEDURALLY GENERATED)
// ==========================================

// 1. THE COASTAL OCEAN
function ProceduralOcean({ stage }: { stage: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const t = clock.getElapsedTime();
    const positions = waterRef.current.geometry.attributes.position;
    
    // Simulate water restoring force loss during 0G
    const chaosMultiplier = stage === 1 ? 3.0 : 0.8; 
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      // Create undulating waves. At 0G, the waves drift higher and chaotic.
      const z = Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t) * chaosMultiplier;
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={waterRef} position={[0, -2, -30]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 50, 64, 32]} />
      <meshStandardMaterial color="#0984e3" roughness={0.1} metalness={0.8} flatShading />
    </mesh>
  );
}

// 2. THE CITY INFRASTRUCTURE (Road, Sidewalk, Buildings)
function Infrastructure() {
  return (
    <group>
      {/* The Road */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[100, 1, 20]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
      </RigidBody>
      
      {/* Road Markings */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[100, 0.5]} />
        <meshStandardMaterial color="#f1f2f6" />
      </mesh>

      {/* The Sidewalk */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -0.25, 12]} receiveShadow>
          <boxGeometry args={[100, 1.5, 4]} />
          <meshStandardMaterial color="#b2bec3" />
        </mesh>
      </RigidBody>

      {/* Background Building */}
      <RigidBody type="fixed">
        <mesh position={[-10, 10, 20]} castShadow receiveShadow>
          <boxGeometry args={[20, 20, 10]} />
          <meshStandardMaterial color="#636e72" />
        </mesh>
      </RigidBody>
    </group>
  );
}

// 3. THE CAR (Preserves inertia, loses traction at 0G)
function Car({ stage }: { stage: number }) {
  const carRef = useRef<RapierRigidBody>(null);
  const hasTriggered0G = useRef(false);

  useFrame(() => {
    if (!carRef.current) return;
    
    // In Stage 0, give the car constant forward velocity (driving)
    if (stage === 0) {
      carRef.current.setLinvel({ x: 8, y: carRef.current.linvel().y, z: 0 }, true);
    } 
    
    // Exact moment 0G hits: suspension releases (slight upward bump) 
    // Forward velocity is NOT touched. It continues via inertia.
    if (stage === 1 && !hasTriggered0G.current) {
      carRef.current.applyImpulse({ x: 0, y: 1500, z: 0 }, true); // Suspension decompression
      carRef.current.applyTorqueImpulse({ x: 500, y: 0, z: 500 }, true); // Slight tilt
      hasTriggered0G.current = true;
    }
  });

  return (
    <RigidBody ref={carRef} position={[-20, 1, -4]} mass={1500} colliders="cuboid" restitution={0.2} friction={0.8}>
      <group>
        {/* Car Body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[4, 1, 2]} />
          <meshStandardMaterial color="#d63031" />
        </mesh>
        {/* Car Cabin */}
        <mesh position={[-0.5, 1.5, 0]} castShadow>
          <boxGeometry args={[2, 1, 1.8]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
      </group>
    </RigidBody>
  );
}

// 4. THE PEDESTRIAN & BOTTLE
function Pedestrian({ stage }: { stage: number }) {
  const pedRef = useRef<RapierRigidBody>(null);
  const bottleRef = useRef<RapierRigidBody>(null);
  const hasTriggered0G = useRef(false);

  useFrame(() => {
    if (!pedRef.current || !bottleRef.current) return;

    if (stage === 0) {
      // Pedestrian is walking slowly
      pedRef.current.setLinvel({ x: -2, y: pedRef.current.linvel().y, z: 0 }, true);
      // Bottle moves with pedestrian (simulating being held/thrown)
      bottleRef.current.setLinvel({ x: -2, y: bottleRef.current.linvel().y, z: 0 }, true);
    }

    // Exact moment 0G hits: Step force releases, pushing them up slightly
    if (stage === 1 && !hasTriggered0G.current) {
      pedRef.current.applyImpulse({ x: 0, y: 40, z: 0 }, true);
      pedRef.current.applyTorqueImpulse({ x: 10, y: 10, z: 0 }, true);
      
      // Bottle drifts away from the hand
      bottleRef.current.applyImpulse({ x: 0, y: 2, z: 2 }, true);
      bottleRef.current.applyTorqueImpulse({ x: 0.5, y: 0, z: 0.5 }, true);
      
      hasTriggered0G.current = true;
    }
  });

  return (
    <>
      <RigidBody ref={pedRef} position={[5, 2, 12]} mass={80} colliders="hull" lockRotations={stage === 0}>
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 1.8, 16]} />
          <meshStandardMaterial color="#0984e3" />
        </mesh>
      </RigidBody>

      <RigidBody ref={bottleRef} position={[4.5, 2.5, 12.5]} mass={0.5} colliders="hull">
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
          <meshStandardMaterial color="#74b9ff" transparent opacity={0.6} />
        </mesh>
      </RigidBody>
    </>
  );
}

// 5. THE ATMOSPHERE / DUST PARTICLES
function DustParticles({ stage }: { stage: number }) {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate random starting positions for dust
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * 40,
      y: Math.random() * 5 + 0.5,
      z: (Math.random() - 0.5) * 20 + 5,
      velocity: Math.random() * 0.02
    }));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    particles.forEach((particle, i) => {
      // In 0G, dust drifts upward and scatters due to lost gravitational binding
      if (stage === 1) {
        particle.y += particle.velocity;
        particle.x += (Math.random() - 0.5) * 0.01;
      }
      // In 1G (After), dust settles down
      if (stage === 2 && particle.y > 0.1) {
        particle.y -= particle.velocity * 2; 
      }
      
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial color="#dfe6e9" transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ==========================================
// MAIN APP COMPONENT & DIRECTOR
// ==========================================
export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState(0); // 0 = BEFORE, 1 = DURING, 2 = AFTER
  const [gravity, setGravity] = useState<[number, number, number]>([0, -9.81, 0]);

  // Master Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Script Logic
  useEffect(() => {
    if (elapsed === SCRIPT.BEFORE_END && stage === 0) {
      // DURING: 0G
      setStage(1);
      setGravity([0, 0, 0]);
    } else if (elapsed === SCRIPT.DURING_END && stage === 1) {
      // AFTER: 1G Returns
      setStage(2);
      setGravity([0, -9.81, 0]);
    }
  }, [elapsed, stage]);

  // UI Text mapping
  const uiState = 
    stage === 0 ? { title: "BEFORE", desc: "Right now, Earth's gravity holds everything to the ground." } :
    stage === 1 ? { title: "DURING — GRAVITY: 0", desc: "Gravity vanishes. Existing velocity and inertia take over." } :
    { title: "AFTER", desc: "Gravity returns. Objects airborne accelerate toward the ground." };

  if (elapsed > SCRIPT.AFTER_END) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <h1>FIVE SECONDS. GLOBAL CONSEQUENCES.</h1>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#87CEEB', position: 'relative', overflow: 'hidden' }}>
      
      {/* CINEMATIC HUD OVERLAY */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '40px', zIndex: 10, color: 'white', fontFamily: 'sans-serif', pointerEvents: 'none' }}>
        <motion.h1 
          key={uiState.title}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '3rem', margin: 0, textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}
        >
          {uiState.title}
        </motion.h1>
        <motion.p 
          key={uiState.desc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.5', textShadow: '1px 1px 5px rgba(0,0,0,0.8)' }}
        >
          {uiState.desc}
        </motion.p>
        <div style={{ marginTop: '20px', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}>
          0:{elapsed.toString().padStart(2, '0')}
        </div>
      </div>

      {/* 3D SCENE */}
      <Canvas shadows>
        {/* Stationary Camera on the side of the road */}
        <PerspectiveCamera makeDefault position={[15, 4, 25]} rotation={[-0.1, 0.4, 0]} fov={50} />
        
        <Sky sunPosition={[100, 20, -100]} turbidity={0.3} rayleigh={1} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[20, 30, -10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />

        {/* The Physics World */}
        <Physics gravity={gravity}>
          <Infrastructure />
          <Car stage={stage} />
          <Pedestrian stage={stage} />
        </Physics>

        {/* Non-Physics visual elements */}
        <ProceduralOcean stage={stage} />
        <DustParticles stage={stage} />
      </Canvas>
    </div>
  );
}
