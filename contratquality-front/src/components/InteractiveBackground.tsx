"use client";

import { useEffect } from "react";

export default function InteractiveBackground() {
  
  // Utilisation de CSS Variables pour un suivi de souris ULTRA performant (0 lag JS)
  useEffect(() => {
    let animationFrameId: number;
    const updateMousePosition = (ev: MouseEvent) => {
      animationFrameId = requestAnimationFrame(() => {
        const x = (ev.clientX / window.innerWidth - 0.5) * 60;
        const y = (ev.clientY / window.innerHeight - 0.5) * 60;
        document.documentElement.style.setProperty('--mouse-x', `${x}px`);
        document.documentElement.style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f8fafc]">
      
      {/* 1. Brouillard (Fog) de couleurs qui suit la souris via CSS Transform */}
      <div
        className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] -ml-[30vw] -mt-[30vw] bg-blue-400/20 rounded-full blur-[120px] transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: 'translate(var(--mouse-x, 0), var(--mouse-y, 0))' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] -ml-[20vw] -mt-[20vw] bg-indigo-500/20 rounded-full blur-[100px] transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: 'translate(calc(var(--mouse-x, 0) * -1.5), calc(var(--mouse-y, 0) * -1.5))' }}
      />

      {/* Styles d'animation CSS injectés pour la Grid "Mawja" */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { background-position: 0px 0px; }
          100% { background-position: 120px 60px; }
        }
        @keyframes wave-reverse {
          0% { background-position: 0px 0px; }
          100% { background-position: -120px -60px; }
        }
      `}} />

      {/* 2. Grid Wavy (Effet eau/vent) - Couche 1 */}
      <div
        className="absolute inset-[-50%] opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(20deg) scale(1.2)",
          animation: "wave 20s linear infinite"
        }}
      />

      {/* 3. Grid Wavy - Couche 2 (Contre-sens) */}
      <div
        className="absolute inset-[-50%] opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(-10deg) scale(1.1)",
          animation: "wave-reverse 25s linear infinite"
        }}
      />
      
      {/* Overlay dégradé pour adoucir le fond */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f8fafc]/90" />
    </div>
  );
}