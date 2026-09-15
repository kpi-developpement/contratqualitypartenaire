package com.cq.patenaire.dto;

import lombok.Data;
import java.util.HashMap;
import java.util.Map;

@Data
public class ReportResponse {

    // PERF RANG 1: Activité (PLP, Construction, Hotline) -> Zone (A, B, C) -> Resultat
    private Map<String, Map<String, IndicatorResult>> perfRang1 = new HashMap<>();

    // PERF RANG 2: Zone (A, B, C) -> Resultat
    private Map<String, IndicatorResult> perfRang2 = new HashMap<>();

    // NOUVEAU: TNH (Taux de Non Honoré) - Indicateur Global
    private IndicatorResult tnh = new IndicatorResult(0, 0, 0.0);

    public ReportResponse() {
        // Initialisation des structures pour éviter les NullPointerExceptions
        String[] activities = {"PLP", "Construction", "Hotline"};
        String[] zones = {"A", "B", "C"};

        for (String activity : activities) {
            Map<String, IndicatorResult> zoneMap = new HashMap<>();
            for (String zone : zones) {
                zoneMap.put(zone, new IndicatorResult(0, 0, 0.0));
            }
            perfRang1.put(activity, zoneMap);
        }

        for (String zone : zones) {
            perfRang2.put(zone, new IndicatorResult(0, 0, 0.0));
        }
    }
}