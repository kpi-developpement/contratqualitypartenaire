package com.cq.patenaire.dto;

import lombok.Data;
import java.util.Map;

@Data
public class BonusConfigRequest {
    private double bonusMin;
    private double bonusMax;
    private double facteurG29;

    // Clé: "PLP-A", "Construction-B", "RANG2-C" -> Valeur: Configuration Min/Max
    private Map<String, BonusTargetConfig> targets;
}