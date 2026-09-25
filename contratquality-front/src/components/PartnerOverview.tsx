"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Building2, Search, ArrowUpDown, Filter, TrendingUp, TrendingDown, ChevronRight, LayoutGrid } from "lucide-react";
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

  // Séparer le GLOBAL du reste
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

  // Framer Motion Variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="space-y-8">
      
      {/* 1. HERO CARD : PERFORMANCE GLOBALE */}
      {globalData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onPartnerSelect("GLOBAL")}
          className="relative bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] cursor-pointer group overflow-hidden"
        >
          {/* L'effet de lumière derrière la carte Globale */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform">
                <Globe2 size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Performance Globale</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Période {period}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right w-full md:w-auto">
              <div className={cn("text-5xl md:text-6xl font-black tracking-tighter drop-shadow-sm", globalData.total >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {globalData.total > 0 ? '+' : ''}{(globalData.total * 100).toFixed(2)}%
              </div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-2">Total Bonus Régional</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-slate-100/50 transition-colors">
              <span className="font-extrabold text-slate-500">Total RACC</span>
              <span className={cn("text-xl font-black", globalData.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.racc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-5 rounded-2xl bg-purple-50/50 border border-purple-100/50 group-hover:bg-purple-50 transition-colors">
              <span className="font-extrabold text-purple-600/70">Total SAV</span>
              <span className={cn("text-xl font-black", globalData.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.sav * 100).toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. TOOLBAR LUXE (Filtres, Recherche, Tri) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-20 backdrop-blur-xl bg-white/80">
        
        {/* Barre de recherche animée */}
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {/* Menu de Tri */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
            <div className="px-3 text-xs font-bold text-slate-400 flex items-center gap-1.5"><ArrowUpDown size={14}/> Tri</div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none">
              <option value="bonus-desc">Plus Performant (+)</option>
              <option value="bonus-asc">Moins Performant (-)</option>
              <option value="alpha">Ordre Alphabétique</option>
            </select>
          </div>

          {/* Menu de Filtre */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shrink-0">
            <div className="px-3 text-xs font-bold text-slate-400 flex items-center gap-1.5"><Filter size={14}/> Statut</div>
            {(['ALL', 'POSITIVE', 'NEGATIVE'] as const).map((f) => (
              <button 
                key={f} onClick={() => setFilterBy(f)} 
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5", filterBy === f ? "bg-white shadow-sm border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")}
              >
                {f === 'ALL' && <LayoutGrid size={14} />}
                {f === 'POSITIVE' && <TrendingUp size={14} className="text-emerald-500" />}
                {f === 'NEGATIVE' && <TrendingDown size={14} className="text-rose-500" />}
                {f === 'ALL' ? 'Tous' : f === 'POSITIVE' ? 'Bonus > 0' : 'Bonus < 0'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. LA GRILLE DES PARTENAIRES (ANIMÉE) */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {partnersList.length > 0 ? (
            partnersList.map(([partner, sums]) => (
              <motion.div
                key={partner} layout layoutId={`card-${partner}`} variants={item} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                onClick={() => onPartnerSelect(partner)}
                className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px] relative overflow-hidden"
              >
                {/* Petit effet de couleur sur le côté selon le statut */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", sums.total >= 0 ? "bg-emerald-400" : "bg-rose-400")} />

                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors border border-slate-200/50">
                      <Building2 size={20} />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight w-36 truncate" title={partner}>{partner}</h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white text-slate-400 transition-colors">
                    <ChevronRight size={18} />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Bonus Mensuel</div>
                  <div className={cn("text-4xl font-black tracking-tighter", sums.total >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {sums.total > 0 ? '+' : ''}{(sums.total * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                  <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center border border-slate-100/80">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">RACC</div>
                    <div className={cn("text-sm font-black", sums.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.racc * 100).toFixed(2)}%</div>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center border border-slate-100/80">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">SAV</div>
                    <div className={cn("text-sm font-black", sums.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.sav * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-lg">Aucun partenaire trouvé</p>
              <p className="text-sm">Essayez de modifier vos filtres ou votre recherche.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}