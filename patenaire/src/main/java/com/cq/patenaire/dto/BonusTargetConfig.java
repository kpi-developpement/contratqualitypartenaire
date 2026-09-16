package com.cq.patenaire.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BonusTargetConfig {

    @JsonProperty("pointMin")
    private double pointMin;

    @JsonProperty("pointMax")
    private double pointMax;

    @JsonProperty("bonusMin")
    private Double bonusMin; // Objet Double bach nqdero n-testew 3la null

    @JsonProperty("bonusMax")
    private Double bonusMax;
}