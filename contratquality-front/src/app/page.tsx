"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import PartnerOverview from "@/components/PartnerOverview";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown, Network, Crop, Zap, Wrench, ClipboardCheck, Timer, Trash2, Loader2, ArrowLeft, DatabaseZap } from "lucide-react";
import { fetchReport, deleteReport, uploadRangFile, uploadSatcliFile, uploadPlainteFile, uploadPtoFile, uploadCadrageFile, uploadGemNokFile, uploadSavFile, uploadAuditFile, uploadReeFile, calculateAllBonuses } from "@/services/api";
import { cn } from "@/lib/utils";

export const DEFAULT_TARGETS = {
  "PLP-A": { min: "94", max: "99" }, "PLP-B": { min: "92", max: "98" }, "PLP-C": { min: "91", max: "98" },
  "Hotline-A": { min: "86", max: "93" }, "Hotline-B": { min: "79", max: "90" }, "Hotline-C": { min: "78", max: "85" },
  "Construction-A": { min: "79", max: "87" }, "Construction-B": { min: "76", max: "86" }, "Construction-C": { min: "70", max: "80" },
  "RANG2-A": { min: "70", max: "74" }, "RANG2-B": { min: "66", max: "77" }, "RANG2-C": { min: "60", max: "65" },
  "SATCLI_OK": { min: "83", max: "93", bMin: "0", bMax: "4" }, "SATCLI_NOK": { min: "35", max: "55", bMin: "0", bMax: "1" },
  "PLAINTE": { min: "10", max: "6", bMin: "0", bMax: "2" }, "GEM_NOK": { min: "80", max: "89", bMin: "-1", bMax: "1" },
  "TNH": { min: "1.5", max: "0.5", bMin: "-2", bMax: "1" }, "CADRAGE": { min: "2", max: "1", bMin: "-2", bMax: "1" }, "INCOHERENCE_PTO": { min: "7", max: "9", bMin: "0", bMax: "2" },
  "SAV_PERF": { min: "81", max: "88", bMin: "-2", bMax: "2" }, "SAV_SECURISATION": { min: "3", max: "0", bMin: "-2", bMax: "2" },
  "AUDIT": { min: "2", max: "0", bMin: "-1", bMax: "1" }, "SAV_SATCLI": { min: "10", max: "0", bMin: "-2", bMax: "2" },
  "SAV_CCR": { min: "2", max: "1", bMin: "-3", bMax: "3" }, "REE": { min: "7", max: "2", bMin: "-2", bMax: "2" }, "SAV_TNH": { min: "5", max: "2", bMin: "-2", bMax: "1" },
};

