"use client";

import React, { useState } from "react";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle } from "lucide-react";

export default function Home() {
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallbacks de nommage pour Spring Boot (CamelCase vs SnakeCase)
  const rang1Data = reportData ? (reportData.perf_rang1 || reportData.perf_rang_1 || reportData.perfRang1) : undefined;
  const rang2Data = reportData ? (reportData.perf_rang2 || reportData.perf_rang_2 || reportData.perfRang2) : undefined;
  const tnhData = reportData ? reportData.tnh : undefined;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-slate-200 p-6 md:p-12 font-sans selection:bg-blue-200">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <FadeIn delay={0.1} className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 mb-4">
            <BarChart3 className="text-blue-600" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Partenaire</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
            Analysez vos fichiers d'intervention et générez vos indicateurs de performance en temps réel.
          </p>
        </FadeIn>

        {/* Upload Section */}
        <SlideUp delay={0.2} className="max-w-3xl mx-auto">
          <FileUpload 
            onUploadSuccess={(data) => {
              console.log("JSON reçu :", data);
              setReportData(data);
            }}
            onUploadError={(err) => setError(err)}
            onLoading={(loading) => setIsLoading(loading)}
          />

          {error && (
            <FadeIn className="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-rose-800">Erreur d'analyse</h3>
                <p className="text-sm text-rose-600 mt-1">{error}</p>
              </div>
            </FadeIn>
          )}
        </SlideUp>

        {/* Dashboard Unified Section */}
        {reportData && (rang1Data || rang2Data || tnhData) && (
          <SlideUp delay={0.1} className="pt-8">
            <IndicatorsTable rang1={rang1Data} rang2={rang2Data} tnh={tnhData} />
          </SlideUp>
        )}

      </div>
    </main>
  );
}