package com.cq.patenaire.dto;

import lombok.Data;
import java.util.Map;

@Data
public class ReportResponse {

    // On les initialise à null, le service va les créer selon le type de fichier uploadé
    private Map<String, Map<String, IndicatorResult>> perfRang1;
    private Map<String, IndicatorResult> perfRang2;
    private IndicatorResult tnh;

    // NOUVEAUX INDICATEURS
    private IndicatorResult satcliOk;
    private IndicatorResult satcliNok;
}