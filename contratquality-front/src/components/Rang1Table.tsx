"use client";

import React from "react";
import { IndicatorResult } from "@/types";
import { Activity, Percent, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rang1TableProps {
  data?: Record<string, Record<string, IndicatorResult>>;
}

export default function Rang1Table({ data }: Rang1TableProps) {
  if (!data) return null;

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

  // Couleurs l'barre de progression
  const getScoreColor = (value: number) => {
    if (value >= 0.8) return "bg-emerald-500";
    if (value >= 0.5) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Couleurs l'badge
  const getScoreBadge = (value: number) => {
    if (value >= 0.8) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (value >= 0.5) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden">
      {/* Header du Tableau */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-200">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Détails des Performances</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Vue hiérarchique : Rang › Activité › Zone</p>
          </div>
        </div>
      </div>
      
      {/* Corps du Tableau */}
      <div className="p-6 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <thead className="text-xs text-slate-600 uppercase bg-slate-100">
            <tr>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-r border-slate-200 w-24 text-center">Indicateur</th>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-r border-slate-200 w-48">Activité</th>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-r border-slate-200 w-32 text-center">Zone</th>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-r border-slate-200 text-center w-32">Numérateur</th>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-r border-slate-200 text-center w-32">Dénominateur</th>
              <th className="px-6 py-4 font-extrabold tracking-wider border-b border-slate-200 text-center">Résultat</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {activities.map((activity, actIndex) => {
              return zones.map((zone, zIndex) => {
                const stats = data[activity]?.[zone] || { num: 0, denum: 0, resultat: 0 };
                const percentValue = stats.resultat * 100;
                
                return (
                  <tr key={`${activity}-${zone}`} className="hover:bg-blue-50/40 transition-colors group">
                    
                    {/* Colonne Indicateur (PERF RANG 1) - Affichée mra w7da b rowspan=9 */}
                    {actIndex === 0 && zIndex === 0 && (
                      <td 
                        rowSpan={activities.length * zones.length} 
                        className="p-4 border-r border-b border-slate-200 bg-slate-50/50 align-middle"
                      >
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full shadow-sm">
                            <Layers size={20} />
                          </div>
                          {/* Text vertical l'design nadi */}
                          <span 
                            className="font-black text-lg text-slate-800 tracking-[0.2em] rotate-180 whitespace-nowrap" 
                            style={{ writingMode: 'vertical-rl' }}
                          >
                            PERF RANG 1
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Colonne Activité (PLP, etc.) - Affichée lkol activité b rowspan=3 */}
                    {zIndex === 0 && (
                      <td 
                        rowSpan={zones.length} 
                        className="px-6 py-4 border-r border-b border-slate-200 align-middle bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></div>
                          <span className="font-extrabold text-slate-700 text-base tracking-tight">{activity}</span>
                        </div>
                      </td>
                    )}

                    {/* Colonne Zone */}
                    <td className="px-6 py-4 border-r border-b border-slate-100 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                        Zone {zone}
                      </span>
                    </td>

                    {/* Colonnes Statistiques */}
                    <td className="px-6 py-4 text-center border-r border-b border-slate-100 font-bold text-slate-700 text-base">
                      {stats.num}
                    </td>
                    <td className="px-6 py-4 text-center border-r border-b border-slate-100 font-bold text-slate-700 text-base">
                      {stats.denum}
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100 text-center">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <span className={cn("px-4 py-1 rounded-full text-sm font-extrabold border shadow-sm", getScoreBadge(stats.resultat))}>
                          {formatPercent(stats.resultat)}
                        </span>
                        {/* Progress Bar stylisée */}
                        <div className="w-full max-w-[140px] bg-slate-100/80 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/50">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", getScoreColor(stats.resultat))}
                            style={{ width: `${percentValue}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}