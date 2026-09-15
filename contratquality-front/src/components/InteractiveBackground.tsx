"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ParticleSystem = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();
  const count = 4500; // Nombre de particules

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Palette de couleurs : Blue, Light Blue w White
    const colorPrimary = new THREE.Color("#2563eb"); // Blue 600
    const colorSecondary = new THREE.Color("#60a5fa"); // Light Blue 400
    const colorWhite = new THREE.Color("#ffffff"); // White

    for (let i = 0; i < count; i++) {
      // Distribution sphérique l'effet galaxie
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 20 * Math.cbrt(Math.random()); // Rayon d'affichage

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Mix des couleurs aléatoire
      const mix = Math.random();
      const mixedColor = mix > 0.8 ? colorWhite : mix > 0.4 ? colorSecondary : colorPrimary;
      
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      // Rotation fluide auto-matique
      pointsRef.current.rotation.y = time * 0.04;
      pointsRef.current.rotation.x = time * 0.02;
      
      // Interaction m3a l'utilisateur (Parallax effect)
      const targetX = (mouse.x * viewport.width) / 10;
      const targetY = (mouse.y * viewport.height) / 10;
      
      pointsRef.current.position.x += (targetX - pointsRef.current.position.x) * 0.02;
      pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        vertexColors 
        transparent 
        opacity={0.8} 
        sizeAttenuation 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-90">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ParticleSystem />
      </Canvas>
    </div>
  );
}