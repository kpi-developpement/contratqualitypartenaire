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

  // 2 ar9am mn mor lfassila kima bghiti
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

            {/* TNH */}
            {tnh && tnh.denum > 0 && (
              <tr className="hover:bg-purple-50/30 transition-all duration-200">
                <td className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-purple-900 to-purple-800 shadow-xl shadow-purple-900/10 border border-purple-700/50">
                    <AlertTriangle size={20} className="text-purple-300" />
                    <span className="font-black text-lg text-white tracking-[0.3em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>TNH</span>
                  </div>
                </td>
                <td className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-purple-50/10">
                  <div className="flex items-center justify-center p-4 rounded-xl border border-purple-200 bg-purple-50/50 text-purple-700 font-extrabold shadow-sm">Indicateur Global</div>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-purple-50/10">
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Toutes Zones</span>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-purple-50/10 font-black text-slate-700 text-[15px]">{tnh.num}</td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-purple-50/10 font-black text-slate-500 text-[15px]">{tnh.denum}</td>
                <td className="py-5 px-6 border-b border-slate-100/80 bg-purple-50/10">
                  {(() => {
                    const percentValue = tnh.resultat * 100;
                    const styles = getTnhStyles();
                    return (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(tnh.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
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

            {/* SATCLI OK */}
            {satcliOk && satcliOk.denum > 0 && (
              <tr className="hover:bg-teal-50/30 transition-all duration-200">
                <td className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-teal-600 to-teal-700 shadow-xl shadow-teal-900/10 border border-teal-500/50">
                    <Star size={20} className="text-teal-100 fill-teal-100" />
                    <span className="font-black text-lg text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>SAT OK</span>
                  </div>
                </td>
                <td className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-teal-50/10">
                  <div className="flex items-center justify-center p-4 rounded-xl border border-teal-200 bg-teal-50/50 text-teal-700 font-extrabold shadow-sm">Satisfaction Validée</div>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-teal-50/10">
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Toutes Zones</span>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-teal-50/10 font-black text-slate-700 text-[15px]">{satcliOk.num}</td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-teal-50/10 font-black text-slate-500 text-[15px]">{satcliOk.denum}</td>
                <td className="py-5 px-6 border-b border-slate-100/80 bg-teal-50/10">
                  {(() => {
                    const percentValue = satcliOk.resultat * 100;
                    const styles = getSatOkStyles();
                    return (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(satcliOk.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
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

            {/* SATCLI NOK */}
            {satcliNok && satcliNok.denum > 0 && (
              <tr className="hover:bg-orange-50/30 transition-all duration-200">
                <td className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-orange-500 to-orange-600 shadow-xl shadow-orange-900/10 border border-orange-400/50">
                    <Frown size={20} className="text-orange-50" />
                    <span className="font-black text-lg text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>SAT NOK</span>
                  </div>
                </td>
                <td className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-orange-50/10">
                  <div className="flex items-center justify-center p-4 rounded-xl border border-orange-200 bg-orange-50/50 text-orange-700 font-extrabold shadow-sm">Insatisfaction Signalée</div>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-orange-50/10">
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Toutes Zones</span>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-orange-50/10 font-black text-slate-700 text-[15px]">{satcliNok.num}</td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-orange-50/10 font-black text-slate-500 text-[15px]">{satcliNok.denum}</td>
                <td className="py-5 px-6 border-b border-slate-100/80 bg-orange-50/10">
                  {(() => {
                    const percentValue = satcliNok.resultat * 100;
                    const styles = getSatNokStyles();
                    return (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(satcliNok.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
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

            {/* TAUX DE PLAINTE */}
            {tauxPlainte && tauxPlainte.denum > 0 && (
              <tr className="hover:bg-rose-50/30 transition-all duration-200">
                <td className="py-6 px-4 align-middle border-r border-b border-slate-200/80">
                  <div className="flex flex-col items-center justify-center gap-4 py-6 px-4 rounded-2xl bg-gradient-to-b from-rose-700 to-rose-800 shadow-xl shadow-rose-900/10 border border-rose-600/50">
                    <MessageSquareWarning size={20} className="text-rose-100" />
                    <span className="font-black text-lg text-white tracking-[0.2em] rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>PLAINTE</span>
                  </div>
                </td>
                <td className="py-6 px-6 align-middle border-r border-b border-slate-200/80 bg-rose-50/10">
                  <div className="flex items-center justify-center p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 font-extrabold shadow-sm">Taux de Plainte</div>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-rose-50/10">
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-sm">Toutes Zones</span>
                </td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-rose-50/10 font-black text-slate-700 text-[15px]">{tauxPlainte.num}</td>
                <td className="py-5 px-6 text-center border-r border-b border-slate-100/80 bg-rose-50/10 font-black text-slate-500 text-[15px]">{tauxPlainte.denum}</td>
                <td className="py-5 px-6 border-b border-slate-100/80 bg-rose-50/10">
                  {(() => {
                    const percentValue = tauxPlainte.resultat * 100;
                    const styles = getPlainteStyles();
                    return (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className={cn("px-4 py-1.5 rounded-full text-sm font-black border shadow-sm flex items-center gap-1.5", styles.badge, styles.text)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", styles.bar.split(' ')[0])}></div>{formatPercent(tauxPlainte.resultat)}
                        </span>
                        <div className="w-full max-w-[160px] bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner relative">
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