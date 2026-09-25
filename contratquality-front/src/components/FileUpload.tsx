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
      // On garde le fichier affiché en vert après succès (pas de reset de selectedFile)
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
          "relative group flex flex-col items-center justify-center w-full h-full min-h-[220px] p-6 rounded-[1.5rem] transition-all duration-500 ease-out border overflow-hidden",
          !selectedFile ? "bg-white border-slate-200/70 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 cursor-pointer" : "bg-emerald-50/50 border-emerald-400 shadow-md",
          isDragging ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-2xl" : ""
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
          <div className="flex flex-col items-center text-center space-y-4 w-full">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 shadow-sm">
              {icon}
            </div>
            <div className="w-full px-2">
              <p className="text-[15px] font-extrabold text-slate-800">{title}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{description}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2 transform translate-y-2 group-hover:translate-y-0">
              <span className="px-5 py-2 text-[11px] font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-200 shadow-sm">
                Choisir un fichier
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-5 w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="relative group/btn">
              <div className="p-4 bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-600 shadow-inner">
                <CheckCircle2 size={32} strokeWidth={2} />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 shadow-md transition-all scale-0 group-hover/btn:scale-100"
                title="Changer de fichier"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
            
            {/* FIX GLITCH LONG NAME: truncate w-full px-4 */}
            <div className="w-full px-4">
              <p className="text-sm font-bold text-slate-800 truncate block w-full" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-[10px] font-bold text-emerald-600/70 mt-1 uppercase tracking-wider">Prêt à l'import</p>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:bg-slate-400 transition-all shadow-[0_5px_15px_rgba(5,150,105,0.3)] hover:shadow-[0_8px_20px_rgba(5,150,105,0.4)] hover:-translate-y-0.5 disabled:transform-none disabled:shadow-none w-full justify-center"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="fill-white/20" />}
              {isUploading ? "Injection..." : "Injecter la donnée"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}