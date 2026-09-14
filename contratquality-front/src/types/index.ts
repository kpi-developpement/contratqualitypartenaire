export interface IndicatorResult {
  num: number;
  denum: number;
  resultat: number;
}

export interface ReportResponse {
  perf_rang_1: Record<string, Record<string, IndicatorResult>>;
  perf_rang_2: Record<string, IndicatorResult>;
}