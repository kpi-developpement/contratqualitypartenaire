import { ReportResponse } from "@/types";

// Kay-9ra l'URL mn l'environnement (Docker) ola kay-dir localhost par défaut
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6355/api/v1";

export const uploadExcelFile = async (file: File): Promise<ReportResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/excel/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Erreur lors de l'upload du fichier");
  }

  return response.json();
};