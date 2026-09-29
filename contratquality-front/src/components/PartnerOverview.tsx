"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
// FIX: Zedt Network w Cpu lfo9 👇
import { Globe2, Building2, Search, ArrowUpDown, Filter, LayoutGrid, Network, Cpu, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerOverviewProps {
  period: string;
  overviewBonuses: Record<string, { racc: number; sav: number; total: number }>;
  onPartnerSelect: (partner: string) => void;
}

const PartnerCard = ({ partner, sums, onClick }: { partner: string, sums: any, onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      layoutId={`card-${partner}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "relative rounded-3xl p-6 transition-colors duration-500 cursor-pointer overflow-hidden flex flex-col shadow-sm border",
        isHovered 
          ? "bg-slate-900 border-slate-800 text-white min-h-[280px] shadow-[0_20px_50px_rgba(15,23,42,0.3)]" 
          : "bg-white/80 backdrop-blur-xl border-slate-200/80 text-slate-800 min-h-[200px]"
      )}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl z-0"
          />
        )}
      </AnimatePresence>

      <motion.div layout className="flex justify-between items-start relative z-10">
        <motion.div layout className="flex items-center gap-3">
          <motion.div layout className={cn("flex items-center justify-center rounded-2xl w-12 h-12 transition-colors duration-500", isHovered ? "bg-blue-500/20 text-blue-400" : "bg-slate-100 text-slate-500 border border-slate-200/50")}>
            <Building2 size={22} />
          </motion.div>
          <motion.h3 layout className={cn("font-black text-lg leading-tight w-36 truncate transition-colors duration-500", isHovered ? "text-white" : "text-slate-800")} title={partner}>
            {partner}
          </motion.h3>
        </motion.div>
        
        <motion.div layout className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500", isHovered ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-400")}>
          <ArrowRight size={18} className={cn("transition-transform duration-300", isHovered ? "-rotate-45" : "")} />
        </motion.div>
      </motion.div>

      <motion.div layout className="mt-auto space-y-3 relative z-10">
        
        <motion.div layout className={cn("flex items-center justify-between p-3 rounded-2xl border transition-colors duration-500", isHovered ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
          <div className="flex items-center gap-2">
            <Network size={16} className={cn(isHovered ? "text-slate-400" : "text-slate-500")} />
            <span className={cn("text-xs font-black uppercase tracking-widest", isHovered ? "text-slate-300" : "text-slate-500")}>RACC</span>
          </div>
          <div className={cn("text-lg font-black tracking-tighter", sums.racc >= 0 ? (isHovered ? "text-emerald-400" : "text-emerald-600") : (isHovered ? "text-rose-400" : "text-rose-600"))}>
            {sums.racc > 0 ? '+' : ''}{(sums.racc * 100).toFixed(2)}%
          </div>
        </motion.div>

        <motion.div layout className={cn("flex items-center justify-between p-3 rounded-2xl border transition-colors duration-500", isHovered ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
          <div className="flex items-center gap-2">
            <Cpu size={16} className={cn(isHovered ? "text-slate-400" : "text-slate-500")} />
            <span className={cn("text-xs font-black uppercase tracking-widest", isHovered ? "text-slate-300" : "text-slate-500")}>SAV</span>
          </div>
          <div className={cn("text-lg font-black tracking-tighter", sums.sav >= 0 ? (isHovered ? "text-emerald-400" : "text-emerald-600") : (isHovered ? "text-rose-400" : "text-rose-600"))}>
            {sums.sav > 0 ? '+' : ''}{(sums.sav * 100).toFixed(2)}%
          </div>
        </motion.div>

      </motion.div>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4 text-center relative z-10">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Voir les détails du contrat</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

  return (
    <div className="space-y-8">
      
      {globalData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onPartnerSelect("GLOBAL")}
          className="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.15)] transition-all duration-500 cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-[80px] -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-125 transition-transform duration-1000 ease-out" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 md:p-5 rounded-3xl bg-slate-900 text-white shadow-xl group-hover:-rotate-3 transition-transform duration-500 border border-slate-700">
                <Globe2 size={40} strokeWidth={2} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Vue Globale</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> Période {period}
                </p>
              </div>
            </div>
            
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all">
              <ArrowRight size={24} className="group-hover:-rotate-45 transition-transform duration-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10 pt-8 border-t border-slate-200/60 relative z-10">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/50 border border-slate-200/60 shadow-sm group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Network size={20} /></div>
                <span className="font-black text-slate-600 text-sm uppercase tracking-wider">Total RACC</span>
              </div>
              <span className={cn("text-3xl font-black", globalData.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.racc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/50 border border-slate-200/60 shadow-sm group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600"><Cpu size={20} /></div>
                <span className="font-black text-slate-600 text-sm uppercase tracking-wider">Total SAV</span>
              </div>
              <span className={cn("text-3xl font-black", globalData.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.sav * 100).toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. TOOLBAR LUXE */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-3 bg-white/90 rounded-2xl border border-slate-200 shadow-sm sticky top-[88px] z-30 backdrop-blur-2xl">
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input type="text" placeholder="Rechercher un partenaire..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/50 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
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

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        <AnimatePresence mode="popLayout">
          {partnersList.length > 0 ? (
            partnersList.map(([partner, sums]) => (
              <PartnerCard key={partner} partner={partner} sums={sums} onClick={() => onPartnerSelect(partner)} />
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-300 shadow-sm">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <LayoutGrid size={40} className="text-slate-300" />
              </div>
              <h3 className="font-black text-2xl text-slate-700 tracking-tight">Aucune donnée trouvée</h3>
              <p className="text-slate-500 font-bold mt-2 text-sm">Vérifiez vos filtres ou importez des fichiers.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}