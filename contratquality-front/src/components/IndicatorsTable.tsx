"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IndicatorResult, ReportResponse } from "@/types";
import { 
  Activity, Layers, Hash, Target, TrendingUp, AlertTriangle, 
  Star, Frown, MessageSquareWarning, Network, Crop, Zap, 
  PieChart, Calculator, Database, TableProperties,
  Wifi, PhoneCall, HardHat, ChevronsUp, ShieldCheck, FileCheck, CheckCircle2, ClipboardCheck, Timer, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBonus } from "@/services/api";

interface IndicatorsTableProps {
  period: string;
  partner: string;
  category: 'RACC' | 'SAV';
  reportData: ReportResponse;
}

export default function IndicatorsTable({ period, partner, category, reportData }: IndicatorsTableProps) {
  
  const [viewMode, setViewMode] = useState<'data' | 'bonus'>('data');
  const [filterMode, setFilterMode] = useState<'ALL' | 'R1' | 'R2' | 'AUTRES'>('ALL');

  const rang1 = reportData?.perf_rang1 || reportData?.perf_rang_1 || reportData?.perfRang1;
  const rang2 = reportData?.perf_rang2 || reportData?.perf_rang_2 || reportData?.perfRang2;
  const tnh = reportData?.tnh;
  const satcliOk = reportData?.satcli_ok || reportData?.satcliOk;
  const satcliNok = reportData?.satcli_nok || reportData?.satcliNok;
  const tauxPlainte = reportData?.taux_plainte || reportData?.tauxPlainte;
  const incoherencePto = reportData?.incoherence_pto || reportData?.incoherencePto;
  const cadrage = reportData?.cadrage;
  const gemNok = reportData?.gem_nok || reportData?.gemNok;

  const savSatcli = reportData?.sav_satcli || reportData?.savSatcli;
  const savSecurisation = reportData?.sav_securisation || reportData?.savSecurisation;
  const savTnh = reportData?.sav_tnh || reportData?.savTnh;
  const savCcr = reportData?.sav_ccr || reportData?.savCcr;
  const savPerf = reportData?.sav_perf || reportData?.savPerf;
  const audit = reportData?.audit;
  const ree = reportData?.ree;

  const [targets, setTargets] = useState<Record<string, { min: string; max: string; bMin?: string; bMax?: string }>>({
    // RACC
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

    // SAV
    "SAV_PERF": { min: "81", max: "88", bMin: "-2", bMax: "2" },
    "SAV_SECURISATION": { min: "3", max: "0", bMin: "-2", bMax: "2" },
    "AUDIT": { min: "2", max: "0", bMin: "-1", bMax: "1" },
    "SAV_SATCLI": { min: "10", max: "0", bMin: "-2", bMax: "2" },
    "SAV_CCR": { min: "2", max: "1", bMin: "-3", bMax: "3" },
    "REE": { min: "7", max: "2", bMin: "-2", bMax: "2" },
    "SAV_TNH": { min: "5", max: "2", bMin: "-2", bMax: "1" },
  });

  const [bonusResults, setBonusResults] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const formatPercent = (value: number) => (value * 100).toFixed(2) + "%";
  const formatPercentOrRaw = (id: string, value: number) => {
    if (id === 'REE' || id === 'AUDIT') return value.toFixed(4);
    return (value * 100).toFixed(2) + "%";
  };

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

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
    Object.values(bonusResults).forEach((res: any) => {
      if (category === 'RACC' && !res.indicatorId.startsWith('SAV_') && res.indicatorId !== 'AUDIT' && res.indicatorId !== 'REE') {
        sum += (res?.bonusCalcule ?? res?.bonus_calcule ?? 0);
      }
      if (category === 'SAV' && (res.indicatorId.startsWith('SAV_') || res.indicatorId === 'AUDIT' || res.indicatorId === 'REE')) {
        sum += (res?.bonusCalcule ?? res?.bonus_calcule ?? 0);
      }
    });
    return sum;
  }, [bonusResults, category]);

  useEffect(() => {
    if (viewMode !== 'bonus') return;
    const payload = {
      bonusMin: -2, bonusMax: 3, facteurG29: 1, facteurG44: 1, facteurG45: 1, facteurG46: 1,
      targets: Object.fromEntries(
        Object.entries(targets).map(([key, val]) => [
          key, { pointMin: parseFloat(val.min) || 0, pointMax: parseFloat(val.max) || 0, bonusMin: val.bMin != null ? parseFloat(val.bMin) : null, bonusMax: val.bMax != null ? parseFloat(val.bMax) : null }
        ])
      )
    };

    const handler = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const data = await calculateBonus(period, partner, payload);
        if (data) setBonusResults(data);
      } catch (error) { console.error("Erreur API Bonus:", error); } 
      finally { setIsCalculating(false); }
    }, 500);

    return () => clearTimeout(handler);
  }, [targets, period, partner, viewMode, category]);

  const handleTargetChange = (id: string, field: string, value: string) => {
    setTargets(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getScoreStyles = (value: number) => {
    if (value >= 0.8) return { bar: "bg-emerald-400", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" };
    if (value >= 0.5) return { bar: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-50 border-amber-200", dot: "bg-amber-500" };
    return { bar: "bg-rose-400", text: "text-rose-700", badge: "bg-rose-50 border-rose-200", dot: "bg-rose-500" };
  };

  const rowsDefRaccR1R2 = [
    { id: "PLP-A", cat: "Perf 1er RDV PLP", zone: "Zone A", type: "R1", act: "PLP", z: "A", icon: <Wifi size={14} className="text-blue-500" /> },
    { id: "PLP-B", cat: "Perf 1er RDV PLP", zone: "Zone B", type: "R1", act: "PLP", z: "B", icon: <Wifi size={14} className="text-blue-500" /> },
    { id: "PLP-C", cat: "Perf 1er RDV PLP", zone: "Zone C", type: "R1", act: "PLP", z: "C", icon: <Wifi size={14} className="text-blue-500" /> },
    { id: "Hotline-A", cat: "Perf 1er RDV HOTLINE", zone: "Zone A", type: "R1", act: "Hotline", z: "A", icon: <PhoneCall size={14} className="text-blue-500" /> },
    { id: "Hotline-B", cat: "Perf 1er RDV HOTLINE", zone: "Zone B", type: "R1", act: "Hotline", z: "B", icon: <PhoneCall size={14} className="text-blue-500" /> },
    { id: "Hotline-C", cat: "Perf 1er RDV HOTLINE", zone: "Zone C", type: "R1", act: "Hotline", z: "C", icon: <PhoneCall size={14} className="text-blue-500" /> },
    { id: "Construction-A", cat: "Perf 1er RDV Construction", zone: "Zone A", type: "R1", act: "Construction", z: "A", icon: <HardHat size={14} className="text-blue-500" /> },
    { id: "Construction-B", cat: "Perf 1er RDV Construction", zone: "Zone B", type: "R1", act: "Construction", z: "B", icon: <HardHat size={14} className="text-blue-500" /> },
    { id: "Construction-C", cat: "Perf 1er RDV Construction", zone: "Zone C", type: "R1", act: "Construction", z: "C", icon: <HardHat size={14} className="text-blue-500" /> },
    { id: "RANG2-A", cat: "Perf rang 2 et plus", zone: "Zone A", type: "R2", z: "A", icon: <ChevronsUp size={14} className="text-indigo-500" /> },
    { id: "RANG2-B", cat: "Perf rang 2 et plus", zone: "Zone B", type: "R2", z: "B", icon: <ChevronsUp size={14} className="text-indigo-500" /> },
    { id: "RANG2-C", cat: "Perf rang 2 et plus", zone: "Zone C", type: "R2", z: "C", icon: <ChevronsUp size={14} className="text-indigo-500" /> },
  ];

  const rowsDefRaccAutres = [
    { id: "SATCLI_OK", cat: "Satcli (sur RDV OK)", stat: satcliOk, icon: <Star size={20} className="text-teal-400 fill-teal-400/20" />, colorClass: "bg-teal-500", isRaw: false },
    { id: "SATCLI_NOK", cat: "Satcli (sur RDV NOK)", stat: satcliNok, icon: <Frown size={20} className="text-orange-400" />, colorClass: "bg-orange-500", isRaw: false },
    { id: "PLAINTE", cat: "Taux de plainte", stat: tauxPlainte, icon: <MessageSquareWarning size={20} className="text-rose-400" />, colorClass: "bg-rose-500", isRaw: false },
    { id: "GEM_NOK", cat: "Transf. des GEM en TVC", stat: gemNok, icon: <Zap size={20} className="text-cyan-400" />, colorClass: "bg-cyan-500", isRaw: false },
    { id: "TNH", cat: "Taux de RDV non honoré", stat: tnh, icon: <AlertTriangle size={20} className="text-purple-400" />, colorClass: "bg-purple-500", isRaw: false },
    { id: "CADRAGE", cat: "Conformité Cadrage", stat: cadrage, icon: <Crop size={20} className="text-indigo-400" />, colorClass: "bg-indigo-500", isRaw: false },
    { id: "INCOHERENCE_PTO", cat: "Incohérence PTO", stat: incoherencePto, icon: <Network size={20} className="text-pink-400" />, colorClass: "bg-pink-500", isRaw: false },
  ];

  const rowsDefSav = [
    { id: "SAV_PERF", cat: "Taux de CR OK", stat: savPerf, icon: <CheckCircle2 size={20} className="text-emerald-400" />, colorClass: "bg-emerald-500", isRaw: false },
    { id: "SAV_SECURISATION", cat: "Sécurisation de RDV", stat: savSecurisation, icon: <ShieldCheck size={20} className="text-blue-400" />, colorClass: "bg-blue-500", isRaw: false },
    { id: "AUDIT", cat: "Délai de traitement audit", stat: audit, icon: <ClipboardCheck size={20} className="text-fuchsia-400" />, colorClass: "bg-fuchsia-500", isRaw: true },
    { id: "SAV_SATCLI", cat: "Clients très insatisfait", stat: savSatcli, icon: <Star size={20} className="text-teal-400 fill-teal-400/20" />, colorClass: "bg-teal-500", isRaw: false },
    { id: "SAV_CCR", cat: "Conformité CR", stat: savCcr, icon: <FileCheck size={20} className="text-amber-400" />, colorClass: "bg-amber-500", isRaw: false },
    { id: "REE", cat: "Délai traitement remises en état", stat: ree, icon: <Timer size={20} className="text-indigo-400" />, colorClass: "bg-indigo-500", isRaw: true },
    { id: "SAV_TNH", cat: "Taux de RDV non honoré", stat: savTnh, icon: <AlertTriangle size={20} className="text-purple-400" />, colorClass: "bg-purple-500", isRaw: false }
  ];

  return (
    <div className="w-full bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-200/80 overflow-hidden relative min-h-[600px]">
      <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn("p-3.5 rounded-2xl shadow-sm border transition-colors", viewMode === 'data' ? "bg-slate-900 border-slate-800 text-white" : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100 text-purple-600")}>
            {viewMode === 'data' ? <Database size={24} strokeWidth={2} /> : <Calculator size={24} strokeWidth={2} />}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord Unifié - {category}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", viewMode === 'data' ? "bg-blue-500" : "bg-purple-500")}></span>
              {viewMode === 'data' ? `Résultats Bruts - ${partner}` : `Simulation Bonus - Période ${period}`}
            </p>
          </div>
        </div>

        {category === 'RACC' && (
          <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200/60 shadow-inner">
            {['ALL', 'R1', 'R2', 'AUTRES'].map((f) => (
              <button key={f} onClick={() => setFilterMode(f as any)} className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300", filterMode === f ? "bg-white text-blue-700 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700")}>
                {f === 'ALL' ? 'Tous' : f === 'R1' ? 'Rang 1' : f === 'R2' ? 'Rang 2' : 'Autres KPI'}
              </button>
            ))}
          </div>
        )}

        <div className="flex p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-inner">
          <button onClick={() => setViewMode('data')} className={cn("relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2", viewMode === 'data' ? "text-slate-800" : "text-slate-500 hover:text-slate-700")}>
            {viewMode === 'data' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50 -z-10" />}
            <TableProperties size={16} /> Données Brutes
          </button>
          <button onClick={() => setViewMode('bonus')} className={cn("relative px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 z-10 flex items-center gap-2", viewMode === 'bonus' ? "text-purple-700" : "text-slate-500 hover:text-slate-700")}>
            {viewMode === 'bonus' && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-200/50 -z-10" />}
            <Activity size={16} /> Simulation Bonus
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto relative">
        <div className={cn("transition-opacity duration-300", viewMode === 'data' ? "opacity-100 block" : "opacity-0 hidden")}>
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200/80">
                <th className="py-4 px-6 font-black text-slate-400 tracking-widest text-[11px] uppercase w-28 text-center border-r border-slate-100">Niveau</th>
                <th className="py-4 px-8 font-black text-slate-400 tracking-widest text-[11px] uppercase w-64 border-r border-slate-100">Activité / Catégorie</th>
                <th className="py-4 px-6 font-black text-slate-400 tracking-widest text-[11px] uppercase text-center w-32 border-r border-slate-100">Zone</th>
                <th className="py-4 px-6 font-black text-slate-400 tracking-widest text-[11px] uppercase text-center w-32 border-r border-slate-100"><div className="flex items-center justify-center gap-1.5"><Hash size={14}/> Num</div></th>
                <th className="py-4 px-6 font-black text-slate-400 tracking-widest text-[11px] uppercase text-center w-32 border-r border-slate-100"><div className="flex items-center justify-center gap-1.5"><Target size={14}/> Denum</div></th>
                <th className="py-4 px-6 font-black text-slate-400 tracking-widest text-[11px] uppercase text-center"><div className="flex items-center justify-center gap-1.5"><TrendingUp size={14}/> KPI Final</div></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              
              {category === 'RACC' && (filterMode === 'ALL' || filterMode === 'R1' || filterMode === 'R2') && rowsDefRaccR1R2.map((row, index) => {
                if (filterMode === 'R1' && row.type !== 'R1') return null;
                if (filterMode === 'R2' && row.type !== 'R2') return null;

                let stats: IndicatorResult | undefined;
                if (row.type === 'R1') stats = rang1?.[row.act]?.[row.z];
                else stats = rang2?.[row.z];

                if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
                const percentValue = stats.resultat * 100;
                const styles = getScoreStyles(stats.resultat);
                
                return (
                  <tr key={`data-${row.id}`} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/50">
                    {index % 3 === 0 && (
                      <td rowSpan={3} className="py-4 px-4 align-middle border-r border-slate-100 bg-[#f4f6f9]">
                        <div className="flex flex-col items-center justify-center gap-5 py-8 px-3 rounded-2xl bg-slate-900 shadow-md">
                          <Layers size={20} className="text-blue-400" />
                          <span className="font-black text-xs text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>{row.type === 'R1' ? 'RANG 1' : 'RANG 2'}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-8 align-middle border-r border-slate-100 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">{row.icon}</div>
                        <span className="font-extrabold text-slate-800 text-[13px]">{row.cat}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center border-r border-slate-100"><span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold text-xs border border-slate-200/60 shadow-sm">Zone {row.zone.replace('Zone ', '')}</span></td>
                    <td className="py-4 px-6 text-center border-r border-slate-100 font-black text-slate-800 text-[15px]">{stats.num}</td>
                    <td className="py-4 px-6 text-center border-r border-slate-100 font-black text-slate-500 text-[15px]">{stats.denum}</td>
                    <td className="py-4 px-6 border-b border-slate-100">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="px-4 py-1 rounded-full text-xs font-bold border flex items-center gap-2 bg-slate-100 border-slate-200 text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>{formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[140px] bg-slate-100 rounded-full h-2 overflow-hidden mt-1"><div className="h-full rounded-full transition-all duration-1000 bg-slate-400" style={{ width: `${stats.resultat * 100}%` }}></div></div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(category === 'RACC' ? (filterMode === 'ALL' || filterMode === 'AUTRES') ? rowsDefRaccAutres : [] : rowsDefSav).map((row) => {
                const stats = row.stat;
                if (!stats || (stats.num === 0 && stats.denum === 0)) return null;

                return (
                  <tr key={`other-data-${row.id}`} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/50 bg-white">
                    <td className="py-4 px-4 align-middle border-r border-slate-100 bg-[#f4f6f9]">
                      <div className="flex flex-col items-center justify-center gap-4 py-6 px-3 rounded-2xl bg-slate-900 shadow-md">
                        {row.icon}
                        <span className="font-black text-[10px] text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>{row.id.replace('SAV_', '').replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8 align-middle border-r border-slate-100">
                      <span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100"><span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-slate-50 text-slate-400 font-bold text-xs border border-slate-200/60">Global</span></td>
                    
                    {row.isRaw ? (
                      <>
                        <td className="py-3 px-6 text-center border-r border-slate-100 font-black text-slate-400 text-[15px]">-</td>
                        <td className="py-3 px-6 text-center border-r border-slate-100 font-black text-slate-500 text-[15px]">Total: {stats.denum}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-6 text-center border-r border-slate-100 font-black text-slate-800 text-[15px]">{stats.num}</td>
                        <td className="py-3 px-6 text-center border-r border-slate-100 font-black text-slate-500 text-[15px]">{stats.denum}</td>
                      </>
                    )}
                    
                    <td className="py-3 px-6">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className={cn("px-4 py-1 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm", row.colorClass.replace('bg-', 'bg-opacity-10 border-').replace('500', '200'), row.colorClass.replace('bg-', 'text-').replace('500', '700'))}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", row.colorClass)}></div>{formatPercentOrRaw(row.id, stats.resultat)}
                        </span>
                        {!row.isRaw && <div className="w-full max-w-[140px] bg-slate-100 rounded-full h-2 overflow-hidden mt-1"><div className={cn("h-full rounded-full transition-all duration-1000", row.colorClass)} style={{ width: `${stats.resultat * 100}%` }}></div></div>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={cn("transition-opacity duration-300", viewMode === 'bonus' ? "opacity-100 block" : "opacity-0 hidden")}>
          <table className="w-full text-sm text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border-b border-purple-100/80">
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase border-r border-purple-100/50 w-56">Indicateurs</th>
                <th className="py-4 px-4 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-24">Zone</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-28">Résultat</th>
                <th className="py-4 px-6 font-black text-blue-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-24 bg-blue-50/40 flex justify-center gap-1.5 items-center"><PieChart size={12}/> PDM</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-28">Point Min</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-28">Point Max</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-28">Bonus Min</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center border-r border-purple-100/50 w-28">Bonus Max</th>
                <th className="py-4 px-6 font-black text-purple-800 tracking-widest text-[10px] uppercase text-center bg-purple-100/40">
                  <div className="flex items-center justify-center gap-2">Bonus Ind. {isCalculating && <Loader2 size={12} className="animate-spin text-purple-600" />}</div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              
              {category === 'RACC' && (filterMode === 'ALL' || filterMode === 'R1' || filterMode === 'R2') && rowsDefRaccR1R2.map((row, index) => {
                if (filterMode === 'R1' && row.type !== 'R1') return null;
                if (filterMode === 'R2' && row.type !== 'R2') return null;

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
                  <tr key={`bonus-${row.id}`} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100/60 group">
                    {index % 3 === 0 && (
                      <td rowSpan={3} className="py-4 px-6 align-middle border-r border-slate-100 bg-[#fbfcfd]">
                        <span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span>
                      </td>
                    )}
                    <td className="py-3 px-4 text-center border-r border-slate-100 bg-white">
                      <div className="flex items-center justify-center gap-2">
                        {row.icon}
                        <span className="font-bold text-slate-600 text-[11px]">{row.zone.replace('Zone ', '')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white"><span className="font-black text-slate-800 text-[14px]">{formatPercent(resultat)}</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-blue-50/10"><span className="font-bold text-blue-600 text-xs">{formatPercent(pdm)}</span></td>
                    
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-400 transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id].min} onChange={(e) => handleTargetChange(row.id, 'min', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-[13px]" /><span className="text-slate-400 font-bold text-[10px] ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                      <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-400 transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id].max} onChange={(e) => handleTargetChange(row.id, 'max', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-[13px]" /><span className="text-slate-400 font-bold text-[10px] ml-0.5">%</span>
                      </div>
                    </td>

                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-slate-50/40"><span className="font-bold text-slate-400 text-xs">-2%</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-slate-50/40"><span className="font-bold text-slate-400 text-xs">3%</span></td>

                    <td className="py-3 px-6 text-center bg-emerald-50/20 group-hover:bg-emerald-50/40 transition-colors">
                      <div className={cn(
                        "inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-black text-[14px] border shadow-sm w-24",
                        bonus > 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : 
                        bonus < 0 ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {bonus > 0 ? "+" : ""}{formatPercent(bonus)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(category === 'RACC' ? (filterMode === 'ALL' || filterMode === 'AUTRES') ? rowsDefRaccAutres : [] : rowsDefSav).map((row) => {
                const stat = row.stat;
                if (!stat || (stat.num === 0 && stat.denum === 0)) return null;

                const resultat = stat.resultat;
                const bonus = bonusResults[row.id]?.bonusCalcule ?? bonusResults[row.id]?.bonus_calcule ?? 0;

                return (
                  <tr key={`bonus-other-${row.id}`} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100/60 bg-[#fbfcfd]">
                    <td className="py-4 px-6 align-middle border-r border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-lg border shadow-sm", row.colorClass.replace('bg-', 'bg-opacity-10 border-').replace('500', '200'))}>{row.icon}</div>
                        <span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center border-r border-slate-100"><span className="font-bold text-slate-400 text-xs">-</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100"><span className="font-black text-slate-800 text-[14px]">{formatPercentOrRaw(row.id, resultat)}</span></td>
                    <td className="py-3 px-6 text-center border-r border-slate-100 bg-slate-50/30"><span className="font-bold text-slate-300 text-xs">-</span></td>
                    
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:border-purple-400 shadow-sm transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id]?.min || "0"} onChange={(e) => handleTargetChange(row.id, 'min', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-[13px]" /><span className="text-slate-400 font-bold text-[10px] ml-0.5">{row.isRaw ? '' : '%'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:border-purple-400 shadow-sm transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id]?.max || "0"} onChange={(e) => handleTargetChange(row.id, 'max', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-[13px]" /><span className="text-slate-400 font-bold text-[10px] ml-0.5">{row.isRaw ? '' : '%'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:border-rose-400 shadow-sm transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id]?.bMin || "0"} onChange={(e) => handleTargetChange(row.id, 'bMin', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-rose-600 text-[13px]" /><span className="text-rose-400 font-bold text-[10px] ml-0.5">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center border-r border-slate-100">
                      <div className="inline-flex items-center justify-center bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:border-emerald-400 shadow-sm transition-all hover:border-slate-300">
                        <input type="number" step="0.01" value={targets[row.id]?.bMax || "0"} onChange={(e) => handleTargetChange(row.id, 'bMax', e.target.value)} className="w-12 bg-transparent text-right outline-none font-bold text-emerald-600 text-[13px]" /><span className="text-emerald-400 font-bold text-[10px] ml-0.5">%</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-6 text-center bg-purple-50/20 group-hover:bg-purple-50/40 transition-colors">
                      <div className={cn("inline-flex items-center justify-center px-4 py-1.5 rounded-lg font-black text-[14px] border shadow-sm w-24", bonus > 0 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : bonus < 0 ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                        {bonus > 0 ? "+" : ""}{formatPercent(bonus)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-emerald-50 border-t-2 border-emerald-200/80">
                <td colSpan={8} className="py-6 px-6 text-right font-black text-emerald-900 text-[16px] uppercase tracking-wider">
                  Total Bonus {category}
                </td>
                <td className="py-6 px-6 text-center">
                  <div className={cn("inline-flex items-center justify-center px-6 py-3 rounded-xl font-black text-[18px] shadow-lg border-2", totalBonus >= 0 ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-500 text-white border-rose-400")}>
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