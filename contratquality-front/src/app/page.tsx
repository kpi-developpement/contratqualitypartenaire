"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import FadeIn from "@/components/animations/FadeIn";
import SlideUp from "@/components/animations/SlideUp";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown, Network, Crop, Zap, Wrench, ClipboardCheck, Timer, Trash2, Loader2, Building2, Globe2, ArrowLeft, TrendingUp } from "lucide-react";
import { fetchReport, deleteReport, uploadRangFile, uploadSatcliFile, uploadPlainteFile, uploadPtoFile, uploadCadrageFile, uploadGemNokFile, uploadSavFile, uploadAuditFile, uploadReeFile, calculateAllBonuses } from "@/services/api";
import { cn } from "@/lib/utils";

// Targets par défaut pour l'overview
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
  const [uploadCategory, setUploadCategory] = useState<'RACC' | 'SAV'>('RACC');
  
  // Navigation State
  const [viewState, setViewState] = useState<'OVERVIEW' | 'DETAIL'>('OVERVIEW');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [overviewBonuses, setOverviewBonuses] = useState<Record<string, { racc: number, sav: number, total: number }>>({});
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

  // Targets State Lifted Up
  const [targets, setTargets] = useState(DEFAULT_TARGETS);

  const fetchAndCalculate = async (p: string) => {
    try {
      const data = await fetchReport(p);
      setAllReports(data);
      if (data.length > 0) {
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
    if (confirm(`⚠️ ATTENTION ⚠️\nSupprimer TOUTES les données (RACC et SAV) pour la période ${period} ?`)) {
      setIsDeleting(true);
      try {
        await deleteReport(period);
        setAllReports([]);
        setOverviewBonuses({});
        setViewState('OVERVIEW');
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
      <div className="max-w-7xl mx-auto space-y-10 relative z-10 p-6 md:p-12">
        
        {/* HEADER */}
        <FadeIn delay={0.1} className="flex flex-col items-center justify-center space-y-6 pt-4">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <BarChart3 className="text-blue-600" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight text-center">
            ContratQuality <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Partenaire</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200/80">
                <span className="font-bold text-slate-500 text-sm uppercase tracking-wide">Période :</span>
                <input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setViewState('OVERVIEW'); }} className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer" />
              </div>
              <button onClick={handleDeletePeriod} disabled={isDeleting || !hasData} className="p-3 bg-white rounded-full border border-slate-200 shadow-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Supprimer la période">
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              </button>
            </div>

            {viewState === 'OVERVIEW' && (
              <div className="flex p-1 bg-white rounded-full border border-slate-200 shadow-sm">
                <button onClick={() => setUploadCategory('RACC')} className={cn("relative px-6 py-2 rounded-full text-sm font-bold transition-all z-10", uploadCategory === 'RACC' ? "text-white" : "text-slate-500")}>
                  {uploadCategory === 'RACC' && <motion.div layoutId="upTab" className="absolute inset-0 bg-slate-900 rounded-full -z-10" />} Upload RACC
                </button>
                <button onClick={() => setUploadCategory('SAV')} className={cn("relative px-6 py-2 rounded-full text-sm font-bold transition-all z-10", uploadCategory === 'SAV' ? "text-white" : "text-slate-500")}>
                  {uploadCategory === 'SAV' && <motion.div layoutId="upTab" className="absolute inset-0 bg-slate-900 rounded-full -z-10" />} Upload SAV
                </button>
              </div>
            )}
          </div>
        </FadeIn>

        {error && (
          <FadeIn className="max-w-3xl mx-auto p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} /><div><h3 className="text-sm font-bold text-rose-800">Erreur</h3><p className="text-sm text-rose-600 mt-1">{error}</p></div>
          </FadeIn>
        )}

        {/* UPLOADS GRID (Visible uniquement dans l'Overview) */}
        {viewState === 'OVERVIEW' && (
          <div className="min-h-[250px]">
            <AnimatePresence mode="wait">
              {uploadCategory === 'RACC' ? (
                <motion.div key="racc-up" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FileUpload title="RANG & TNH" description="Source principale" icon={<FileSpreadsheet size={32} className="text-blue-600" />} uploadAction={(f) => uploadRangFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="SATCLI" description="OK & NOK" icon={<Star size={32} className="text-teal-600" />} uploadAction={(f) => uploadSatcliFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="Taux Plainte" description="Volume ticket" icon={<Frown size={32} className="text-rose-600" />} uploadAction={(f) => uploadPlainteFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="PTO" description="Incohérence PTO" icon={<Network size={32} className="text-pink-600" />} uploadAction={(f) => uploadPtoFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="Cadrage" description="MAL_CADREE" icon={<Crop size={32} className="text-indigo-600" />} uploadAction={(f) => uploadCadrageFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="GEM NOK" description="TVC et Flg Gem" icon={<Zap size={32} className="text-cyan-600" />} uploadAction={(f) => uploadGemNokFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                </motion.div>
              ) : (
                <motion.div key="sav-up" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FileUpload title="Fichier SAV" description="SATCLI, TNH, SECU..." icon={<Wrench size={32} className="text-purple-600" />} uploadAction={(f) => uploadSavFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="AUDIT" description="90e Centile" icon={<ClipboardCheck size={32} className="text-fuchsia-600" />} uploadAction={(f) => uploadAuditFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                  <FileUpload title="REE" description="90e Centile" icon={<Timer size={32} className="text-emerald-600" />} uploadAction={(f) => uploadReeFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* OVERVIEW DES CARTES */}
        {hasData && viewState === 'OVERVIEW' && (
          <SlideUp delay={0.2} className="pt-6 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <TrendingUp className="text-blue-500" /> Synthèse des Partenaires
                {isLoadingBonuses && <Loader2 size={20} className="animate-spin text-slate-400" />}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(overviewBonuses).sort((a,b) => a === 'GLOBAL' ? -1 : a.localeCompare(b)).map(partner => {
                const sums = overviewBonuses[partner];
                const isGlobal = partner === 'GLOBAL';
                return (
                  <motion.div 
                    key={partner}
                    whileHover={{ y: -5 }}
                    onClick={() => handlePartnerClick(partner)}
                    className={cn(
                      "bg-white rounded-[1.5rem] p-6 border shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] transition-all cursor-pointer group relative overflow-hidden",
                      isGlobal ? "border-blue-200 shadow-blue-100/50 bg-gradient-to-br from-white to-blue-50/50 md:col-span-2 lg:col-span-3" : "border-slate-200/80"
                    )}
                  >
                    {isGlobal && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />}
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3.5 rounded-2xl transition-colors", isGlobal ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white border border-slate-100")}>
                          {isGlobal ? <Globe2 size={24} /> : <Building2 size={24} />}
                        </div>
                        <div>
                          <h3 className={cn("font-black tracking-tight", isGlobal ? "text-2xl text-slate-900" : "text-xl text-slate-800")}>{isGlobal ? '🌍 Performance Globale' : partner}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Période {period}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn("font-black", isGlobal ? "text-4xl" : "text-3xl", sums.total >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {sums.total > 0 ? '+' : ''}{(sums.total * 100).toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Total Bonus</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100/50">
                        <div className="text-xs font-bold text-slate-500 mb-1">Bonus RACC</div>
                        <div className={cn("text-lg font-black", sums.racc >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {sums.racc > 0 ? '+' : ''}{(sums.racc * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100/50">
                        <div className="text-xs font-bold text-purple-600/70 mb-1">Bonus SAV</div>
                        <div className={cn("text-lg font-black", sums.sav >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {sums.sav > 0 ? '+' : ''}{(sums.sav * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </SlideUp>
        )}

        {/* DETAILS D'UN PARTENAIRE */}
        {hasData && viewState === 'DETAIL' && currentReport && (
          <SlideUp delay={0.1}>
            <button onClick={() => setViewState('OVERVIEW')} className="mb-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all hover:-translate-x-1 group">
              <ArrowLeft size={18} className="group-hover:text-blue-600 transition-colors" /> Retour à la synthèse globale
            </button>
            <IndicatorsTable 
              period={period}
              partner={selectedPartner!}
              category="RACC" // On laisse IndicatorsTable gérer ses propres tabs (RACC/SAV)
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