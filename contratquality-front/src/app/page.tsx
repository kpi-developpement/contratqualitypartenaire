"use client";

import React, { useState } from "react";
import FileUpload from "@/components/FileUpload";
import Rang1Table from "@/components/Rang1Table";
import { ReportResponse } from "@/types";

export default function Home() {
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraction intelligente des données (supporte CamelCase et SnakeCase)
  const rang1Data = reportData ? (reportData.perf_rang_1 || reportData.perfRang1) : undefined;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ContratQuality Partenaire
          </h1>
          <p className="text-slate-500">
            Importez votre fichier Excel ou CSV pour générer les indicateurs de performance.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <FileUpload 
            onUploadSuccess={(data) => {
              console.log("Données reçues du backend:", data); // Pour debugger dans la console du navigateur
              setReportData(data);
            }}
            onUploadError={(err) => setError(err)}
            onLoading={(loading) => setIsLoading(loading)}
          />
          
          {isLoading && (
            <div className="mt-4 text-center text-sm font-medium text-blue-600 animate-pulse">
              Analyse du fichier en cours...
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {reportData && rang1Data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Rang1Table data={rang1Data} />
          </div>
        )}

      </div>
    </main>
  );
}