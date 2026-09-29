"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Utilisation de useSpring pour un suivi de souris ultra-fluide et lourd
  const springX = useSpring(0, { stiffness: 50, damping: 20 });
  const springY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Ajustement par rapport au centre de l'écran
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      setMousePosition({ x, y });
      springX.set(x);
      springY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [springX, springY]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f8fafc]">
      
      {/* 1. Fog / Nuages de couleur qui suivent la souris */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] -ml-[30vw] -mt-[30vw] bg-blue-400/10 rounded-full blur-[120px] opacity-70"
      />
      <motion.div
        style={{ x: springX, y: springY }}
        className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] -ml-[20vw] -mt-[20vw] bg-indigo-500/10 rounded-full blur-[100px] opacity-60"
        transition={{ delay: 0.1 }}
      />

      {/* 2. Grid Wavy (Effet eau/vent) - Couche 1 */}
      <motion.div
        animate={{ 
          backgroundPositionX: ["0px", "100px", "0px"],
          backgroundPositionY: ["0px", "50px", "0px"]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-50%] opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(20deg) scale(1.2)", // Effet de perspective
        }}
      />

      {/* 3. Grid Wavy - Couche 2 (Contre-sens pour l'effet d'eau) */}
      <motion.div
        animate={{ 
          backgroundPositionX: ["0px", "-80px", "0px"],
          backgroundPositionY: ["0px", "-40px", "0px"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-50%] opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(-10deg) scale(1.1)", 
        }}
      />
      
      {/* Overlay dégradé pour adoucir le fond */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f8fafc]/80" />
    </div>
  );
}