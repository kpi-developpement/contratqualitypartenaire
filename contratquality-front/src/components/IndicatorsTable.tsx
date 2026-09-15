"use client";

import React from "react";
import { IndicatorResult } from "@/types";
import { Activity, Layers, Hash, Target, TrendingUp, AlertTriangle, Star, Frown, MessageSquareWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicatorsTableProps {
  rang1?: Record<string, Record<string, IndicatorResult>>;
  rang2?: Record<string, IndicatorResult>;
  tnh?: IndicatorResult;
  satcliOk?: IndicatorResult;
  satcliNok?: IndicatorResult;
  tauxPlainte?: IndicatorResult;
}

export default function IndicatorsTable({ rang1, rang2, tnh, satcliOk, satcliNok, tauxPlainte }: IndicatorsTableProps) {
  const hasData = rang1 || rang2 || tnh || satcliOk || satcliNok || tauxPlainte;
  
  if (!hasData) return null;

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(2) + "%";

  const getScoreStyles = (value: number) => {
    if (value >= 0.8) return { bar: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200" };
    if (value >= 0.5) return { bar: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]", text: "text-amber-700", badge: "bg-amber-50 border-amber-200" };
    return { bar: "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]", text: "text-rose-700", badge: "bg-rose-50 border-rose-200" };
  };

  const getTnhStyles = () => ({ bar: "bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.5)]", text: "text-purple-700", badge: "bg-purple-50 border-purple-200" });
  const getSatOkStyles = () => ({ bar: "bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.5)]", text: "text-teal-700", badge: "bg-teal-50 border-teal-200" });
  const getSatNokStyles = () => ({ bar: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]", text: "text-orange-700", badge: "bg-orange-50 border-orange-200" });
  const getPlainteStyles = () => ({ bar: "bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.5)]", text: "text-rose-800", badge: "bg-rose-100 border-rose-300" });

  const renderIndicatorRow = (
    title: string, icon: React.ReactNode, label: string, stats: IndicatorResult, styles: any, 
    bgGradient: string, bgRow: string, glowColor: string
  ) => {
    if (!stats || (stats.num === 0 && stats.denum === 0)) return null;
    const percentValue = stats.resultat * 100;

    return (
      <tr className={cn("transition-all duration-200", bgRow)}>
        <td className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
          <div className={cn("flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl shadow-xl border", bgGradient, glowColor)}>
            {icon}
            <span className="font-black text-lg text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
              {title}
            </span>
          </div>
        </td>
        <td className="py-6 px-6 align-middle border-r border-b border-slate-200/80">
          <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 bg-white/50 text-slate-700 font-extrabold shadow-sm">
            {label}
          </div>
        </td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100/80">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Global</span>
        </td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 font-black text-slate-700 text-[15px]">{stats.num}</td>
        <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 font-black text-slate-500 text-[15px]">{stats.denum}</td>
        <td className="py-5 px-6 border-b border-slate-100/80">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
              <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(stats.resultat)}
            </span>
            <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
              <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", styles.bar)} style={{ width: `${percentValue}%` }}>
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20"></div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="px-8 py-7 border-b border-slate-200/50 bg-white/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/10">
            <Activity size={26} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de Bord Unifié</h2>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Indicateurs synchronisés
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 md:p-8 relative z-10 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-slate-200/80">
              <th className="pb-5 px-4 font-black text-slate-400 tracking-widest text-xs uppercase w-24 text-center">Niveau</th>
              <th className="pb-5 px-6 font-black text-slate-400 tracking-widest text-xs uppercase w-48">Activité / Catégorie</th>
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
            
            {/* RANG 1 */}
            {rang1 && activities.map((activity, actIndex) => {
              return zones.map((zone, zIndex) => {
                const stats = rang1[activity]?.[zone];
                if (!stats || (stats.num === 0 && stats.denum === 0)) return null;

                const percentValue = stats.resultat * 100;
                const styles = getScoreStyles(stats.resultat);
                
                return (
                  <tr key={`R1-${activity}-${zone}`} className="hover:bg-blue-50/30 transition-all duration-200">
                    {actIndex === 0 && zIndex === 0 && (
                      <td rowSpan={activities.length * zones.length} className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                        <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl shadow-slate-900/10 border border-slate-700/50">
                          <Layers size={24} className="text-blue-400" />
                          <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>RANG 1</span>
                        </div>
                      </td>
                    )}
                    {zIndex === 0 && (
                      <td rowSpan={zones.length} className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-white">
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white shadow-sm border border-slate-100">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                            {activity.charAt(0)}
                          </div>
                          <span className="font-extrabold text-slate-800 text-[15px]">{activity}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white">
                      <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200/60 shadow-sm">Zone {zone}</span>
                    </td>
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white font-black text-slate-700 text-[15px]">{stats.num}</td>
                    <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-white font-black text-slate-500 text-[15px]">{stats.denum}</td>
                    <td className="py-5 px-6 bg-white">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
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

            {/* RANG 2 */}
            {rang2 && zones.map((zone, zIndex) => {
              const stats = rang2[zone];
              if (!stats || (stats.num === 0 && stats.denum === 0)) return null;

              const percentValue = stats.resultat * 100;
              const styles = getScoreStyles(stats.resultat);

              return (
                <tr key={`R2-${zone}`} className="hover:bg-slate-50/50 transition-all duration-200">
                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                      <div className="flex flex-col items-center justify-center gap-6 py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-900 to-indigo-800 shadow-xl shadow-indigo-900/10 border border-indigo-700/50">
                        <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>RANG 2</span>
                      </div>
                    </td>
                  )}
                  {zIndex === 0 && (
                    <td rowSpan={zones.length} className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-slate-50/30">
                      <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 bg-white/50 text-slate-500 font-bold">Toutes Activités</div>
                    </td>
                  )}
                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Zone {zone}</span>
                  </td>
                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30 font-black text-slate-700 text-[15px]">{stats.num}</td>
                  <td className="py-5 px-6 text-center border-r border-slate-100/80 bg-slate-50/30 font-black text-slate-500 text-[15px]">{stats.denum}</td>
                  <td className="py-5 px-6 bg-slate-50/30">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(stats.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
                          <div className={cn("h-full rounded-full transition-all duration-1000 ease-out relative", styles.bar)} style={{ width: `${percentValue}%` }}>
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-white/20"></div>
                          </div>
                        </div>
                      </div>
                  </td>
                </tr>
              );
            })}

            {/* AUTRES INDICATEURS (TNH, SATCLI, PLAINTE) */}
            {renderIndicatorRow("TNH", <AlertTriangle size={20} className="text-purple-300" />, "Indicateur Global", tnh as IndicatorResult, getTnhStyles(), "bg-gradient-to-b from-purple-900 to-purple-800", "hover:bg-purple-50/30 bg-purple-50/10", "shadow-purple-900/10 border-purple-700/50")}
            {renderIndicatorRow("SAT OK", <Star size={20} className="text-teal-100 fill-teal-100" />, "Satisfaction Validée", satcliOk as IndicatorResult, getSatOkStyles(), "bg-gradient-to-b from-teal-600 to-teal-700", "hover:bg-teal-50/30 bg-teal-50/10", "shadow-teal-900/10 border-teal-500/50")}
            {renderIndicatorRow("SAT NOK", <Frown size={20} className="text-orange-50" />, "Insatisfaction Signalée", satcliNok as IndicatorResult, getSatNokStyles(), "bg-gradient-to-b from-orange-500 to-orange-600", "hover:bg-orange-50/30 bg-orange-50/10", "shadow-orange-900/10 border-orange-400/50")}
            {renderIndicatorRow("PLAINTE", <MessageSquareWarning size={20} className="text-rose-100" />, "Taux de Plainte", tauxPlainte as IndicatorResult, getPlainteStyles(), "bg-gradient-to-b from-rose-700 to-rose-800", "hover:bg-rose-50/30 bg-rose-50/10", "shadow-rose-900/10 border-rose-600/50")}

          </tbody>
        </table>
      </div>
    </div>
  );
}