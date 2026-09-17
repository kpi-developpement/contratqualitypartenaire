"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown, Network, Crop, Zap, Wrench } from "lucide-react";
import { fetchReport, uploadRangFile, uploadSatcliFile, uploadPlainteFile, uploadPtoFile, uploadCadrageFile, uploadGemNokFile, uploadSavFile } from "@/services/api";
import { cn } from "@/lib/utils";

export default function Home() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // TOGGLE CATEGORY RACC vs SAV
  const [category, setCategory] = useState<'RACC' | 'SAV'>('RACC');

  useEffect(() => {
    fetchReport(period).then(data => setReportData(data)).catch(() => setReportData(null));
  }, [period]);

  const handleSuccess = (data: any) => {
    setReportData(data);
    setError(null);
  };

  const hasData = !!reportData && Object.keys(reportData).length > 0;

  return (
    <main className="min-h-screen relative font-sans selection:bg-blue-100 bg-transparent">
      
      <InteractiveBackground />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10 p-6 md:p-12">
        <FadeIn delay={0.1} className="flex flex-col items-center justify-center space-y-6 pt-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <BarChart3 className="text-blue-600" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight text-center">
            ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Partenaire</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200/80">
              <span className="font-bold text-slate-500 text-sm uppercase tracking-wide">Période :</span>
              <input 
                type="month" 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Toggle Category RACC / SAV (iOS Style) */}
            <div className="flex p-1 bg-white rounded-full border border-slate-200 shadow-sm">
              <button 
                onClick={() => setCategory('RACC')} 
                className={cn("relative px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 z-10", category === 'RACC' ? "text-white" : "text-slate-500 hover:text-slate-800")}
              >
                {category === 'RACC' && <motion.div layoutId="catTab" className="absolute inset-0 bg-slate-900 rounded-full shadow-md -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                RACC
              </button>
              <button 
                onClick={() => setCategory('SAV')} 
                className={cn("relative px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 z-10", category === 'SAV' ? "text-white" : "text-slate-500 hover:text-slate-800")}
              >
                {category === 'SAV' && <motion.div layoutId="catTab" className="absolute inset-0 bg-slate-900 rounded-full shadow-md -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                SAV
              </button>
            </div>
          </div>
        </FadeIn>

        {error && (
          <FadeIn className="max-w-3xl mx-auto p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-rose-800">Erreur</h3>
              <p className="text-sm text-rose-600 mt-1">{error}</p>
            </div>
          </FadeIn>
        )}

        {/* Uploads Grid - Switchable RACC / SAV */}
        <div className="min-h-[250px]">
          <AnimatePresence mode="wait">
            {category === 'RACC' ? (
              <motion.div key="racc-uploads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FileUpload title="Import RANG & TNH" description="Fichier source (PLP, Constru, Hotline)" icon={<FileSpreadsheet size={32} className="text-blue-600" strokeWidth={1.5} />} uploadAction={(file) => uploadRangFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                <FileUpload title="Import SATCLI" description="Indicateurs OK & NOK" icon={<Star size={32} className="text-teal-600" strokeWidth={1.5} />} uploadAction={(file) => uploadSatcliFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                <FileUpload title="Import Taux Plainte" description="Volume ticket qualité" icon={<Frown size={32} className="text-rose-600" strokeWidth={1.5} />} uploadAction={(file) => uploadPlainteFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                <FileUpload title="Import PTO" description="Incohérence PTO" icon={<Network size={32} className="text-pink-600" strokeWidth={1.5} />} uploadAction={(file) => uploadPtoFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                <FileUpload title="Import Cadrage" description="Analyse des MAL_CADREE" icon={<Crop size={32} className="text-indigo-600" strokeWidth={1.5} />} uploadAction={(file) => uploadCadrageFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                <FileUpload title="Import GEM NOK" description="Analyse TVC et Flg Gem" icon={<Zap size={32} className="text-cyan-600" strokeWidth={1.5} />} uploadAction={(file) => uploadGemNokFile(file, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
              </motion.div>
            ) : (
              <motion.div key="sav-uploads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-center max-w-lg mx-auto">
                <FileUpload 
                  title="Import Fichier SAV" 
                  description="Fichier source unique (SATCLI, TNH, SECU, PERF, CCR)" 
                  icon={<Wrench size={32} className="text-purple-600" strokeWidth={1.5} />} 
                  uploadAction={(file) => uploadSavFile(file, period)} 
                  onUploadSuccess={handleSuccess} 
                  onUploadError={setError} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasData && (
          <SlideUp delay={0.1} className="pt-8">
            {/* L'FIX HNA: Kan-passi category w reportData l'Component */}
            <IndicatorsTable 
              period={period}
              category={category}
              reportData={reportData}
            />
          </SlideUp>
        )}

      </div>
    </main>
  );
}