"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      
      {/* Background Gradient Animé (La couleur li "dayza" w kat-vivre) */}
      <motion.div
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 25, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 bg-[linear-gradient(45deg,#f8fafc,#eff6ff,#e0e7ff,#f1f5f9)] bg-[length:300%_300%]"
      />

      {/* Grid Animée (Défilement continu par dessus le gradient) */}
      <motion.div
        animate={{ x: [0, -48], y: [0, -48] }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
        className="absolute inset-[-50%] opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Interactions douces avec la souris (Blobs) */}
      <motion.div
        animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }}
        transition={{ type: "spring", stiffness: 30, damping: 30 }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }}
        transition={{ type: "spring", stiffness: 30, damping: 30 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"
      />
    </div>
  );
}