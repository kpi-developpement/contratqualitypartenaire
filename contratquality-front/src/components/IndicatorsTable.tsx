"use client";

import React, { useMemo } from "react";
import { IndicatorResult } from "@/types";
import { Activity, Layers, Hash, Target, TrendingUp, AlertTriangle, Star, Frown, MessageSquareWarning, Network, Crop, Zap, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicatorsTableProps {
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

export default function IndicatorsTable({ rang1, rang2, tnh, satcliOk, satcliNok, tauxPlainte, incoherencePto, cadrage, gemNok }: IndicatorsTableProps) {
  const hasData = rang1 || rang2 || tnh || satcliOk || satcliNok || tauxPlainte || incoherencePto || cadrage || gemNok;
  
  // Calcul dynamique des totaux Denum pour les Parts de Marché (PDM)
  const totalDenumRang1 = useMemo(() => {
    let total = 0;
    if (rang1) {
      Object.values(rang1).forEach(zones => {
        Object.values(zones).forEach(stats => {
          total += stats?.denum || 0;
        });
      });
    }
    return total;
  }, [rang1]);

  const totalDenumRang2 = useMemo(() => {
    let total = 0;
    if (rang2) {
      Object.values(rang2).forEach(stats => {
        total += stats?.denum || 0;
      });
    }
    return total;
  }, [rang2]);

  if (!hasData) return null;

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(2) + "%";
  const formatPdm = (value: number) => (value * 100).toFixed(1) + "%";

  const getScoreStyles = (value: number) => {
    if (value >= 0.8) return { bar: "bg-emerald-400", text: "text-emerald-600", badge: "bg-white border-emerald-300 shadow-sm", dot: "bg-emerald-500" };
    if (value >= 0.5) return { bar: "bg-amber-400", text: "text-amber-600", badge: "bg-white border-amber-300 shadow-sm", dot: "bg-amber-500" };
    return { bar: "bg-rose-400", text: "text-rose-600", badge: "bg-white border-rose-300 shadow-sm", dot: "bg-rose-500" };
  };

  const getTnhStyles = () => ({ bar: "bg-purple-400", text: "text-purple-600", badge: "bg-white border-purple-300 shadow-sm", dot: "bg-purple-500" });
  const getSatOkStyles = () => ({ bar: "bg-teal-400", text: "text-teal-600", badge: "bg-white border-teal-300 shadow-sm", dot: "bg-teal-500" });
  const getSatNokStyles = () => ({ bar: "bg-orange-400", text: "text-orange-600", badge: "bg-white border-orange-300 shadow-sm", dot: "bg-orange-500" });
  const getPlainteStyles = () => ({ bar: "bg-rose-500", text: "text-rose-700", badge: "bg-white border-rose-300 shadow-sm", dot: "bg-rose-600" });
  const getPtoStyles = () => ({ bar: "bg-pink-400", text: "text-pink-600", badge: "bg-white border-pink-300 shadow-sm", dot: "bg-pink-500" });
  const getCadrageStyles = () => ({ bar: "bg-indigo-400", text: "text-indigo-600", badge: "bg-white border-indigo-300 shadow-sm", dot: "bg-indigo-500" });
  const getGemNokStyles = () => ({ bar: "bg-cyan-400", text: "text-cyan-600", badge: "bg-white border-cyan-300 shadow-sm", dot: "bg-cyan-500" });

  const renderIndicatorRow = (
    title: string, icon: React.ReactNode, label: string, letter: string, stats: IndicatorResult, styles: any
  ) => {
    if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
    const percentValue = stats.resultat * 100;

    return (
      <tr className="bg-white hover:bg-slate-50/50 transition-colors">
        <td className="py-6 px-4 align-middle border-r border-b border-slate-100 bg-[#f4f6f9]">
          <div className="flex flex-col items-center justify-center gap-4 py-8 px-4 rounded-xl bg-slate-800 shadow-md">
            {icon}
            <span className="font-bold text-sm text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
              {title}
            </span>
          </div>
        </td>
        <td className="py-6 px-8 align-middle border-r border-b border-slate-100">
          <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl shadow-sm bg-white">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
              {letter}
            </div>
            <span className="font-bold text-slate-800 text-sm">{label}</span>
          </div>
        </td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100">
          <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">Global</span>
        </td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">
          <div className="flex flex-col items-center justify-center">
            <span>{stats.denum}</span>
          </div>
        </td>
        <td className="py-5 px-6 border-b border-slate-100">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2", styles.badge, styles.text)}>
              <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></div>{formatPercent(stats.resultat)}
            </span>
            <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
              <div className={cn("h-full rounded-full transition-all duration-1000", styles.bar)} style={{ width: `${percentValue}%` }}></div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden">
      
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center gap-4">
        <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-md">
          <Activity size={24} strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord Unifié</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Indicateurs synchronisés
          </p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#cbd5e1]/40 border-b border-slate-200">
              <th className="py-4 px-4 font-bold text-slate-500 tracking-widest text-[11px] uppercase w-20 text-center">Niveau</th>
              <th className="py-4 px-8 font-bold text-slate-500 tracking-widest text-[11px] uppercase w-56">Activité / Catégorie</th>
              <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">Zone</th>
              <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">
                <div className="flex items-center justify-center gap-1"><Hash size={12}/> Num</div>
              </th>
              <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center w-32">
                <div className="flex items-center justify-center gap-1"><Target size={12}/> Vol (Denum)</div>
              </th>
              <th className="py-4 px-6 font-bold text-slate-500 tracking-widest text-[11px] uppercase text-center">
                <div className="flex items-center justify-center gap-1"><TrendingUp size={12}/> KPI Final</div>
              </th>
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
                const pdm = totalDenumRang1 > 0 ? stats.denum / totalDenumRang1 : 0;
                
                return (
                  <tr key={`R1-${activity}-${zone}`} className="hover:bg-slate-50/50 transition-colors">
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
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                            {activity.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{activity}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100">
                      <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">
                        Zone {zone}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
                    <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span>{stats.denum}</span>
                        {/* PDM Badge Luxe */}
                        {stats.denum > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-md">
                            <PieChart size={10} className="text-blue-500" />
                            {formatPdm(pdm)} PDM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 border-b border-slate-100">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></div>{formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                          <div className={cn("h-full rounded-full transition-all duration-1000", styles.bar)} style={{ width: `${percentValue}%` }}></div>
                        </div>
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
              const pdm = totalDenumRang2 > 0 ? stats.denum / totalDenumRang2 : 0;

              return (
                <tr key={`R2-${zone}`} className="hover:bg-slate-50/50 transition-colors">
                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-4 px-4 align-middle border-r border-b border-slate-100 bg-[#f4f6f9]">
                      <div className="flex flex-col items-center justify-center gap-5 py-6 px-3 rounded-2xl bg-slate-800 shadow-lg">
                        <span className="font-bold text-sm text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>RANG 2</span>
                      </div>
                    </td>
                  )}
                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-4 px-8 align-middle border-r border-b border-slate-100">
                      <div className="flex items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm">
                        Toutes Activités
                      </div>
                    </td>
                  )}
                  <td className="py-4 px-6 text-center border-r border-b border-slate-100">
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 shadow-sm">Zone {zone}</span>
                  </td>
                  <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-700 text-sm">{stats.num}</td>
                  <td className="py-4 px-6 text-center border-r border-b border-slate-100 font-black text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span>{stats.denum}</span>
                      {/* PDM Badge Luxe */}
                      {stats.denum > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md">
                          <PieChart size={10} className="text-indigo-500" />
                          {formatPdm(pdm)} PDM
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 border-b border-slate-100">
                     <div className="flex flex-col items-center justify-center gap-2">
                        <span className={cn("px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)}></div>{formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[140px] bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                          <div className={cn("h-full rounded-full transition-all duration-1000", styles.bar)} style={{ width: `${percentValue}%` }}></div>
                        </div>
                      </div>
                  </td>
                </tr>
              );
            })}

            {/* AUTRES INDICATEURS */}
            {renderIndicatorRow("TNH", <AlertTriangle size={18} className="text-purple-300" />, "Indicateur Global", "T", tnh as IndicatorResult, getTnhStyles())}
            {renderIndicatorRow("SAT OK", <Star size={18} className="text-teal-300" />, "Satisfaction Validée", "S", satcliOk as IndicatorResult, getSatOkStyles())}
            {renderIndicatorRow("SAT NOK", <Frown size={18} className="text-orange-300" />, "Insatisfaction Signalée", "N", satcliNok as IndicatorResult, getSatNokStyles())}
            {renderIndicatorRow("PLAINTE", <MessageSquareWarning size={18} className="text-rose-300" />, "Taux de Plainte", "P", tauxPlainte as IndicatorResult, getPlainteStyles())}
            {renderIndicatorRow("PTO", <Network size={18} className="text-pink-300" />, "Incohérence PTO", "I", incoherencePto as IndicatorResult, getPtoStyles())}
            {renderIndicatorRow("CADRAGE", <Crop size={18} className="text-indigo-300" />, "Analyse MAL_CADREE", "C", cadrage as IndicatorResult, getCadrageStyles())}
            {renderIndicatorRow("GEM NOK", <Zap size={18} className="text-cyan-300" />, "Analyse GEM NOK", "G", gemNok as IndicatorResult, getGemNokStyles())}

          </tbody>
        </table>
      </div>
    </div>
  );
}