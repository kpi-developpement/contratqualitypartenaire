export interface IndicatorResult {
  num: number;
  denum: number;
  resultat: number;
}

export interface ReportResponse {
  // Support pour Snake Case
  perf_rang_1?: Record<string, Record<string, IndicatorResult>>;
  perf_rang_2?: Record<string, IndicatorResult>;
  
  // Support pour Camel Case (Spring Boot par défaut)
  perfRang1?: Record<string, Record<string, IndicatorResult>>;
  perfRang2?: Record<string, IndicatorResult>;
}