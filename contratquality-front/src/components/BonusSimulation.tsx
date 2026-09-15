"use client";

import React, { useState, useEffect } from "react";
import { Calculator, Settings2, Loader2, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateBonus } from "@/services/api";

interface BonusSimulationProps {
  period: string;
  hasData: boolean;
}

export default function BonusSimulation({ period, hasData }: BonusSimulationProps) {
  const [globalConfig, setGlobalConfig] = useState({ bonusMin: "-2", bonusMax: "3", g29: "1" });
  const [targets, setTargets] = useState<Record<string, { min: string; max: string }>>({
    "PLP-A": { min: "94", max: "99" }, "PLP-B": { min: "92", max: "98" }, "PLP-C": { min: "91", max: "98" },
    "Hotline-A": { min: "86", max: "93" }, "Hotline-B": { min: "79", max: "90" }, "Hotline-C": { min: "78", max: "85" },
    "Construction-A": { min: "79", max: "87" }, "Construction-B": { min: "76", max: "86" }, "Construction-C": { min: "70", max: "80" },
    "RANG2-A": { min: "70", max: "74" }, "RANG2-B": { min: "66", max: "77" }, "RANG2-C": { min: "60", max: "65" },
  });

  const [results, setResults] = useState<Record<string, any>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const handleTargetChange = (id: string, field: 'min' | 'max', value: string) => {
    setTargets(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  // Appel API automatique (Debounced) à chaque changement de config
  useEffect(() => {
    if (!hasData) return;
    
    const payload = {
      bonusMin: parseFloat(globalConfig.bonusMin) || 0,
      bonusMax: parseFloat(globalConfig.bonusMax) || 0,
      facteurG29: parseFloat(globalConfig.g29) || 1,
      targets: Object.fromEntries(
        Object.entries(targets).map(([key, val]) => [
          key, { pointMin: parseFloat(val.min) || 0, pointMax: parseFloat(val.max) || 0 }
        ])
      )
    };

    const handler = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const data = await calculateBonus(period, payload);
        setResults(data);
      } catch (error) {
        console.error("Erreur API Bonus:", error);
      } finally {
        setIsCalculating(false);
      }
    }, 600); // 600ms debounce bach may-bombardich l'backend

    return () => clearTimeout(handler);
  }, [globalConfig, targets, period, hasData]);

  if (!hasData) return null;

  const rowsDef = [
    { id: "PLP-A", cat: "Perf 1er RDV PLP", zone: "Zone A" }, { id: "PLP-B", cat: "Perf 1er RDV PLP", zone: "Zone B" }, { id: "PLP-C", cat: "Perf 1er RDV PLP", zone: "Zone C" },
    { id: "Hotline-A", cat: "Perf 1er RDV HOTLINE", zone: "Zone A" }, { id: "Hotline-B", cat: "Perf 1er RDV HOTLINE", zone: "Zone B" }, { id: "Hotline-C", cat: "Perf 1er RDV HOTLINE", zone: "Zone C" },
    { id: "Construction-A", cat: "Perf 1er RDV Construction", zone: "Zone A" }, { id: "Construction-B", cat: "Perf 1er RDV Construction", zone: "Zone B" }, { id: "Construction-C", cat: "Perf 1er RDV Construction", zone: "Zone C" },
    { id: "RANG2-A", cat: "Perf rang 2 et plus", zone: "Zone A" }, { id: "RANG2-B", cat: "Perf rang 2 et plus", zone: "Zone B" }, { id: "RANG2-C", cat: "Perf rang 2 et plus", zone: "Zone C" },
  ];

  const formatPercent = (val: number) => (val * 100).toFixed(2) + "%";

  return (
    <div className="w-full bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden mt-12 relative">
      
      {/* Header Luxe */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 shadow-sm border border-purple-100 relative">
            <Calculator size={24} strokeWidth={2} />
            {isCalculating && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span>}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Simulation Bonus {period}
              {isCalculating && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">Calcul synchronisé avec l'API Spring Boot</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Settings2 size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Facteur G29 :</span>
          <input
            type="number" step="0.01"
            value={globalConfig.g29}
            onChange={(e) => setGlobalConfig(prev => ({ ...prev, g29: e.target.value }))}
            className="w-16 bg-transparent border-b border-slate-300 text-center font-bold text-slate-800 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase border-r border-emerald-100/50">Indicateurs</th>
              <th className="py-4 px-4 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-24">Zone</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-32">Résultat</th>
              <th className="py-4 px-6 font-bold text-blue-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-28 bg-blue-50/50 flex justify-center gap-1.5 items-center"><PieChart size={12}/> PDM</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-28">Point Min</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-28">Point Max</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-28">Bonus Min</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center border-r border-emerald-100/50 w-28">Bonus Max</th>
              <th className="py-4 px-6 font-bold text-emerald-800 tracking-widest text-[11px] uppercase text-center bg-emerald-100/30">Bonus Indicateur</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rowsDef.map((row, index) => {
              const res = results[row.id];
              const resultat = res?.resultat || 0;
              const pdm = res?.pdm || 0;
              const bonus = res?.bonusCalcule || 0;

              return (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0 group">
                  
                  {/* Catégorie */}
                  {index % 3 === 0 && (
                    <td rowSpan={3} className="py-4 px-6 align-middle border-r border-slate-100 bg-sky-50/30">
                      <span className="font-extrabold text-slate-700 text-[13px]">{row.cat}</span>
                    </td>
                  )}

                  {/* Zone */}
                  <td className="py-3 px-4 text-center border-r border-slate-100 bg-white">
                    <span className="font-bold text-slate-500 text-xs">{row.zone}</span>
                  </td>

                  {/* Résultat (Backend) */}
                  <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                    <span className="font-black text-slate-800 text-[15px]">{formatPercent(resultat)}</span>
                  </td>

                  {/* PDM (Backend) */}
                  <td className="py-3 px-6 text-center border-r border-slate-100 bg-blue-50/20">
                    <span className="font-bold text-blue-600 text-sm">{formatPercent(pdm)}</span>
                  </td>

                  {/* Point Min (Input) */}
                  <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                    <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all shadow-sm">
                      <input 
                        type="number" step="0.01" 
                        value={targets[row.id].min} 
                        onChange={(e) => handleTargetChange(row.id, 'min', e.target.value)}
                        className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm"
                      />
                      <span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                    </div>
                  </td>

                  {/* Point Max (Input) */}
                  <td className="py-3 px-6 text-center border-r border-slate-100 bg-white">
                    <div className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all shadow-sm">
                      <input 
                        type="number" step="0.01" 
                        value={targets[row.id].max} 
                        onChange={(e) => handleTargetChange(row.id, 'max', e.target.value)}
                        className="w-12 bg-transparent text-right outline-none font-bold text-slate-700 text-sm"
                      />
                      <span className="text-slate-400 font-bold text-xs ml-0.5">%</span>
                    </div>
                  </td>

                  {/* Bonus Min (Global) */}
                  {index === 0 && (
                    <td rowSpan={12} className="py-3 px-6 align-middle border-r border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-rose-500/20">
                          <input 
                            type="number" step="0.1" 
                            value={globalConfig.bonusMin} 
                            onChange={(e) => setGlobalConfig(prev => ({ ...prev, bonusMin: e.target.value }))}
                            className="w-10 bg-transparent text-right outline-none font-black text-rose-600 text-base"
                          />
                          <span className="text-rose-400 font-bold text-sm ml-0.5">%</span>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Bonus Max (Global) */}
                  {index === 0 && (
                    <td rowSpan={12} className="py-3 px-6 align-middle border-r border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20">
                          <input 
                            type="number" step="0.1" 
                            value={globalConfig.bonusMax} 
                            onChange={(e) => setGlobalConfig(prev => ({ ...prev, bonusMax: e.target.value }))}
                            className="w-10 bg-transparent text-right outline-none font-black text-emerald-600 text-base"
                          />
                          <span className="text-emerald-400 font-bold text-sm ml-0.5">%</span>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Bonus Indicateur Final (Backend) */}
                  <td className="py-3 px-6 text-center bg-emerald-50/20 group-hover:bg-emerald-50/40 transition-colors">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}