"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calcul des coordonnées relatives au centre
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f4f7fb]">
      {/* Grid Interactive (La grille bleue super discrète) */}
      <motion.div
        className="absolute inset-[-10%]"
        animate={{ x: mousePos.x * -1, y: mousePos.y * -1 }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Les "L3ibat" (Glows/Blobs lli kay3tiw texture w kay7iydo l'mellel) */}
      <motion.div
        animate={{ x: mousePos.x * 1.5, y: mousePos.y * 1.5 }}
        transition={{ type: "spring", stiffness: 40, damping: 30 }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-300/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: mousePos.x * -1.5, y: mousePos.y * -1.5 }}
        transition={{ type: "spring", stiffness: 40, damping: 30 }}
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-300/15 rounded-full blur-[120px]"
      />
    </div>
  );
}