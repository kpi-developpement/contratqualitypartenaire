"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import IndicatorsTable from "@/components/IndicatorsTable";
import PartnerOverview from "@/components/PartnerOverview";
import InteractiveBackground from "@/components/InteractiveBackground";
import { ReportResponse } from "@/types";
import { BarChart3, AlertCircle, FileSpreadsheet, Star, Frown, Network, Crop, Zap, Wrench, ClipboardCheck, Timer, Trash2, Loader2, ArrowLeft, DatabaseZap, X } from "lucide-react";
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

  const [overviewBonuses, setOverviewBonuses] = useState<Record<string, { racc: number, sav: number, total: number }>>({});
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);

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

  // FIX CRASH: Après chaque upload, on refetch la data fraîche et on recalcule les bonus
  const handleSuccess = () => {
    setError(null);
    fetchAndCalculate(period);
  };

  const handleDeletePeriod = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer les données pour la période ${period} ?`)) {
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
    <main className="min-h-screen relative font-sans selection:bg-blue-100 bg-transparent pb-20 text-slate-800">
      <InteractiveBackground />
      <div className="max-w-[1300px] mx-auto space-y-8 relative z-10 p-4 md:p-8">
        
        {/* NAVBAR MATURE & ÉPURÉE (Sans Dropdown Partenaire) */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 shadow-sm sticky top-4 z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewState('OVERVIEW')}>
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <BarChart3 size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              ContratQuality <span className="text-slate-500 font-medium">| Partenaire</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Période</span>
              <input type="month" value={period} onChange={(e) => { setPeriod(e.target.value); setViewState('OVERVIEW'); }} className="bg-transparent font-bold focus:outline-none cursor-pointer text-sm" />
            </div>

            <button 
              onClick={() => setShowUploads(!showUploads)} 
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border", showUploads ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")}
            >
              <DatabaseZap size={16} /> Imports
            </button>

            <button onClick={handleDeletePeriod} disabled={isDeleting || !hasData} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors disabled:opacity-50">
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
            <div><p className="text-sm font-semibold text-rose-800">Erreur lors de l'opération</p><p className="text-xs text-rose-600 mt-1">{error}</p></div>
          </div>
        )}

        {/* UPLOADS DRAWER - PRO LOOK */}
        <AnimatePresence>
          {showUploads && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm relative">
                
                <button onClick={() => setShowUploads(false)} className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-800 transition-colors" title="Fermer">
                  <X size={20} />
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Gestion des Fichiers</h3>
                    <p className="text-xs text-slate-500 mt-1">Sélectionnez le module pour injecter la donnée.</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                    <button onClick={() => setUploadCategory('RACC')} className={cn("px-6 py-1.5 rounded-md text-xs font-bold transition-all", uploadCategory === 'RACC' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
                      RACC
                    </button>
                    <button onClick={() => setUploadCategory('SAV')} className={cn("px-6 py-1.5 rounded-md text-xs font-bold transition-all", uploadCategory === 'SAV' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}>
                      SAV
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {uploadCategory === 'RACC' ? (
                    <motion.div key="racc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <FileUpload title="RANG" description="Source Principale" icon={<FileSpreadsheet size={20} />} uploadAction={(f) => uploadRangFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="SATCLI" description="OK & NOK" icon={<Star size={20} />} uploadAction={(f) => uploadSatcliFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="Plainte" description="Taux & Volume" icon={<Frown size={20} />} uploadAction={(f) => uploadPlainteFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="PTO" description="Incohérence PTO" icon={<Network size={20} />} uploadAction={(f) => uploadPtoFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="Cadrage" description="MAL_CADREE" icon={<Crop size={20} />} uploadAction={(f) => uploadCadrageFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="GEM NOK" description="TVC et Flg" icon={<Zap size={20} />} uploadAction={(f) => uploadGemNokFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                    </motion.div>
                  ) : (
                    <motion.div key="sav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FileUpload title="Fichier SAV" description="SATCLI, TNH, SECU..." icon={<Wrench size={20} />} uploadAction={(f) => uploadSavFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="AUDIT" description="90e Centile" icon={<ClipboardCheck size={20} />} uploadAction={(f) => uploadAuditFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
                      <FileUpload title="REE" description="90e Centile" icon={<Timer size={20} />} uploadAction={(f) => uploadReeFile(f, period)} onUploadSuccess={handleSuccess} onUploadError={setError} />
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
            <button onClick={() => setViewState('OVERVIEW')} className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
              <ArrowLeft size={16} /> Retour au Dashboard
            </button>
            <IndicatorsTable 
              period={period}
              partner={selectedPartner}
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