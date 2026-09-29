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
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BonusCalculationService {

    private final MonthlyReportRepository repository;

    public BonusCalculationService(MonthlyReportRepository repository) {
        this.repository = repository;
    }

    public Map<String, BonusResultItem> calculateBonus(String periodId, BonusConfigRequest config) {
        MonthlyReport report = repository.findById(periodId)
                .orElseThrow(() -> new RuntimeException("Aucun rapport trouvé pour l'ID: " + periodId));
        return calculateBonusInternal(report, config);
    }

    public Map<String, Map<String, BonusResultItem>> calculateBonusForAll(String period, BonusConfigRequest config) {
        List<MonthlyReport> reports = repository.findByPeriod(period);
        Map<String, Map<String, BonusResultItem>> allResults = new HashMap<>();

        for (MonthlyReport report : reports) {
            String partner = (report.getPartenaire() == null || report.getPartenaire().isEmpty()) ? "GLOBAL" : report.getPartenaire();
            allResults.put(partner, calculateBonusInternal(report, config));
        }
        return allResults;
    }

    private Map<String, BonusResultItem> calculateBonusInternal(MonthlyReport report, BonusConfigRequest config) {
        double totalDenumR1 = calculateTotalDenumR1(report);
        double totalDenumR2 = calculateTotalDenumR2(report);
        Map<String, BonusResultItem> results = new HashMap<>();

        for (Map.Entry<String, BonusTargetConfig> entry : config.getTargets().entrySet()) {
            String indicatorId = entry.getKey();
            BonusTargetConfig target = entry.getValue();

            IndicatorResult stat = getIndicatorStat(report, indicatorId);
            if (stat == null) continue;

            double resultat = stat.getResultat();
            double pdm = 0.0;

            boolean isR1R2 = indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline") || indicatorId.startsWith("RANG2");

            if (indicatorId.startsWith("RANG2")) {
                if (totalDenumR2 > 0) pdm = stat.getDenum() / totalDenumR2;
            } else if (isR1R2) {
                if (totalDenumR1 > 0) pdm = stat.getDenum() / totalDenumR1;
            }

            // Valeurs Brutes (REE, AUDIT) vs Pourcentages
            double divisor = (indicatorId.equals("REE") || indicatorId.equals("AUDIT")) ? 1.0 : 100.0;
            double tMin = target.getPointMin() / divisor; // G
            double tMax = target.getPointMax() / divisor; // H

            double bMin = target.getBonusMin() != null ? target.getBonusMin() / 100.0 : config.getBonusMin() / 100.0;
            double bMax = target.getBonusMax() != null ? target.getBonusMax() / 100.0 : config.getBonusMax() / 100.0;

            double bonus = 0.0;

            // ==========================================
            // LES RATIOS EXACTS (Kima gelti)
            // ==========================================
            // =(E-G)/(H-G)
            double ratioNorm = (tMax != tMin) ? (resultat - tMin) / (tMax - tMin) : 0.0;
            // =(G-E)/(G-H)
            double ratioInv  = (tMax != tMin) ? (tMin - resultat) / (tMin - tMax) : 0.0;

            // ==========================================
            // MOTEUR DE CALCUL (Application du Carré)
            // ==========================================

            // 1. RANG 1 & RANG 2 (Normale, AU CARRÉ, avec PDM)
            if (isR1R2) {
                if (resultat <= tMin) bonus = bMin * pdm;
                else if (resultat >= tMax) bonus = bMax * pdm;
                else bonus = ratioNorm * ratioNorm * bMax * pdm;
            }

            // 2. SATCLI (OK & NOK) (Normale, AU CARRÉ) -> MIS À JOUR ICI !
            else if (indicatorId.equals("SATCLI_OK") || indicatorId.equals("SATCLI_NOK")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else bonus = ratioNorm * ratioNorm * bMax; // Ratio² * BonusMax
            }

            // 3. TAUX DE PLAINTE (Inversée, AU CARRÉ) -> MIS À JOUR ICI !
            else if (indicatorId.equals("PLAINTE")) {
                if (resultat >= tMin) bonus = bMin;      // Pire résultat -> Bonus Min
                else if (resultat <= tMax) bonus = bMax; // Meilleur résultat -> Bonus Max
                else bonus = ratioInv * ratioInv * bMax; // Ratio² * BonusMax
            }

            // 4. GEM NOK (Normale, AU CARRÉ)
            else if (indicatorId.equals("GEM_NOK")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else bonus = ratioNorm * ratioNorm * bMax;
            }

            // 5. TNH & CADRAGE (Inversée, AU CARRÉ)
            else if (indicatorId.equals("TNH") || indicatorId.equals("CADRAGE")) {
                if (resultat >= tMin) bonus = bMin;
                else if (resultat <= tMax) bonus = bMax;
                else bonus = ratioInv * ratioInv * bMax;
            }

            // 6. INCOHERENCE PTO (Inversée, LINÉAIRE) -> Reste linéaire comme demandé
            else if (indicatorId.equals("INCOHERENCE_PTO")) {
                if (resultat >= tMin) bonus = bMin;
                else if (resultat <= tMax) bonus = bMax;
                else bonus = ratioInv * bMax;
            }

            // 7. TOUS LES SAV RESTANTS (Linéaire standard)
            else if (indicatorId.startsWith("SAV_") || indicatorId.equals("AUDIT") || indicatorId.equals("REE")) {
                if (tMin < tMax) {
                    if (resultat <= tMin) bonus = bMin;
                    else if (resultat >= tMax) bonus = bMax;
                    else bonus = ratioNorm * bMax;
                } else {
                    if (resultat >= tMin) bonus = bMin;
                    else if (resultat <= tMax) bonus = bMax;
                    else bonus = ratioInv * bMax;
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
                for (IndicatorResult ind : zones.values()) sum += ind.getDenum();
            }
        }
        return sum;
    }

    private double calculateTotalDenumR2(MonthlyReport report) {
        double sum = 0;
        if (report.getPerfRang2() != null) {
            for (IndicatorResult ind : report.getPerfRang2().values()) sum += ind.getDenum();
        }
        return sum;
    }

    private IndicatorResult getIndicatorStat(MonthlyReport report, String indicatorId) {
        if (indicatorId.startsWith("RANG2")) {
            String zone = indicatorId.split("-")[1];
            return report.getPerfRang2() != null ? report.getPerfRang2().get(zone) : null;
        } else if (indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline")) {
            String[] parts = indicatorId.split("-");
            if (report.getPerfRang1() != null && report.getPerfRang1().containsKey(parts[0])) {
                return report.getPerfRang1().get(parts[0]).get(parts[1]);
            }
        } else {
            switch (indicatorId) {
                case "SATCLI_OK": return report.getSatcliOk();
                case "SATCLI_NOK": return report.getSatcliNok();
                case "PLAINTE": return report.getTauxPlainte();
                case "GEM_NOK": return report.getGemNok();
                case "TNH": return report.getTnh();
                case "CADRAGE": return report.getCadrage();
                case "INCOHERENCE_PTO": return report.getIncoherencePto();

                // SAV
                case "AUDIT": return report.getAudit();
                case "REE": return report.getRee();
                case "SAV_SATCLI": return report.getSavSatcli();
                case "SAV_SECURISATION": return report.getSavSecurisation();
                case "SAV_TNH": return report.getSavTnh();
                case "SAV_CCR": return report.getSavCcr();
                case "SAV_PERF": return report.getSavPerf();
            }
        }
        return null;
    }
}