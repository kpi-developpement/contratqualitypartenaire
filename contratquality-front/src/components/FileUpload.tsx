"use client";

import React, { useState, useRef } from "react";
import { Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  uploadAction: (file: File) => Promise<any>;
  onUploadSuccess: () => void;
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
      await uploadAction(selectedFile);
      onUploadSuccess();
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
          "relative group flex flex-col items-center justify-center w-full h-full min-h-[180px] p-5 rounded-xl transition-all duration-300 ease-out border overflow-hidden bg-white",
          !selectedFile ? "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer" : "border-slate-900 shadow-md",
          isDragging ? "border-slate-800 bg-slate-50" : ""
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
          <div className="flex flex-col items-center text-center space-y-3 w-full">
            <div className="text-slate-400 group-hover:text-slate-800 transition-colors duration-300">
              {icon}
            </div>
            <div className="w-full px-2">
              <p className="text-sm font-bold text-slate-800 tracking-tight">{title}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative group/btn">
              <div className="text-slate-900">
                <CheckCircle2 size={28} strokeWidth={2} />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                className="absolute -top-3 -right-3 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all"
                title="Changer de fichier"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
            
            <div className="w-full px-4">
              <p className="text-xs font-bold text-slate-800 truncate block w-full" title={selectedFile.name}>
                {selectedFile.name}
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all w-full justify-center"
            >
              {isUploading && <Loader2 size={14} className="animate-spin" />}
              {isUploading ? "Injection..." : "Confirmer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}