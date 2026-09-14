package com.cq.patenaire.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndicatorResult {
    private int num;
    private int denum;
    private double resultat;

    // Helper method bach n-calculiw le résultat automatiquement
    public void calculateResult() {
        if (this.denum > 0) {
            this.resultat = (double) this.num / this.denum;
        } else {
            this.resultat = 0.0;
        }
    }
}