"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IndicatorResult } from "@/types";
import { Activity, Layers, Hash, Target, TrendingUp, AlertTriangle, Star, Frown, MessageSquareWarning, Network, Crop, Zap, PieChart, Calculator, Settings2, Loader2, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBonus } from "@/services/api";

interface IndicatorsTableProps {
  period: string;
  rang1?: Record<string, Record<string, IndicatorResult>>;
  rang2?: Record<string, IndicatorResult>;
  tnh?: IndicatorResult;
  satcliOk?: IndicatorResult;
  satcliNok?: IndicatorResult;
  tauxPlainte?: IndicatorResult;
  incoherencePto?: IndicatorResult;
  cadrage?: IndicatorResult;
  gemNok?: IndicatorResult;
}

export default function IndicatorsTable({ 
  period, rang1, rang2, tnh, satcliOk, satcliNok, tauxPlainte, incoherencePto, cadrage, gemNok 
}: IndicatorsTableProps) {
  
  const [viewMode, setViewMode] = useState<'data' | 'bonus'>('data');

  const [globalConfig, setGlobalConfig] = useState({ bonusMin: "-2", bonusMax: "3", g29: "1", g44: "1", g45: "1", g46: "1" });
  
  const [targets, setTargets] = useState<Record<string, { min: string; max: string; bMin?: string; bMax?: string }>>({
    "PLP-A": { min: "94", max: "99" }, "PLP-B": { min: "92", max: "98" }, "PLP-C": { min: "91", max: "98" },
    "Hotline-A": { min: "86", max: "93" }, "Hotline-B": { min: "79", max: "90" }, "Hotline-C": { min: "78", max: "85" },
    "Construction-A": { min: "79", max: "87" }, "Construction-B": { min: "76", max: "86" }, "Construction-C": { min: "70", max: "80" },
    "RANG2-A": { min: "70", max: "74" }, "RANG2-B": { min: "66", max: "77" }, "RANG2-C": { min: "60", max: "65" },
    "SATCLI_OK": { min: "83", max: "93", bMin: "0", bMax: "4" },
    "SATCLI_NOK": { min: "35", max: "55", bMin: "0", bMax: "1" },
    "PLAINTE": { min: "10", max: "6", bMin: "0", bMax: "2" },
    "GEM_NOK": { min: "80", max: "89", bMin: "-1", bMax: "1" },
    "TNH": { min: "1.5", max: "0.5", bMin: "-2", bMax: "1" },
    "CADRAGE": { min: "2", max: "1", bMin: "-2", bMax: "1" },
    "INCOHERENCE_PTO": { min: "7", max: "9", bMin: "0", bMax: "2" },
  });

  const [bonusResults, setBonusResults] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(2) + "%";

  const totalDenumR1 = useMemo(() => {
    let sum = 0;
    if (rang1) activities.forEach(act => zones.forEach(z => sum += (rang1[act]?.[z]?.denum || 0)));
    return sum;
  }, [rang1]);

  const totalDenumR2 = useMemo(() => {
    let sum = 0;
    if (rang2) zones.forEach(z => sum += (rang2[z]?.denum || 0));
    return sum;
  }, [rang2]);

  const totalBonus = useMemo(() => {
    let sum = 0;
    Object.values(bonusResults).forEach(res => {
      sum += (res?.bonusCalcule ?? res?.bonus_calcule ?? 0);
    });
    return sum;
  }, [bonusResults]);

  useEffect(() => {
    if (viewMode !== 'bonus') return;
    
    const payload = {
      bonusMin: parseFloat(globalConfig.bonusMin) || 0,
      bonusMax: parseFloat(globalConfig.bonusMax) || 0,
      facteurG29: parseFloat(globalConfig.g29) || 1,
      facteurG44: parseFloat(globalConfig.g44) || 1,
      facteurG45: parseFloat(globalConfig.g45) || 1,
      facteurG46: parseFloat(globalConfig.g46) || 1,
      targets: Object.fromEntries(
        Object.entries(targets).map(([key, val]) => [
          key, { 
            pointMin: parseFloat(val.min) || 0, 
            pointMax: parseFloat(val.max) || 0,
            bonusMin: val.bMin != null ? parseFloat(val.bMin) : null,
            bonusMax: val.bMax != null ? parseFloat(val.bMax) : null
          }
        ])
      )
    };

    const handler = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const data = await calculateBonus(period, payload);
        if (data) setBonusResults(data);
      } catch (error) {
        console.error("Erreur API Bonus:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [globalConfig, targets, period, viewMode]);

  const handleTargetChange = (id: string, field: string, value: string) => {
    setTargets(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getScoreStyles = (value: number) => {
    if (value >= 0.8) return { bar: "bg-emerald-400", text: "text-emerald-600", badge: "bg-white border-emerald-300 shadow-sm", dot: "bg-emerald-500" };
    if (value >= 0.5) return { bar: "bg-amber-400", text: "text-amber-600", badge: "bg-white border-amber-300 shadow-sm", dot: "bg-amber-500" };
    return { bar: "bg-rose-400", text: "text-rose-600", badge: "bg-white border-rose-300 shadow-sm", dot: "bg-rose-500" };
  };

  const rowsDefBonus = [
    { id: "PLP-A", cat: "Perf 1er RDV PLP", zone: "Zone A", type: "R1", act: "PLP", z: "A" },
    { id: "PLP-B", cat: "Perf 1er RDV PLP", zone: "Zone B", type: "R1", act: "PLP", z: "B" },
    { id: "PLP-C", cat: "Perf 1er RDV PLP", zone: "Zone C", type: "R1", act: "PLP", z: "C" },
    { id: "Hotline-A", cat: "Perf 1er RDV HOTLINE", zone: "Zone A", type: "R1", act: "Hotline", z: "A" },
    { id: "Hotline-B", cat: "Perf 1er RDV HOTLINE", zone: "Zone B", type: "R1", act: "Hotline", z: "B" },
    { id: "Hotline-C", cat: "Perf 1er RDV HOTLINE", zone: "Zone C", type: "R1", act: "Hotline", z: "C" },
    { id: "Construction-A", cat: "Perf 1er RDV Construction", zone: "Zone A", type: "R1", act: "Construction", z: "A" },
    { id: "Construction-B", cat: "Perf 1er RDV Construction", zone: "Zone B", type: "R1", act: "Construction", z: "B" },
    { id: "Construction-C", cat: "Perf 1er RDV Construction", zone: "Zone C", type: "R1", act: "Construction", z: "C" },
    { id: "RANG2-A", cat: "Perf rang 2 et plus", zone: "Zone A", type: "R2", z: "A" },
    { id: "RANG2-B", cat: "Perf rang 2 et plus", zone: "Zone B", type: "R2", z: "B" },
    { id: "RANG2-C", cat: "Perf rang 2 et plus", zone: "Zone C", type: "R2", z: "C" },
  ];

  const otherRowsDefBonus = [
    { id: "SATCLI_OK", cat: "Satcli (sur RDV OK)", stat: satcliOk },
    { id: "SATCLI_NOK", cat: "Satcli (sur RDV NOK) 4* et 5*", stat: satcliNok },
    { id: "PLAINTE", cat: "Taux de plainte", stat: tauxPlainte },
    { id: "GEM_NOK", cat: "Transformation des GEM en TVC (OK)", stat: gemNok },
    { id: "TNH", cat: "Taux de RDV non honoré", stat: tnh },
    { id: "CADRAGE", cat: "Conformité cadrage PTO / PBO / PM", stat: cadrage },
    { id: "INCOHERENCE_PTO", cat: "Incohérence PTO", stat: incoherencePto }
  ];

  return (
    <div className="w-full bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden relative min-h-[600px]">
      
      {/* Header Luxe */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl shadow-md transition-colors", viewMode === 'data' ? "bg-slate-900 text-white" : "bg-purple-50 border border-purple-100 text-purple-600")}>
            {viewMode === 'data' ? <Database size={24} strokeWidth={2} /> : <Calculator size={24} strokeWidth={2} />}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord Unifié</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", viewMode === 'data' ? "bg-blue-500" : "bg-purple-500")}></span>
              {viewMode === 'data' ? 'Volume et Résultats Bruts' : `Simulation Bonus ${period}`}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-inner">
          <button onClick={() => setViewMode('data')} className={cn("relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2", viewMode === 'data' ? "text-slate-800" : "text-slate-500")}>
            {viewMode === 'data' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50 -z-10" />}
            📊 Données
          </button>
          <button onClick={() => setViewMode('bonus')} className={cn("relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2", viewMode === 'bonus' ? "text-purple-700" : "text-slate-500")}>
            {viewMode === 'bonus' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50 -z-10" />}
            💰 Simulation
          </button>
        </div>

        <AnimatePresence>
          {viewMode === 'bonus' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <Settings2 size={16} className="text-slate-400" />
              <div className="flex gap-4">
                <div className="flex items-center"><span className="text-[11px] font-bold text-slate-600 mr-1">G29:</span><input type="number" step="0.01" value={globalConfig.g29} onChange={(e) => setGlobalConfig(p => ({ ...p, g29: e.target.value }))} className="w-10 bg-transparent border-b border-slate-300 text-center font-bold text-slate-800 focus:outline-none" /></div>
                <div className="flex items-center"><span className="text-[11px] font-bold text-slate-600 mr-1">G44:</span><input type="number" step="0.01" value={globalConfig.g44} onChange={(e) => setGlobalConfig(p => ({ ...p, g44: e.target.value }))} className="w-10 bg-transparent border-b border-slate-300 text-center font-bold text-slate-800 focus:outline-none" /></div>
                <div className="flex items-center"><span className="text-[11px] font-bold text-slate-600 mr-1">G45:</span><input type="number" step="0.01" value={globalConfig.g45} onChange={(e) => setGlobalConfig(p => ({ ...p, g45: e.target.value }))} className="w-10 bg-transparent border-b border-slate-300 text-center font-bold text-slate-800 focus:outline-none" /></div>
                <div className="flex items-center"><span className="text-[11px] font-bold text-slate-600 mr-1">G46:</span><input type="number" step="0.01" value={globalConfig.g46} onChange={(e) => setGlobalConfig(p => ({ ...p, g46: e.target.value }))} className="w-10 bg-transparent border-b border-slate-300 text-center font-bold text-slate-800 focus:outline-none" /></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content Area */}
      <div className="overflow-x-auto relative">

        {/* ======================= MODE DATA ======================= */}
        <div className={viewMode === 'data' ? "block animate-in fade-in duration-500" : "hidden"}>
          <table className="w-full text-sm text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#cbd5e1]/40 border-b border-slate-200">
                <th className="py-4 px-4 font-bold text-slate-500 tracking-widest text-[11px] uppercase w-20 text-center">Niveau</th>
                <th className="py-4 px-8 font-bold text-slate-500 tracking-widest text-[11px] uppercase w-56">Activité / Catégorie</th>
                <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">Zone</th>
                <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">Numérateur</th>
                <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">Dénominateur</th>
                <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center">KPI Final</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              
              {/* RANG 1 */}
              {rang1 && activities.map((activity, actIndex) => {
                return zones.map((zone, zIndex) => {
                  const stats = rang1[activity]?.[zone];
                  if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
                  const percentValue = stats.resultat * 100;
                  const styles = getScoreStyles(stats.resultat);
                  
                  return (
                    <tr key={`R1-data-${activity}-${zone}`} className="hover:bg-slate-50/50 transition-colors">
                      {actIndex === 0 && zIndex === 0 && (
                        <td rowSpan={activities.length * zones.length} className="py-4 px-4 align-middle border-r border-b border-slate-100 bg-[#f4f6f9]">
                          <div className="flex flex-col items-center justify-center gap-5 py-10 px-3 rounded-2xl bg-slate-900 shadow-lg">
                            <Layers size={20} className="text-blue-400" />
                            <span className="font-bold text-sm text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>RANG 1</span>
                          </div>
                        </td>
                      )}
                      {zIndex === 0 && (
                        <td rowSpan={zones.length} className="py-4 px-8 align-middle border-r border-b border-slate-100">
                          <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl shadow-sm bg-white">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">{activity.charAt(0)}</div>
                            <span className="font-bold text-slate-800 text-sm">{activity}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-6 text-center border-r border-b border-slate-100"><span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">Zone {zone}</span></td>
                      <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
                      <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">{stats.denum}</td>
                      <td className="py-4 px-6 border-b border-slate-100">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2", styles.badge, styles.text)}><div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></div>{formatPercent(stats.resultat)}</span>
                          <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1"><div className={cn("h-full rounded-full transition-all duration-1000", styles.bar)} style={{ width: `${percentValue}%` }}></div></div>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}

              {/* RANG 2 */}
              {rang2 && zones.map((zone, zIndex) => {
                const stats = rang2[zone];
                if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
                const percentValue = stats.resultat * 100;
                const styles = getScoreStyles(stats.resultat);

                return (
                  <tr key={`R2-data-${zone}`} className="hover:bg-slate-50/50 transition-colors">
                    {zIndex === 0 && (
                      <td rowSpan={zones.length} className="py-4 px-4 align-middle border-r border-b border-slate-100 bg-[#f4f6f9]">
                        <div className="flex flex-col items-center justify-center gap-5 py-6 px-3 rounded-2xl bg-slate-800 shadow-lg"><span className="font-bold text-sm text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>RANG 2</span></div>
                      </td>
                    )}
                    {zIndex === 0 && (
                      <td rowSpan={zones.length} className="py-4 px-8 align-middle border-r border-b border-slate-100">
                        <div className="flex items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm">Toutes Activités</div>
                      </td>
                    )}
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100"><span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">Zone {zone}</span></td>
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">{stats.denum}</td>
                    <td className="py-4 px-6 border-b border-slate-100">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2", styles.badge, styles.text)}><div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></div>{formatPercent(stats.resultat)}</span>
                        <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1"><div className={cn("h-full rounded-full transition-all duration-1000", styles.bar)} style={{ width: `${percentValue}%` }}></div></div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* AUTRES INDICATEURS DATA */}
              {otherRowsDefBonus.map((row) => {
                const stats = row.stat;
                if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
                const percentValue = stats.resultat * 100;

                return (
                  <tr key={`other-data-${row.id}`} className="hover:bg-slate-50/50 transition-colors bg-[#fbfcfd]">
                    <td className="py-4 px-6 align-middle border-r border-b border-slate-100"><span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span></td>
                    <td className="py-3 px-4 text-center border-r border-b border-slate-100"><span className="font-bold text-slate-500 text-xs">-</span></td>
                    <td className="py-3 px-6 text-center border-r border-b border-slate-100"><span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">Global</span></td>
                    <td className="py-3 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
                    <td className="py-3 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">{stats.denum}</td>
                    <td className="py-3 px-6 border-b border-slate-100">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700 shadow-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>{formatPercent(stats.resultat)}</span>
                        <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1"><div className="h-full rounded-full bg-slate-400 transition-all duration-1000" style={{ width: `${percentValue}%` }}></div></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ======================= MODE BONUS ======================= */}
        <div className={viewMode === 'bonus' ? "block animate-in fade-in duration-500" : "hidden"}>
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase border-r border-purple-100/50 w-64">Indicateurs</th>
                <th className="py-4 px-4 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-24">Zone</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-32">Résultat</th>
                <th className="py-4 px-6 font-bold text-blue-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-28 bg-blue-50/50 flex justify-center gap-1.5 items-center"><PieChart size={12}/> PDM</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-28">Point Min</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-28">Point Max</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-28">Bonus Min</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center border-r border-purple-100/50 w-28">Bonus Max</th>
                <th className="py-4 px-6 font-bold text-purple-800 tracking-widest text-[11px] uppercase text-center bg-purple-100/30">
                  <div className="flex items-center justify-center gap-2">
                    Bonus Indicateur
                    {isCalculating && <Loader2 size={12} className="animate-spin text-purple-600" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              
              {/* Lignes Rang 1 et 2 */}
              {rowsDefBonus.map((row, index) => {
                // FIX: On récupère TOUJOURS les stats locales pour ne pas afficher 0%
                let localStat: IndicatorResult | undefined;
                let pdm = 0;
                if (row.type === "R1") {
                  localStat = rang1?.[row.act]?.[row.z];
                  pdm = totalDenumR1 > 0 ? (localStat?.denum || 0) / totalDenumR1 : 0;
                } else {
                  localStat = rang2?.[row.z];
                  pdm = totalDenumR2 > 0 ? (localStat?.denum || 0) / totalDenumR2 : 0;
                }

                if (!localStat || (localStat.num === 0 && localStat.denum === 0)) return null;

                const resultat = localStat.resultat;
                const bonus = bonusResults[row.id]?.bonusCalcule ?? bonusResults[row.id]?.bonus_calcule ?? 0;

                return (
                  <tr key={`bonus-${row.id}`} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 group">
                    {index % 3 === 0 && (
                      <td rowSpan={3} className="py-4 px-6 align-middle border-r border-slate-100 bg-[#fbfcfd]">
                        <span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-center border-r border-slate-100 bg-white"><span className="font-bold text-slate-500 text-xs">{row.zone}</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white"><span className="font-black text-slate-800 text-[15px]">{formatPercent(resultat)}</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-blue-50/20"><span className="font-bold text-blue-600 text-sm">{formatPercent(pdm)}</span></td>
                    
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-400">
                        <input type="number" step="0.01" value={targets[row.id].min} onChange={(e) => handleTargetChange(row.id, 'min', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm" /><span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-400">
                        <input type="number" step="0.01" value={targets[row.id].max} onChange={(e) => handleTargetChange(row.id, 'max', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm" /><span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>

                    {/* Rowspan Global pour RANG 1 et 2 */}
                    {index === 0 && (
                      <td rowSpan={12} className="py-3 px-6 align-middle border-r border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-center">
                          <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                            <input type="number" step="0.1" value={globalConfig.bonusMin} onChange={(e) => setGlobalConfig(prev => ({ ...prev, bonusMin: e.target.value }))} className="w-10 bg-transparent text-right outline-none font-black text-rose-600 text-base" />
                            <span className="text-rose-400 font-bold text-sm ml-0.5">%</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {index === 0 && (
                      <td rowSpan={12} className="py-3 px-6 align-middle border-r border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-center">
                          <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                            <input type="number" step="0.1" value={globalConfig.bonusMax} onChange={(e) => setGlobalConfig(prev => ({ ...prev, bonusMax: e.target.value }))} className="w-10 bg-transparent text-right outline-none font-black text-emerald-600 text-base" />
                            <span className="text-emerald-400 font-bold text-sm ml-0.5">%</span>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-6 text-center bg-purple-50/20 group-hover:bg-purple-50/40 transition-colors">
                      <div className={cn(
                        "inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-black text-[15px] border shadow-sm w-28",
                        bonus > 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : 
                        bonus < 0 ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {bonus > 0 ? "+" : ""}{formatPercent(bonus)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Lignes pour les autres indicateurs */}
              {otherRowsDefBonus.map((row) => {
                const stat = row.stat;
                if (!stat || (stat.num === 0 && stat.denum === 0)) return null;

                const resultat = stat.resultat;
                const bonus = bonusResults[row.id]?.bonusCalcule ?? bonusResults[row.id]?.bonus_calcule ?? 0;

                return (
                  <tr key={`bonus-other-${row.id}`} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 bg-[#fbfcfd]">
                    <td className="py-4 px-6 align-middle border-r border-slate-100"><span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span></td>
                    <td className="py-3 px-4 text-center border-r border-slate-100"><span className="font-bold text-slate-500 text-xs">-</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100"><span className="font-black text-slate-800 text-[15px]">{formatPercent(resultat)}</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-slate-50/50"><span className="font-bold text-slate-400 text-sm">-</span></td>
                    
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-purple-400 shadow-sm">
                        <input type="number" step="0.01" value={targets[row.id].min} onChange={(e) => handleTargetChange(row.id, 'min', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm" /><span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-purple-400 shadow-sm">
                        <input type="number" step="0.01" value={targets[row.id].max} onChange={(e) => handleTargetChange(row.id, 'max', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm" /><span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-rose-400 shadow-sm">
                        <input type="number" step="0.01" value={targets[row.id].bMin} onChange={(e) => handleTargetChange(row.id, 'bMin', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-rose-600 text-sm" /><span className="text-rose-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus-within:border-emerald-400 shadow-sm">
                        <input type="number" step="0.01" value={targets[row.id].bMax} onChange={(e) => handleTargetChange(row.id, 'bMax', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-emerald-600 text-sm" /><span className="text-emerald-400 font-bold text-xs ml-0.5">%</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-6 text-center bg-purple-50/20 group-hover:bg-purple-50/40 transition-colors">
                      <div className={cn("inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-black text-[15px] border shadow-sm w-28", bonus > 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : bonus < 0 ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                        {bonus > 0 ? "+" : ""}{formatPercent(bonus)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL BONUS FOOTER */}
              <tr className="bg-emerald-100/50 border-t-2 border-emerald-200">
                <td colSpan={8} className="py-5 px-6 text-right font-black text-emerald-900 text-lg uppercase tracking-wide">
                  Total Bonus Indicateur
                </td>
                <td className="py-5 px-6 text-center">
                  <div className={cn("inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-black text-lg shadow-md", totalBonus >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                    {totalBonus > 0 ? "+" : ""}{(totalBonus * 100).toFixed(2)}%
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}