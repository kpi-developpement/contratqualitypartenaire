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
  audit?: IndicatorResult;
  ree?: IndicatorResult;

  sav_satcli?: IndicatorResult;
  sav_securisation?: IndicatorResult;
  sav_tnh?: IndicatorResult;
  sav_ccr?: IndicatorResult;
  sav_perf?: IndicatorResult;
  
  // Mapping CamelCase
  perfRang1?: Record<string, Record<string, IndicatorResult>>;
  perfRang2?: Record<string, IndicatorResult>;
  satcliOk?: IndicatorResult;
  satcliNok?: IndicatorResult;
  tauxPlainte?: IndicatorResult;
  incoherencePto?: IndicatorResult;
  gemNok?: IndicatorResult;

  savSatcli?: IndicatorResult;
  savSecurisation?: IndicatorResult;
  savTnh?: IndicatorResult;
  savCcr?: IndicatorResult;
  savPerf?: IndicatorResult;
}