"use client";

import React from "react";
import { IndicatorResult } from "@/types";
import { Activity, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rang1TableProps {
  data?: Record<string, Record<string, IndicatorResult>>;
}

export default function Rang1Table({ data }: Rang1TableProps) {
  if (!data) return null;

  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => (value * 100).toFixed(1) + "%";

  // Fonction pour donner une couleur selon le score
  const getScoreColor = (value: number) => {
    if (value >= 0.8) return "bg-emerald-500";
    if (value >= 0.5) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getScoreText = (value: number) => {
    if (value >= 0.8) return "text-emerald-600";
    if (value >= 0.5) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
      {/* Header du Tableau */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-200">
            <Activity size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">PERF RANG 1</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Répartition détaillée par Activité et par Zone</p>
          </div>
        </div>
      </div>
      
      {/* Corps du Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
            <tr>
              <th className="px-6 py-5 border-r border-slate-100 font-bold tracking-wider">Activité</th>
              {zones.map((zone) => (
                <th key={zone} colSpan={3} className="px-6 py-5 text-center border-r border-slate-100 last:border-0 font-bold tracking-wider">
                  <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-700 shadow-sm">
                    ZONE {zone}
                  </span>
                </th>
              ))}
            </tr>
            <tr className="border-y border-slate-100 bg-white">
              <th className="px-6 py-3 border-r border-slate-100"></th>
              {zones.map((zone) => (
                <React.Fragment key={`sub-${zone}`}>
                  <th className="px-4 py-3 text-center border-r border-slate-100 font-semibold text-slate-400">Num</th>
                  <th className="px-4 py-3 text-center border-r border-slate-100 font-semibold text-slate-400">Denum</th>
                  <th className="px-4 py-3 text-center border-r border-slate-100 font-bold text-slate-600 last:border-0 flex items-center justify-center gap-1">
                    <Percent size={14} /> Résultat
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <tr key={activity} className="hover:bg-blue-50/30 transition-colors group bg-white">
                <td className="px-6 py-6 font-bold text-slate-800 border-r border-slate-100">
                  {activity}
                </td>
                {zones.map((zone) => {
                  const stats = data[activity]?.[zone] || { num: 0, denum: 0, resultat: 0 };
                  const percentValue = stats.resultat * 100;
                  
                  return (
                    <React.Fragment key={`${activity}-${zone}`}>
                      <td className="px-4 py-6 text-center border-r border-slate-100 font-medium text-slate-600">
                        {stats.num}
                      </td>
                      <td className="px-4 py-6 text-center border-r border-slate-100 font-medium text-slate-600">
                        {stats.denum}
                      </td>
                      <td className="px-4 py-6 text-center border-r border-slate-100 last:border-0">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className={cn("font-extrabold text-base", getScoreText(stats.resultat))}>
                            {formatPercent(stats.resultat)}
                          </span>
                          {/* Progress Bar */}
                          <div className="w-full max-w-[80px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-1000 ease-out", getScoreColor(stats.resultat))}
                              style={{ width: `${percentValue}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}