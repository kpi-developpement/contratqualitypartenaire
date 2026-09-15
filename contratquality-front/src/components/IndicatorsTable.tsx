"use client";

import React from "react";
import { IndicatorResult } from "@/types";
import { Activity, Layers, Hash, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicatorsTableProps {
  rang1?: Record<string, Record<string, IndicatorResult>>;
  rang2?: Record<string, IndicatorResult>;
  tnh?: IndicatorResult;
}

export default function IndicatorsTable({ rang1, rang2, tnh }: IndicatorsTableProps) {
  if (!rang1 && !rang2 && !tnh) return null;

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

  // Styles génériques pour la barre (Vert si >= 80%, etc.)
  const getScoreStyles = (value: number) => {
    if (value >= 0.8) return {
      bar: "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]",
      text: "text-emerald-700",
      badge: "bg-emerald-50 border-emerald-200/60 shadow-emerald-100/50"
    };
    if (value >= 0.5) return {
      bar: "bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]",
      text: "text-amber-700",
      badge: "bg-amber-50 border-amber-200/60 shadow-amber-100/50"
    };
    return {
      bar: "bg-gradient-to-r from-rose-400 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]",
      text: "text-rose-700",
      badge: "bg-rose-50 border-rose-200/60 shadow-rose-100/50"
    };
  };

  // Styles spécifiques pour TNH (Souvent, plus c'est bas mieux c'est. A toi de changer les couleurs si besoin).
  const getTnhStyles = (value: number) => {
    return {
      bar: "bg-gradient-to-r from-indigo-400 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]",
      text: "text-indigo-700",
      badge: "bg-indigo-50 border-indigo-200/60 shadow-indigo-100/50"
    };
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
      
      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="px-8 py-7 border-b border-slate-200/50 bg-white/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10">
            <Activity size={26} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de Bord Unifié</h2>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Indicateurs de Performance & Taux de Non Honoré
            </p>
          </div>
        </div>
      </div>
      
      {/* Table Container */}
      <div className="p-6 md:p-8 relative z-10 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-slate-200/80">
              <th className="pb-5 px-4 font-black text-slate-400 tracking-widest text-xs uppercase w-24 text-center">Niveau</th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase w-48">Activité</th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase text-center w-32">Zone</th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase text-center w-32">
                <div className="flex items-center justify-center gap-1.5"><Hash size={14}/> Num</div>
              </th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase text-center w-32">
                <div className="flex items-center justify-center gap-1.5"><Target size={14}/> Denum</div>
              </th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase text-center">
                <div className="flex items-center justify-center gap-1.5"><TrendingUp size={14}/> KPI Final</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            
            {/* ======================================================== */}
            {/* SECTION RANG 1 */}
            {/* ======================================================== */}
            {rang1 && activities.map((activity, actIndex) => {
              return zones.map((zone, zIndex) => {
                const stats = rang1[activity]?.[zone] || { num: 0, denum: 0, resultat: 0 };
                const percentValue = stats.resultat * 100;
                const styles = getScoreStyles(stats.resultat);
                
                return (
                  <tr key={`R1-${activity}-${zone}`} className="hover:bg-blue-50/30 transition-all duration-200">
                    
                    {/* Colonne Niveau (PERF RANG 1) - Rowspan ultra premium */}
                    {actIndex === 0 && zIndex === 0 && (
                      <td rowSpan={activities.length * zones.length} className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                        <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl shadow-slate-900/10 border border-slate-700/50">
                          <Layers size={24} className="text-blue-400" />
                          <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                            RANG 1
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Colonne Activité */}
                    {zIndex === 0 && (
                      <td rowSpan={zones.length} className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-white">
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white shadow-sm border border-slate-100 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                            {activity.charAt(0)}
                          </div>
                          <span className="font-extrabold text-slate-800 text-[15px]">{activity}</span>
                        </div>
                      </td>
                    )}

                    {/* Stats Zone Rang 1 */}
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white">
                      <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200/60 shadow-sm">
                        Zone {zone}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white">
                      <span className="font-black text-slate-700 text-[15px]">{stats.num}</span>
                    </td>
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white">
                      <span className="font-black text-slate-500 text-[15px]">{stats.denum}</span>
                    </td>
                    <td className="py-5 px-6 bg-white">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>
                          {formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                          <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", styles.bar)} style={{ width: `${percentValue}%` }}>
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}

            {/* ======================================================== */}
            {/* SECTION RANG 2 */}
            {/* ======================================================== */}
            {rang2 && zones.map((zone, zIndex) => {
              const stats = rang2[zone] || { num: 0, denum: 0, resultat: 0 };
              const percentValue = stats.resultat * 100;
              const styles = getScoreStyles(stats.resultat);

              return (
                <tr key={`R2-${zone}`} className="hover:bg-slate-50/50 transition-all duration-200">
                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                      <div className="flex flex-col items-center justify-center gap-6 py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-900 to-indigo-800 shadow-xl shadow-indigo-900/10 border border-indigo-700/50">
                        <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                          RANG 2
                        </span>
                      </div>
                    </td>
                  )}

                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-slate-50/30">
                      <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 bg-white/50 text-slate-500 font-bold">
                        Toutes Activités
                      </div>
                    </td>
                  )}

                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">
                      Zone {zone}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30 font-black text-slate-700 text-[15px]">{stats.num}</td>
                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30 font-black text-slate-500 text-[15px]">{stats.denum}</td>
                  <td className="py-5 px-6 bg-slate-50/30">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>
                          {formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                          <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", styles.bar)} style={{ width: `${percentValue}%` }}>
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                  </td>
                </tr>
              );
            })}

            {/* ======================================================== */}
            {/* SECTION TNH (Taux de Non Honoré) */}
            {/* ======================================================== */}
            {tnh && (
              <tr className="hover:bg-purple-50/30 transition-all duration-200">
                <td className="py-6 px-4 align-middle border-r border-slate-200/80">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-purple-900 to-purple-800 shadow-xl shadow-purple-900/10 border border-purple-700/50">
                    <AlertTriangle size={20} className="text-purple-300" />
                    <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                      TNH
                    </span>
                  </div>
                </td>
                
                <td className="py-6 px-6 align-middle border-r border-slate-200/80 bg-purple-50/10">
                  <div className="flex items-center justify-center p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-purple-700 font-extrabold shadow-sm">
                    Indicateur Global
                  </div>
                </td>

                <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-purple-50/10">
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">
                    Toutes Zones
                  </span>
                </td>
                
                <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-purple-50/10 font-black text-slate-700 text-[15px]">{tnh.num}</td>
                <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-purple-50/10 font-black text-slate-500 text-[15px]">{tnh.denum}</td>
                
                <td className="py-5 px-6 bg-purple-50/10">
                  {(() => {
                    const percentValue = tnh.resultat * 100;
                    const styles = getTnhStyles(tnh.resultat);
                    return (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>
                          {formatPercent(tnh.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                          <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", styles.bar)} style={{ width: `${percentValue}%` }}>
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}