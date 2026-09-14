"use client";

import React from "react";
import { ReportResponse } from "@/types";

interface Rang1TableProps {
  data: ReportResponse["perf_rang_1"];
}

export default function Rang1Table({ data }: Rang1TableProps) {
  const activities = ["PLP", "Construction", "Hotline"];
  const zones = ["A", "B", "C"];

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(2) + "%";
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
      <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-slate-800">Indicateur : PERF RANG 1</h2>
      </div>
      
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-4 border-r border-slate-200">Activité</th>
            {zones.map((zone) => (
              <th key={zone} scope="col" colSpan={3} className="px-6 py-4 text-center border-r border-slate-200 last:border-0">
                ZONE {zone}
              </th>
            ))}
          </tr>
          <tr className="bg-slate-50 border-y border-slate-200">
            <th className="px-6 py-2 border-r border-slate-200"></th>
            {zones.map((zone) => (
              <React.Fragment key={`sub-${zone}`}>
                <th className="px-3 py-2 text-center border-r border-slate-200 text-slate-500">Num</th>
                <th className="px-3 py-2 text-center border-r border-slate-200 text-slate-500">Denum</th>
                <th className="px-3 py-2 text-center border-r border-slate-200 font-bold text-blue-600 last:border-0">Résultat</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200">
                {activity}
              </td>
              {zones.map((zone) => {
                const stats = data[activity]?.[zone] || { num: 0, denum: 0, resultat: 0 };
                return (
                  <React.Fragment key={`${activity}-${zone}`}>
                    <td className="px-3 py-4 text-center border-r border-slate-200">{stats.num}</td>
                    <td className="px-3 py-4 text-center border-r border-slate-200">{stats.denum}</td>
                    <td className="px-3 py-4 text-center border-r border-slate-200 font-bold text-emerald-600 last:border-0">
                      {formatPercent(stats.resultat)}
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}