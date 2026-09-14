import { ReportResponse } from "@/types";

// L'IP exacte dyal server dyalk
const API_BASE_URL = "http://10.10.10.25:6355/api/v1";

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