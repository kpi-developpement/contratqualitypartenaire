package com.cq.patenaire.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BonusResultItem {
    private String indicatorId;
    private double resultat;
    private double pdm;
    private double bonusCalcule;
}