"use client";

import React, { useState } from "react";

interface FileUploadProps {
  onUploadSuccess: (data: any) => void;
  onUploadError: (error: string) => void;
  onLoading: (isLoading: boolean) => void;
}

import { uploadExcelFile } from "@/services/api";

export default function FileUpload({ onUploadSuccess, onUploadError, onLoading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    onLoading(true);
    onUploadError("");

    try {
      const data = await uploadExcelFile(selectedFile);
      onUploadSuccess(data);
    } catch (error: any) {
      onUploadError(error.message || "Une erreur est survenue");
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4 cursor-pointer"
      />
      <button
        onClick={handleUpload}
        disabled={!selectedFile}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
      >
        Analyser le fichier
      </button>
    </div>
  );
}