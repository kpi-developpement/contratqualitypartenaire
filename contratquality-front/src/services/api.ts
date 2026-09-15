import { ReportResponse } from "@/types";

const API_BASE_URL = "http://10.10.10.25:6355/api/v1";

export const fetchReport = async (period: string): Promise<ReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/excel/report/${period}`);
  if (!response.ok) throw new Error("Erreur de récupération du rapport");
  return response.json();
};

const uploadGeneric = async (endpoint: string, file: File, period: string): Promise<ReportResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("period", period);

  const response = await fetch(`${API_BASE_URL}/excel/upload/${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Erreur lors de l'upload du fichier");
  }

  return response.json();
};

export const uploadRangFile = (file: File, period: string) => uploadGeneric("rang", file, period);
export const uploadSatcliFile = (file: File, period: string) => uploadGeneric("satcli", file, period);
export const uploadPlainteFile = (file: File, period: string) => uploadGeneric("plainte", file, period);