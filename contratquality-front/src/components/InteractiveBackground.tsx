"use client";

import { useEffect } from "react";

export default function InteractiveBackground() {
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
      
      {/* 🚀 FIX FPS: Utilisation de radial-gradient PUR au lieu de blur-3xl (Hardware accelerated) */}
      <div
        className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] -ml-[40vw] -mt-[40vw] bg-[radial-gradient(circle,rgba(96,165,250,0.08)_0%,transparent_60%)] transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: 'translate3d(var(--mouse-x, 0), var(--mouse-y, 0), 0)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[50vw] h-[50vw] -ml-[25vw] -mt-[25vw] bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_60%)] transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: 'translate3d(calc(var(--mouse-x, 0) * -1.5), calc(var(--mouse-y, 0) * -1.5), 0)' }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave { 0% { background-position: 0px 0px; } 100% { background-position: 120px 60px; } }
        @keyframes wave-reverse { 0% { background-position: 0px 0px; } 100% { background-position: -120px -60px; } }
      `}} />

      <div
        className="absolute inset-[-50%] opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(20deg) scale(1.2) translateZ(0)",
          animation: "wave 20s linear infinite"
        }}
      />

      <div
        className="absolute inset-[-50%] opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(37, 99, 235, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(-10deg) scale(1.1) translateZ(0)",
          animation: "wave-reverse 25s linear infinite"
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f8fafc]/95" />
    </div>
  );
}