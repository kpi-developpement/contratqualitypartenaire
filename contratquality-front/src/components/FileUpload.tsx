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
      setSelectedFile(null); // Reset after success
    } catch (error: any) {
      onUploadError(error.message || "Une erreur est survenue");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative group flex flex-col items-center justify-center w-full h-56 p-6 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out bg-white/60 backdrop-blur-md shadow-sm",
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
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-slate-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              {icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{title}</p>
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 mt-2 text-xs font-semibold text-slate-700 bg-slate-200 rounded-full hover:bg-slate-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              Parcourir
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 w-full animate-in zoom-in duration-300">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl text-emerald-600 shadow-sm">
                <CheckCircle2 size={32} strokeWidth={1.5} />
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-md transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{selectedFile.name}</p>
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 transition-all shadow-md hover:shadow-lg disabled:transform-none"
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