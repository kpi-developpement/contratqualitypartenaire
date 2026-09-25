"use client";

import React from "react";

export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-[#fafcfd] pointer-events-none">
      {/* Grid fine et professionnelle (Executive look) */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#000 1px, transparent 1px),
            linear-gradient(90deg, #000 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Léger dégradé gris en bas pour la profondeur */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50" />
    </div>
  );
}