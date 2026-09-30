"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Utilisation de useSpring ultra-léger (CPU friendly)
  const springX = useSpring(0, { stiffness: 30, damping: 30, mass: 0.5 });
  const springY = useSpring(0, { stiffness: 30, damping: 30, mass: 0.5 });

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Evite les calculs bloquants à chaque pixel
      animationFrameId = requestAnimationFrame(() => {
        springX.set(e.clientX - window.innerWidth / 2);
        springY.set(e.clientY - window.innerHeight / 2);
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [springX, springY]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-50">
      
      {/* 1. Nuages de couleur qui suivent la souris fluides */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-1/2 left-1/2 w-[50vw] h-[50vw] -ml-[25vw] -mt-[25vw] bg-blue-400/10 rounded-full blur-[100px] opacity-50 will-change-transform"
      />
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-1/2 left-1/2 w-[30vw] h-[30vw] -ml-[15vw] -mt-[15vw] bg-indigo-500/10 rounded-full blur-[80px] opacity-40 will-change-transform"
      />

      {/* 2. Grid CSS statique mais avec un effet d'optique (0 lag JS) */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15,23,42,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(20deg) scale(1.2)", 
        }}
      />
      
      {/* 3. Dégradé pour le brouillard */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-slate-50" />
    </div>
  );
}