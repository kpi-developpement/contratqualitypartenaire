package com.cq.patenaire.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndicatorResult implements Serializable {
    private int num;
    private int denum;
    private double resultat;

    public void calculateResult() {
        if (this.denum > 0) {
            this.resultat = (double) this.num / this.denum;
        } else {
            this.resultat = 0.0;
        }
    }
}