export default function Home() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [allReports, setAllReports] = useState<ReportResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUploads, setShowUploads] = useState(true); // Toggle pour cacher/montrer les uploads
  const [uploadCategory, setUploadCategory] = useState<'RACC' | 'SAV'>('RACC');
  
  const [viewState, setViewState] = useState<'OVERVIEW' | 'DETAIL'>('OVERVIEW');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [overviewBonuses, setOverviewBonuses] = useState<Record<string, { racc: number, sav: number, total: number }>>({});
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

  const [targets, setTargets] = useState(DEFAULT_TARGETS);

  const fetchAndCalculate = async (p: string) => {
    try {
      const data = await fetchReport(p);
      setAllReports(data);
      if (data.length > 0) {
        setShowUploads(false); // Cache automatiquement les uploads si on a de la data (Design Luxe)
        setIsLoadingBonuses(true);
        const payload = {
          bonusMin: -2, bonusMax: 3, facteurG29: 1, facteurG44: 1, facteurG45: 1, facteurG46: 1,
          targets: Object.fromEntries(Object.entries(targets).map(([key, val]) => [key, { pointMin: parseFloat(val.min) || 0, pointMax: parseFloat(val.max) || 0, bonusMin: val.bMin != null ? parseFloat(val.bMin) : null, bonusMax: val.bMax != null ? parseFloat(val.bMax) : null }]))
        };
        const bonusData = await calculateAllBonuses(p, payload);
        
        const sums: Record<string, { racc: number, sav: number, total: number }> = {};
        for (const [partner, indicators] of Object.entries(bonusData)) {
          let racc = 0; let sav = 0;
          Object.values(indicators as any).forEach((ind: any) => {
            if (ind.indicatorId.startsWith('SAV_') || ind.indicatorId === 'AUDIT' || ind.indicatorId === 'REE') sav += (ind.bonusCalcule || ind.bonus_calcule || 0);
            else racc += (ind.bonusCalcule || ind.bonus_calcule || 0);
          });
          sums[partner] = { racc, sav, total: racc + sav };
        }
        setOverviewBonuses(sums);
      } else {
        setOverviewBonuses({});
        setShowUploads(true); // Affiche les uploads si vide
      }
    } catch (e) {
      console.error(e);
      setAllReports([]);
      setOverviewBonuses({});
    } finally {
      setIsLoadingBonuses(false);
    }
  };

  useEffect(() => { fetchAndCalculate(period); }, [period, targets]);

  const handleSuccess = () => fetchAndCalculate(period);

  const handleDeletePeriod = async () => {
    if (confirm(`⚠️ ATTENTION ⚠️\nSupprimer TOUTES les données pour la période ${period} ?`)) {
      setIsDeleting(true);
      try {
        await deleteReport(period);
        setAllReports([]);
        setOverviewBonuses({});
        setViewState('OVERVIEW');
        setShowUploads(true);
        setError(null);
      } catch (err: any) { setError(err.message); } 
      finally { setIsDeleting(false); }
    }
  };

  const handlePartnerClick = (partner: string) => {
    setSelectedPartner(partner);
    setViewState('DETAIL');
  };

  const currentReport = selectedPartner ? (allReports.find(r => (r.partenaire || 'GLOBAL') === selectedPartner) || null) : null;
  const hasData = allReports.length > 0;

  return (
    <main className="min-h-screen relative font-sans selection:bg-blue-100 bg-transparent pb-20">
      <InteractiveBackground />
      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 p-4 md:p-8 lg:p-12">
        
        {/* TOP NAVBAR LUXE */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 shadow-sm sticky top-4 z-50">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewState('OVERVIEW')}>
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-md">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">
              ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Partenaire</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex items-center gap-3 bg-slate-100/80 px-5 py-2.5 rounded-full shadow-inner border border-slate-200/50 shrink-0">
              <span className="font-bold text-slate-500 text-xs uppercase tracking-wider">Période</span>
              <input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setViewState('OVERVIEW'); }} className="bg-transparent text-slate-800 font-black focus:outline-none cursor-pointer text-sm" />
            </div>

            <button 
              onClick={() => setShowUploads(!showUploads)} 
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 shadow-sm", showUploads ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50")}
            >
              <DatabaseZap size={16} /> Imports & Fichiers
            </button>

            <button onClick={handleDeletePeriod} disabled={isDeleting || !hasData} className="p-2.5 bg-white rounded-full border border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50 shrink-0">
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </FadeIn>

        {error && (
          <FadeIn className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} /><div><h3 className="text-sm font-bold text-rose-800">Erreur</h3><p className="text-sm text-rose-600 mt-1">{error}</p></div>
          </FadeIn>
        )}

        {/* UPLOADS DRAWER */}
        <AnimatePresence>
          {showUploads && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800">Zone d'Importation</h3>
                  <div className="flex p-1 bg-white rounded-full border border-slate-200 shadow-sm">
                    <button onClick={() => setUploadCategory('RACC')} className={cn("relative px-6 py-1.5 rounded-full text-xs font-bold transition-all z-10", uploadCategory === 'RACC' ? "text-white" : "text-slate-500")}>
                      {uploadCategory === 'RACC' && <motion.div layoutId="upTab" className="absolute inset-0 bg-blue-600 rounded-full -z-10" />} RACC
                    </button>
                    <button onClick={() => setUploadCategory('SAV')} className={cn("relative px-6 py-1.5 rounded-full text-xs font-bold transition-all z-10", uploadCategory === 'SAV' ? "text-white" : "text-slate-500")}>
                      {uploadCategory === 'SAV' && <motion.div layoutId="upTab" className="absolute inset-0 bg-purple-600 rounded-full -z-10" />} SAV
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {uploadCategory === 'RACC' ? (
                    <motion.div key="racc" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <FileUpload title="RANG" description="Source Principale" icon={<FileSpreadsheet size={24} className="text-blue-600" />} uploadAction={(f) => uploadRangFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="SATCLI" description="OK & NOK" icon={<Star size={24} className="text-teal-600" />} uploadAction={(f) => uploadSatcliFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="Plainte" description="Taux & Volume" icon={<Frown size={24} className="text-rose-600" />} uploadAction={(f) => uploadPlainteFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="PTO" description="Incohérence PTO" icon={<Network size={24} className="text-pink-600" />} uploadAction={(f) => uploadPtoFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="Cadrage" description="MAL_CADREE" icon={<Crop size={24} className="text-indigo-600" />} uploadAction={(f) => uploadCadrageFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="GEM NOK" description="TVC et Flg" icon={<Zap size={24} className="text-cyan-600" />} uploadAction={(f) => uploadGemNokFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                    </motion.div>
                  ) : (
                    <motion.div key="sav" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FileUpload title="Fichier SAV" description="SATCLI, TNH, SECU..." icon={<Wrench size={24} className="text-purple-600" />} uploadAction={(f) => uploadSavFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="AUDIT" description="90e Centile" icon={<ClipboardCheck size={24} className="text-fuchsia-600" />} uploadAction={(f) => uploadAuditFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="REE" description="90e Centile" icon={<Timer size={24} className="text-emerald-600" />} uploadAction={(f) => uploadReeFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OVERVIEW COMPONENT */}
        {hasData && viewState === 'OVERVIEW' && (
          <SlideUp delay={0.1}>
            <PartnerOverview 
              period={period} 
              overviewBonuses={overviewBonuses} 
              onPartnerSelect={handlePartnerClick} 
            />
          </SlideUp>
        )}

        {/* DETAILS TABLEAU */}
        {hasData && viewState === 'DETAIL' && currentReport && (
          <SlideUp delay={0.1}>
            <button onClick={() => setViewState('OVERVIEW')} className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all hover:-translate-x-1 group">
              <ArrowLeft size={18} className="group-hover:text-blue-600 transition-colors" /> Retour au Dashboard
            </button>
            <IndicatorsTable 
              period={period}
              partner={selectedPartner!}
              category="RACC"
              reportData={currentReport}
              targets={targets}
              setTargets={setTargets}
            />
          </SlideUp>
        )}

      </div>
    </main>
  );
}