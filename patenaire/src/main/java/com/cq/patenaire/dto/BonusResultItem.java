package com.cq.patenaire.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BonusResultItem {

    @JsonProperty("indicatorId")
    private String indicatorId;

    @JsonProperty("resultat")
    private double resultat;

    @JsonProperty("pdm")
    private double pdm;

    @JsonProperty("bonusCalcule")
    private double bonusCalcule;
}