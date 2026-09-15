package com.cq.patenaire.service;

import com.cq.patenaire.dto.BonusConfigRequest;
import com.cq.patenaire.dto.BonusResultItem;
import com.cq.patenaire.dto.BonusTargetConfig;
import com.cq.patenaire.dto.IndicatorResult;
import com.cq.patenaire.entity.MonthlyReport;
import com.cq.patenaire.repository.MonthlyReportRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class BonusCalculationService {

    private final MonthlyReportRepository repository;

    public BonusCalculationService(MonthlyReportRepository repository) {
        this.repository = repository;
    }

    public Map<String, BonusResultItem> calculateBonus(String period, BonusConfigRequest config) {
        MonthlyReport report = repository.findById(period)
                .orElseThrow(() -> new RuntimeException("Aucun rapport trouvé pour la période: " + period));

        // 1. Calcul des dénominateurs totaux pour la Part de Marché (PDM)
        double totalDenumR1 = calculateTotalDenumR1(report);
        double totalDenumR2 = calculateTotalDenumR2(report);

        Map<String, BonusResultItem> results = new HashMap<>();

        // 2. Parcourir la configuration envoyée par l'API pour chaque indicateur
        for (Map.Entry<String, BonusTargetConfig> entry : config.getTargets().entrySet()) {
            String indicatorId = entry.getKey();
            BonusTargetConfig target = entry.getValue();

            IndicatorResult stat = getIndicatorStat(report, indicatorId);
            if (stat == null) {
                continue; // Si l'indicateur n'existe pas dans le rapport, on passe
            }

            double resultat = stat.getResultat();
            double pdm = 0.0;

            // Calcul du PDM selon le type (Rang 1 ou Rang 2)
            if (indicatorId.startsWith("RANG2")) {
                if (totalDenumR2 > 0) pdm = stat.getDenum() / totalDenumR2;
            } else {
                if (totalDenumR1 > 0) pdm = stat.getDenum() / totalDenumR1;
            }

            // 3. Application stricte de la formule Excel:
            // =SI(E6<=G6; $I$6*F6; SI(E6>=H6; F6*$J$6; (E6-G6)/(H6-G6)*$J$6*F6*G29))
            double bonus = 0.0;
            double tMin = target.getPointMin() / 100.0;
            double tMax = target.getPointMax() / 100.0;
            double bMin = config.getBonusMin() / 100.0;
            double bMax = config.getBonusMax() / 100.0;
            double g29 = config.getFacteurG29();

            if (resultat <= tMin) {
                bonus = bMin * pdm;
            } else if (resultat >= tMax) {
                bonus = pdm * bMax;
            } else {
                if (tMax > tMin) { // Protection division par zéro
                    bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * pdm * g29;
                }
            }

            results.put(indicatorId, new BonusResultItem(indicatorId, resultat, pdm, bonus));
        }

        return results;
    }

    private double calculateTotalDenumR1(MonthlyReport report) {
        double sum = 0;
        if (report.getPerfRang1() != null) {
            for (Map<String, IndicatorResult> zones : report.getPerfRang1().values()) {
                for (IndicatorResult ind : zones.values()) {
                    sum += ind.getDenum();
                }
            }
        }
        return sum;
    }

    private double calculateTotalDenumR2(MonthlyReport report) {
        double sum = 0;
        if (report.getPerfRang2() != null) {
            for (IndicatorResult ind : report.getPerfRang2().values()) {
                sum += ind.getDenum();
            }
        }
        return sum;
    }

    // Helper pour extraire l'indicateur selon l'ID (ex: "PLP-A" ou "RANG2-B")
    private IndicatorResult getIndicatorStat(MonthlyReport report, String indicatorId) {
        String[] parts = indicatorId.split("-");
        if (parts.length != 2) return null;

        String category = parts[0];
        String zone = parts[1];

        if ("RANG2".equals(category)) {
            if (report.getPerfRang2() != null) {
                return report.getPerfRang2().get(zone);
            }
        } else {
            if (report.getPerfRang1() != null && report.getPerfRang1().containsKey(category)) {
                return report.getPerfRang1().get(category).get(zone);
            }
        }
        return null;
    }
}