"use client";

import React, { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown } from "lucide-react";
import { fetchReport, uploadRangFile, uploadSatcliFile, uploadPlainteFile } from "@/services/api";

export default function Home() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // Ex: 2026-07
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport(period).then(data => setReportData(data)).catch(() => setReportData(null));
  }, [period]);

  const handleSuccess = (data: any) => {
    setReportData(data);
    setError(null);
  };

  return (
    // L'background wla slate-950 bach ybeyen l'animation 3D w l'glassmorphism
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      
      {/* 3D Background Component */}
      <InteractiveBackground />

      {/* Main Content (Z-10 bach yb9a lfo9 d l'animation 3D) */}
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header Section */}
        <FadeIn delay={0.1} className="flex flex-col items-center justify-center space-y-6 pt-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-white/20">
            <BarChart3 className="text-blue-400" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight text-center drop-shadow-xl">
            ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Partenaire</span>
          </h1>

          {/* Month Picker b Glassmorphism UI */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-white/20">
            <span className="font-bold text-blue-100 text-sm uppercase tracking-wide">Période :</span>
            <input 
              type="month" 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </FadeIn>

        {error && (
          <FadeIn className="max-w-3xl mx-auto p-5 bg-rose-500/20 backdrop-blur-md border border-rose-500/50 rounded-2xl flex items-start gap-3 shadow-lg">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-rose-100">Erreur</h3>
              <p className="text-sm text-rose-200 mt-1">{error}</p>
            </div>
          </FadeIn>
        )}

        {/* Uploads Grid */}
        <SlideUp delay={0.2} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FileUpload 
            title="Import RANG & TNH"
            description="Fichier source (PLP, Constru, Hotline)"
            icon={<FileSpreadsheet size={36} className="text-blue-500" strokeWidth={1.5} />}
            uploadAction={(file) => uploadRangFile(file, period)}
            onUploadSuccess={handleSuccess}
            onUploadError={setError}
          />
          <FileUpload 
            title="Import SATCLI"
            description="Indicateurs OK & NOK"
            icon={<Star size={36} className="text-teal-500" strokeWidth={1.5} />}
            uploadAction={(file) => uploadSatcliFile(file, period)}
            onUploadSuccess={handleSuccess}
            onUploadError={setError}
          />
          <FileUpload 
            title="Import Taux Plainte"
            description="Volume ticket qualité (Nécessite TNH)"
            icon={<Frown size={36} className="text-rose-500" strokeWidth={1.5} />}
            uploadAction={(file) => uploadPlainteFile(file, period)}
            onUploadSuccess={handleSuccess}
            onUploadError={setError}
          />
        </SlideUp>

        {/* Dashboard Unified Section */}
        {reportData && (
          <SlideUp delay={0.1} className="pt-8">
            <IndicatorsTable 
              rang1={reportData.perf_rang1 || reportData.perf_rang_1 || reportData.perfRang1} 
              rang2={reportData.perf_rang2 || reportData.perf_rang_2 || reportData.perfRang2} 
              tnh={reportData.tnh} 
              satcliOk={reportData.satcli_ok || reportData.satcliOk} 
              satcliNok={reportData.satcli_nok || reportData.satcliNok} 
              tauxPlainte={reportData.taux_plainte || reportData.tauxPlainte}
            />
          </SlideUp>
        )}

      </div>
    </main>
  );
}