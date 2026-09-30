"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Building2, Search, ArrowUpDown, Filter, LayoutGrid, Network, Cpu, ArrowRight, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerOverviewProps {
  period: string;
  overviewBonuses: Record<string, { racc: number; sav: number; total: number }>;
  onPartnerSelect: (partner: string) => void;
}

// 🚀 FIX FPS: React.memo empêche de re-rendre 50 cartes quand on tape dans la recherche
const PartnerCard = React.memo(({ partner, sums, onClick }: { partner: string, sums: any, onClick: () => void }) => {
  const isUnknown = partner === "INCONNU";
  
  return (
    <div 
      onClick={onClick}
      className="group relative w-full h-[210px] hover:h-[280px] transition-all duration-300 ease-out rounded-[2rem] p-6 cursor-pointer bg-white border border-slate-200 hover:bg-slate-900 hover:border-slate-800 shadow-sm hover:shadow-2xl overflow-hidden transform-gpu"
    >
      {/* 🚀 FIX FPS: Gradient radial pur au lieu de blur-3xl */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10 transition-transform duration-300 transform-gpu">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl w-12 h-12 transition-colors duration-300 bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30">
            {isUnknown ? <UserX size={22} /> : <Building2 size={22} />}
          </div>
          <h3 className="font-black text-lg leading-tight w-32 truncate transition-colors duration-300 text-slate-800 group-hover:text-white" title={partner}>
            {partner}
          </h3>
        </div>
        
        <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-slate-50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white">
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:-rotate-45" />
        </div>
      </div>

      <div className="absolute left-6 right-6 bottom-6 group-hover:bottom-[60px] transition-all duration-300 ease-out flex flex-col gap-3 z-10 transform-gpu">
        
        <div className="flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300 bg-slate-50 border-slate-100 group-hover:bg-white/5 group-hover:border-white/10">
          <div className="flex items-center gap-2">
            <Network size={16} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Total RACC</span>
          </div>
          <div className={cn("text-lg font-black tracking-tighter transition-colors", sums.racc >= 0 ? "text-emerald-600 group-hover:text-emerald-400" : "text-rose-600 group-hover:text-rose-400")}>
            {sums.racc > 0 ? '+' : ''}{(sums.racc * 100).toFixed(2)}%
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300 bg-slate-50 border-slate-100 group-hover:bg-white/5 group-hover:border-white/10">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Total SAV</span>
          </div>
          <div className={cn("text-lg font-black tracking-tighter transition-colors", sums.sav >= 0 ? "text-emerald-600 group-hover:text-emerald-400" : "text-rose-600 group-hover:text-rose-400")}>
            {sums.sav > 0 ? '+' : ''}{(sums.sav * 100).toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="absolute left-6 right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center z-10">
        <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Ouvrir les détails</span>
      </div>
    </div>
  );
});
PartnerCard.displayName = "PartnerCard"; // Nécessaire pour React.memo

export default function PartnerOverview({ period, overviewBonuses, onPartnerSelect }: PartnerOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'alpha' | 'racc-desc' | 'sav-desc'>('racc-desc');

  const globalData = overviewBonuses["GLOBAL"];
  
  const partnersList = useMemo(() => {
    return Object.entries(overviewBonuses)
      .filter(([partner]) => partner !== "GLOBAL")
      .filter(([partner]) => {
        if (searchTerm && !partner.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') return a[0].localeCompare(b[0]);
        if (sortBy === 'racc-desc') return b[1].racc - a[1].racc;
        if (sortBy === 'sav-desc') return b[1].sav - a[1].sav;
        return 0;
      });
  }, [overviewBonuses, searchTerm, sortBy]);

  // 🚀 FIX FPS: On enlève les animations complexes sur la liste pour un rendu instantané
  return (
    <div className="space-y-8">
      
      {globalData && (
        <div 
          onClick={() => onPartnerSelect("GLOBAL")}
          className="relative bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden transform-gpu"
        >
          {/* Remplacement du blur par Radial Gradient */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 md:p-5 rounded-3xl bg-slate-900 text-white shadow-xl group-hover:-rotate-3 transition-transform duration-300 border border-slate-700">
                <Globe2 size={40} strokeWidth={2} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Rapport Global</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span> Période {period}
                </p>
              </div>
            </div>
            
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all">
              <ArrowRight size={24} className="group-hover:-rotate-45 transition-transform duration-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 pt-8 border-t border-slate-100 relative z-10">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Network size={20} /></div>
                <span className="font-black text-slate-600 text-sm uppercase tracking-wider">Total RACC</span>
              </div>
              <span className={cn("text-3xl font-black", globalData.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.racc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600"><Cpu size={20} /></div>
                <span className="font-black text-slate-600 text-sm uppercase tracking-wider">Total SAV</span>
              </div>
              <span className={cn("text-3xl font-black", globalData.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.sav * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3 bg-white/95 rounded-2xl border border-slate-200 shadow-sm sticky top-[88px] z-30">
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input type="text" placeholder="Rechercher un partenaire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/50 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none" />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/60 w-full lg:w-auto">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent text-slate-700 text-sm font-bold outline-none cursor-pointer border-none focus:ring-0 w-full">
              <option value="racc-desc">Meilleur RACC</option>
              <option value="sav-desc">Meilleur SAV</option>
              <option value="alpha">Ordre Alphabétique</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {partnersList.length > 0 ? (
          partnersList.map(([partner, sums]) => (
            <PartnerCard key={partner} partner={partner} sums={sums} onClick={() => onPartnerSelect(partner)} />
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/80 rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
              <LayoutGrid size={40} className="text-slate-300" />
            </div>
            <h3 className="font-black text-2xl text-slate-700 tracking-tight">Aucun résultat</h3>
            <p className="text-slate-500 font-bold mt-2 text-sm">Vérifiez vos filtres ou importez des fichiers.</p>
          </div>
        )}
      </div>
    </div>
  );
}