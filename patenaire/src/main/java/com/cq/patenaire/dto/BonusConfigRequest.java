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

    @JsonProperty("facteurG44")
    private double facteurG44;

    @JsonProperty("facteurG45")
    private double facteurG45;

    @JsonProperty("facteurG46")
    private double facteurG46;

    private Map<String, BonusTargetConfig> targets;
}