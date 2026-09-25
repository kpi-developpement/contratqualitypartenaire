"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Building2, Search, ArrowUpDown, Filter, TrendingUp, TrendingDown, ChevronRight, LayoutGrid, Import, ChevronDown, Check } from "lucide-react";
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
  
  const [isSortOpen, setIsSortOpen] = useState(false);

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
  
  // Transformer Prime Effect Item
  const item = { 
    hidden: { opacity: 0, y: 30, scale: 0.9 }, 
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } } 
  };

  return (
    <div className="space-y-8">
      
      {/* 1. HERO CARD : PERFORMANCE GLOBALE */}
      {globalData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => onPartnerSelect("GLOBAL")}
          className="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.2)] transition-all duration-500 cursor-pointer group overflow-hidden"
        >
          {/* L'effet de lumière "Mejnoun" derrière la carte Globale */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-full blur-[80px] -z-10 transform translate-x-1/3 -translate-y-1/3 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 ease-out" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 md:p-5 rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-500 border border-slate-700">
                <Globe2 size={40} strokeWidth={2} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Vue Globale</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> Période {period}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right w-full md:w-auto p-5 rounded-3xl bg-white/60 border border-white shadow-sm backdrop-blur-md group-hover:bg-white/80 transition-colors">
              <div className={cn("text-5xl md:text-6xl font-black tracking-tighter drop-shadow-sm", globalData.total >= 0 ? "text-emerald-500" : "text-rose-500")}>
                {globalData.total > 0 ? '+' : ''}{(globalData.total * 100).toFixed(2)}%
              </div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-2">Total Bonus Régional</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 pt-8 border-t border-slate-200/60 relative z-10">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/50 border border-slate-200/60 shadow-sm group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-all duration-500">
              <span className="font-black text-slate-500 text-sm uppercase tracking-wider">Total RACC</span>
              <span className={cn("text-2xl font-black", globalData.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.racc * 100).toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/50 border border-slate-200/60 shadow-sm group-hover:bg-purple-50/50 group-hover:border-purple-100 transition-all duration-500">
              <span className="font-black text-purple-600/70 text-sm uppercase tracking-wider">Total SAV</span>
              <span className={cn("text-2xl font-black", globalData.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(globalData.sav * 100).toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. TOOLBAR LUXE (Custom Dropdown) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2.5 bg-white/90 rounded-2xl border border-slate-200 shadow-sm sticky top-[88px] z-30 backdrop-blur-2xl">
        
        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200/50 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto overflow-visible pb-2 lg:pb-0">
          
          {/* Custom Sort Dropdown */}
          <div className="relative z-40">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-sm font-bold text-slate-700 min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-2 text-slate-500"><ArrowUpDown size={14}/> Tri</span>
              <span>{sortBy === 'bonus-desc' ? 'Plus Performant' : sortBy === 'bonus-asc' ? 'Moins Performant' : 'A - Z'}</span>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", isSortOpen ? "rotate-180" : "")} />
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden flex flex-col"
                >
                  {[
                    { val: 'bonus-desc', label: 'Plus Performant (+)' },
                    { val: 'bonus-asc', label: 'Moins Performant (-)' },
                    { val: 'alpha', label: 'Ordre Alphabétique' }
                  ].map(opt => (
                    <button 
                      key={opt.val} 
                      onClick={() => { setSortBy(opt.val as any); setIsSortOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      {opt.label}
                      {sortBy === opt.val && <Check size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filtres Statut */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shrink-0">
            <div className="px-3 text-xs font-bold text-slate-500 flex items-center gap-1.5 hidden sm:flex"><Filter size={14}/></div>
            {(['ALL', 'POSITIVE', 'NEGATIVE'] as const).map((f) => (
              <button 
                key={f} onClick={() => setFilterBy(f)} 
                className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5", filterBy === f ? "bg-white shadow-sm border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")}
              >
                {f === 'ALL' && <LayoutGrid size={14} />}
                {f === 'POSITIVE' && <TrendingUp size={14} className="text-emerald-500" />}
                {f === 'NEGATIVE' && <TrendingDown size={14} className="text-rose-500" />}
                <span className="hidden md:block">{f === 'ALL' ? 'Tous' : f === 'POSITIVE' ? 'Bonus > 0' : 'Bonus < 0'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. LA GRILLE DES PARTENAIRES "TRANSFORMER PRIME" 🤖 */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {partnersList.length > 0 ? (
            partnersList.map(([partner, sums]) => (
              <motion.div
                key={partner} layout layoutId={`card-${partner}`} variants={item}
                whileHover={{ 
                  scale: 1.03, 
                  y: -8, 
                  boxShadow: sums.total >= 0 ? "0 25px 50px -12px rgba(16, 185, 129, 0.25)" : "0 25px 50px -12px rgba(244, 63, 94, 0.25)",
                  borderColor: sums.total >= 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"
                }}
                onClick={() => onPartnerSelect(partner)}
                className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-6 border border-slate-200 shadow-sm transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[220px] relative overflow-hidden"
              >
                {/* L'effet Glow interne façon "Prime" */}
                <div className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-12 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0",
                  sums.total >= 0 ? "bg-emerald-500" : "bg-rose-500"
                )} />

                <div className="flex justify-between items-start pl-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 border border-slate-200/80 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                      <Building2 size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="font-black text-slate-800 text-[17px] leading-tight w-32 truncate" title={partner}>{partner}</h3>
                  </div>
                  <div className={cn("w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-colors shadow-sm", sums.total >= 0 ? "group-hover:bg-emerald-500 group-hover:text-white" : "group-hover:bg-rose-500 group-hover:text-white")}>
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div className="mt-6 pl-2 relative z-10">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bonus Mensuel</div>
                  <div className={cn("text-4xl font-black tracking-tighter drop-shadow-sm transition-colors duration-300", sums.total >= 0 ? "text-emerald-500 group-hover:text-emerald-600" : "text-rose-500 group-hover:text-rose-600")}>
                    {sums.total > 0 ? '+' : ''}{(sums.total * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100/80 pl-2 relative z-10">
                  <div className="flex-1 bg-white rounded-xl p-2.5 text-center border border-slate-200/60 shadow-sm group-hover:border-slate-300 transition-colors">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">RACC</div>
                    <div className={cn("text-[15px] font-black mt-0.5", sums.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.racc * 100).toFixed(2)}%</div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-2.5 text-center border border-slate-200/60 shadow-sm group-hover:border-slate-300 transition-colors">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">SAV</div>
                    <div className={cn("text-[15px] font-black mt-0.5", sums.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>{(sums.sav * 100).toFixed(2)}%</div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-slate-300 shadow-sm">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                <Import size={40} className="text-slate-400" />
              </div>
              <h3 className="font-black text-3xl text-slate-700 tracking-tight">Aucune donnée trouvée</h3>
              <p className="text-slate-500 font-bold mt-3 max-w-md text-sm">Ouvrez la zone d'importation et injectez vos fichiers (RANG, SATCLI, etc.) pour commencer l'analyse.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}