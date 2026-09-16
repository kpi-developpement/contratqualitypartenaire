"use client";

import React, { useState, useRef } from "react";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  uploadAction: (file: File) => Promise<any>;
  onUploadSuccess: (data: any) => void;
  onUploadError: (error: string) => void;
}

export default function FileUpload({ title, description, icon, uploadAction, onUploadSuccess, onUploadError }: FileUploadProps) {
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
    onUploadError("");

    try {
      const data = await uploadAction(selectedFile);
      onUploadSuccess(data);
      setSelectedFile(null);
    } catch (error: any) {
      onUploadError(error.message || "Une erreur est survenue");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-full">
      <div
        className={cn(
          "relative group flex flex-col items-center justify-center w-full h-full min-h-[220px] p-6 rounded-[1.5rem] transition-all duration-500 ease-out bg-white border border-slate-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer overflow-hidden",
          isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "",
          selectedFile ? "border-emerald-400 bg-emerald-50/30" : ""
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
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
              {icon}
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-slate-800">{title}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{description}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
              <span className="px-5 py-2 text-[11px] font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-100">
                Parcourir
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-5 w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shadow-sm">
                <CheckCircle2 size={32} strokeWidth={2} />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-colors"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-md hover:shadow-lg disabled:transform-none w-full justify-center"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isUploading ? "Upload en cours..." : "Lancer l'analyse"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}