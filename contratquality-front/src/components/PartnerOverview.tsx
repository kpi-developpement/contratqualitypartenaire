"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Building2, Search, ArrowUpDown, Filter, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerOverviewProps {
  period: string;
  overviewBonuses: Record<string, { racc: number; sav: number; total: number }>;
  onPartnerSelect: (partner: string) => void;
}

export default function PartnerOverview({ period, overviewBonuses, onPartnerSelect }: PartnerOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'alpha' | 'bonus-desc' | 'bonus-asc'>('bonus-desc');
  const [filterBy, setFilterBy] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

  const globalData = overviewBonuses["GLOBAL"];
  
  const partnersList = useMemo(() => {
    return Object.entries(overviewBonuses)
      .filter(([partner]) => partner !== "GLOBAL")
      .filter(([partner, sums]) => {
        if (filterBy === 'POSITIVE' && sums.total < 0) return false;
        if (filterBy === 'NEGATIVE' && sums.total >= 0) return false;
        if (searchTerm && !partner.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') return a[0].localeCompare(b[0]);
        if (sortBy === 'bonus-desc') return b[1].total - a[1].total;
        if (sortBy === 'bonus-asc') return a[1].total - b[1].total;
        return 0;
      });
  }, [overviewBonuses, searchTerm, sortBy, filterBy]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } } };

  return (
    <div className="space-y-6">
      
      {/* 1. EXECUTIVE GLOBAL CARD */}
      {globalData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onPartnerSelect("GLOBAL")}
          className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl cursor-pointer group flex flex-col md:flex-row justify-between md:items-center gap-8 relative overflow-hidden"
        >
          {/* Subtle Grid overlay on the dark card */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 group-hover:text-white transition-colors">
              <Globe2 size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Rapport Consolidé Global</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">Bilan régional - Période {period}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full md:w-auto">
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="bg-slate-800/50 border border-slate-700 px-5 py-3 rounded-lg flex-1 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">RACC</p>
                <p className={cn("text-lg font-bold", globalData.racc >= 0 ? "text-emerald-400" : "text-rose-400")}>{(globalData.racc * 100).toFixed(2)}%</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 px-5 py-3 rounded-lg flex-1 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">SAV</p>
                <p className={cn("text-lg font-bold", globalData.sav >= 0 ? "text-emerald-400" : "text-rose-400")}>{(globalData.sav * 100).toFixed(2)}%</p>
              </div>
            </div>
            
            <div className="text-right w-full sm:w-auto">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 text-left sm:text-right">Bonus Final</div>
              <div className={cn("text-4xl font-black tracking-tight", globalData.total >= 0 ? "text-white" : "text-rose-400")}>
                {globalData.total > 0 ? '+' : ''}{(globalData.total * 100).toFixed(2)}%
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. CORPORATE TOOLBAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-2 border-b border-slate-200">
        
        <div className="relative w-full lg:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:ring-0 outline-none transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm px-1 py-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider flex items-center gap-1.5 border-r border-slate-100 mr-1"><ArrowUpDown size={12}/> Tri</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent text-sm font-semibold text-slate-700 py-1 px-2 outline-none cursor-pointer border-none focus:ring-0">
              <option value="bonus-desc">Performance (+)</option>
              <option value="bonus-asc">Performance (-)</option>
              <option value="alpha">A - Z</option>
            </select>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm p-1 shrink-0">
            {(['ALL', 'POSITIVE', 'NEGATIVE'] as const).map((f) => (
              <button 
                key={f} onClick={() => setFilterBy(f)} 
                className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-colors", filterBy === f ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
              >
                {f === 'ALL' ? 'Tous' : f === 'POSITIVE' ? '> 0' : '< 0'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. PARTNERS GRID */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {partnersList.length > 0 ? (
            partnersList.map(([partner, sums]) => (
              <motion.div
                key={partner} layout layoutId={`card-${partner}`} variants={item} exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onPartnerSelect(partner)}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-[180px]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
                      <Building2 size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight w-36 truncate" title={partner}>{partner}</h3>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-800 transition-colors" />
                </div>

                <div className="flex items-end justify-between mt-auto">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold mb-0.5">RACC</div>
                      <div className={cn("text-xs font-bold", sums.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.racc * 100).toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold mb-0.5">SAV</div>
                      <div className={cn("text-xs font-bold", sums.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.sav * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Total</div>
                    <div className={cn("text-2xl font-black tracking-tight", sums.total >= 0 ? "text-slate-900" : "text-rose-600")}>
                      {sums.total > 0 ? '+' : ''}{(sums.total * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <LayoutGrid size={32} className="text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700">Aucun partenaire détecté</h3>
              <p className="text-slate-500 text-sm mt-1">Importez vos fichiers pour générer les rapports.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}