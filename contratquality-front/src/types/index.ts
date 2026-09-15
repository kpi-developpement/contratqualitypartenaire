export interface IndicatorResult {
  num: number;
  denum: number;
  resultat: number;
}

export interface ReportResponse {
  perf_rang_1?: Record<string, Record<string, IndicatorResult>>;
  perf_rang_2?: Record<string, IndicatorResult>;
  tnh?: IndicatorResult;
  satcli_ok?: IndicatorResult;
  satcli_nok?: IndicatorResult;
  
  // Mapping CamelCase p/r Spring Boot par défaut
  perfRang1?: Record<string, Record<string, IndicatorResult>>;
  perfRang2?: Record<string, IndicatorResult>;
  satcliOk?: IndicatorResult;
  satcliNok?: IndicatorResult;
}