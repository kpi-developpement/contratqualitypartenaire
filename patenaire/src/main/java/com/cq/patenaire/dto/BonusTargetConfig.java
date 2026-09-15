package com.cq.patenaire.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class BonusTargetConfig {

    @JsonProperty("pointMin")
    private double pointMin;

    @JsonProperty("pointMax")
    private double pointMax;
}