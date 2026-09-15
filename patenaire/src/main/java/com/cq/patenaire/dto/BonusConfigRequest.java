package com.cq.patenaire.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Map;

@Data
public class BonusConfigRequest {

    @JsonProperty("bonusMin")
    private double bonusMin;

    @JsonProperty("bonusMax")
    private double bonusMax;

    @JsonProperty("facteurG29")
    private double facteurG29;

    private Map<String, BonusTargetConfig> targets;
}