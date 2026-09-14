"use client";

import React, { useState, useRef } from "react";
import { uploadExcelFile } from "@/services/api";
import { CloudUpload, FileSpreadsheet, Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
  onUploadError: (error: string) => void;
  onLoading: (isLoading: boolean) => void;
}

export default function FileUpload({ onUploadSuccess, onUploadError, onLoading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setSelectedFile(file);
      onUploadError(""); 
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    onLoading(true);
    onUploadError("");

    try {
      const data = await uploadExcelFile(selectedFile);
      onUploadSuccess(data);
    } catch (error: any) {
      onUploadError(error.message || "Une erreur est survenue");
    } finally {
      setIsUploading(false);
      onLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative group flex flex-col items-center justify-center w-full h-72 p-6 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-md shadow-sm",
          isDragging ? "border-blue-500 bg-blue-50/80 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/80 hover:shadow-md",
          selectedFile ? "border-emerald-400 bg-emerald-50/40" : ""
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="p-5 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
              <CloudUpload size={44} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">Glissez-déposez votre fichier ici</p>
              <p className="text-sm text-slate-500 mt-1">Supporte les formats .xlsx et .csv</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3 mt-2 text-sm font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Parcourir les fichiers
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-5 w-full animate-in zoom-in duration-300">
            <div className="relative">
              <div className="p-5 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl text-emerald-600 shadow-sm">
                <FileSpreadsheet size={44} strokeWidth={1.5} />
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 truncate max-w-[250px]">{selectedFile.name}</p>
              <p className="text-sm text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isUploading ? "Analyse en cours..." : "Lancer l'analyse"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}