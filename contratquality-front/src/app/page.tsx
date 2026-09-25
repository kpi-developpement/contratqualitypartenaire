"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import PartnerOverview from "@/components/PartnerOverview";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown, Network, Crop, Zap, Wrench, ClipboardCheck, Timer, Trash2, Loader2, ArrowLeft, DatabaseZap, ChevronDown, Check, X } from "lucide-react";
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
  const [showUploads, setShowUploads] = useState(true); 
  const [uploadCategory, setUploadCategory] = useState<'RACC' | 'SAV'>('RACC');
  
  const [viewState, setViewState] = useState<'OVERVIEW' | 'DETAIL'>('OVERVIEW');
  const [selectedPartner, setSelectedPartner] = useState<string>("GLOBAL");
  
  // Custom Dropdown State
  const [isPartnerDropdownOpen, setIsPartnerDropdownOpen] = useState(false);

  const [overviewBonuses, setOverviewBonuses] = useState<Record<string, { racc: number, sav: number, total: number }>>({});
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

  const [targets, setTargets] = useState(DEFAULT_TARGETS);

  const fetchAndCalculate = async (p: string) => {
    try {
      const data = await fetchReport(p);
      setAllReports(data);
      if (data.length > 0) {
        // FIX : ON NE FERME PLUS L'UPLOAD AUTOMATIQUEMENT
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
        setShowUploads(true);
      }
    } catch (e) {
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
    setIsPartnerDropdownOpen(false);
  };

  const currentReport = allReports.find(r => (r.partenaire || 'GLOBAL') === selectedPartner) || allReports.find(r => !r.partenaire || r.partenaire === 'GLOBAL') || null;
  const hasData = allReports.length > 0;

  const uniquePartners = ["GLOBAL", ...allReports.filter(r => (r.partenaire || 'GLOBAL') !== 'GLOBAL').map(r => r.partenaire!)];

  return (
    <main className="min-h-screen relative font-sans selection:bg-blue-100 bg-transparent pb-20">
      <InteractiveBackground />
      <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 p-4 md:p-8 lg:p-12">
        
        {/* TOP NAVBAR LUXE */}
        <FadeIn delay={0.1} className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur-2xl p-4 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-4 z-50">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setViewState('OVERVIEW')}>
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg group-hover:scale-105 transition-transform">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">
              ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Partenaire</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-visible pb-2 md:pb-0">
            
            {/* Input Période */}
            <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-full shadow-inner border border-slate-200/60 shrink-0 hover:bg-slate-100 transition-colors">
              <span className="font-extrabold text-slate-400 text-[11px] uppercase tracking-widest">Période</span>
              <input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setViewState('OVERVIEW'); }} className="bg-transparent text-slate-800 font-black focus:outline-none cursor-pointer text-sm" />
            </div>

            {/* CUSTOM DROPDOWN PARTENAIRE (Mejnoun Style) */}
            <div className="relative shrink-0 z-50">
              <button 
                onClick={() => setIsPartnerDropdownOpen(!isPartnerDropdownOpen)}
                className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <span className="font-extrabold text-slate-400 text-[11px] uppercase tracking-widest">Partenaire</span>
                <span className="font-black text-blue-700 text-sm max-w-[100px] truncate">{selectedPartner === 'GLOBAL' ? '🌍 Global' : selectedPartner}</span>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isPartnerDropdownOpen ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {isPartnerDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden flex flex-col max-h-[300px]"
                  >
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sélectionner une vue</p>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {uniquePartners.map(p => (
                        <button 
                          key={p} 
                          onClick={() => handlePartnerClick(p)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left",
                            selectedPartner === p ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span className="truncate">{p === 'GLOBAL' ? '🌍 Vue Globale' : `🏢 ${p}`}</span>
                          {selectedPartner === p && <Check size={16} className="text-blue-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowUploads(!showUploads)} 
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shrink-0 shadow-sm", showUploads ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900")}
            >
              <DatabaseZap size={16} className={showUploads ? "text-blue-400" : ""} /> Data
            </button>

            <button onClick={handleDeletePeriod} disabled={isDeleting || !hasData} className="p-2.5 bg-white rounded-full border border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-all disabled:opacity-50 shrink-0 group">
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="group-hover:scale-110 transition-transform" />}
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
              <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/80 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-inner relative">
                
                {/* Bouton pour fermer explicitement l'Upload Area */}
                <button 
                  onClick={() => setShowUploads(false)}
                  className="absolute top-6 right-6 p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 shadow-sm transition-all"
                  title="Fermer la zone d'import"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2"><DatabaseZap className="text-blue-500"/> Zone d'Injection</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Glissez-déposez vos fichiers pour mettre à jour la data de la période.</p>
                  </div>
                  <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setUploadCategory('RACC')} className={cn("relative px-6 py-2 rounded-lg text-xs font-black transition-all z-10", uploadCategory === 'RACC' ? "text-white" : "text-slate-500")}>
                      {uploadCategory === 'RACC' && <motion.div layoutId="upTab" className="absolute inset-0 bg-blue-600 rounded-lg shadow-sm -z-10" />} RACC
                    </button>
                    <button onClick={() => setUploadCategory('SAV')} className={cn("relative px-6 py-2 rounded-lg text-xs font-black transition-all z-10", uploadCategory === 'SAV' ? "text-white" : "text-slate-500")}>
                      {uploadCategory === 'SAV' && <motion.div layoutId="upTab" className="absolute inset-0 bg-purple-600 rounded-lg shadow-sm -z-10" />} SAV
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