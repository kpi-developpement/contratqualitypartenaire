export interface IndicatorResult {
  num: number;
  denum: number;
  resultat: number;
}

export interface ReportResponse {
  period?: string;
  
  perf_rang_1?: Record<string, Record<string, IndicatorResult>>;
  perf_rang_2?: Record<string, IndicatorResult>;
  tnh?: IndicatorResult;
  satcli_ok?: IndicatorResult;
  satcli_nok?: IndicatorResult;
  taux_plainte?: IndicatorResult;
  incoherence_pto?: IndicatorResult;
  cadrage?: IndicatorResult;
  gem_nok?: IndicatorResult;
  
  // Mapping CamelCase p/r Spring Boot
  perfRang1?: Record<string, Record<string, IndicatorResult>>;
  perfRang2?: Record<string, IndicatorResult>;
  satcliOk?: IndicatorResult;
  satcliNok?: IndicatorResult;
  tauxPlainte?: IndicatorResult;
  incoherencePto?: IndicatorResult;
  gemNok?: IndicatorResult;
}