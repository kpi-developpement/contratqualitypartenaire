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

            // PDM RACC
            if (indicatorId.startsWith("RANG2")) {
                if (totalDenumR2 > 0) pdm = stat.getDenum() / totalDenumR2;
            } else if (indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline")) {
                if (totalDenumR1 > 0) pdm = stat.getDenum() / totalDenumR1;
            }

            // Gestion des indicateurs "Bruts" (REE et AUDIT) pour ne pas diviser par 100
            double divisor = (indicatorId.equals("REE") || indicatorId.equals("AUDIT")) ? 1.0 : 100.0;
            double tMin = target.getPointMin() / divisor;
            double tMax = target.getPointMax() / divisor;

            double bMin = target.getBonusMin() != null ? target.getBonusMin() / 100.0 : config.getBonusMin() / 100.0;
            double bMax = target.getBonusMax() != null ? target.getBonusMax() / 100.0 : config.getBonusMax() / 100.0;

            double bonus = 0.0;

            // ==========================================
            // LOGIQUES DE CALCUL DES BONUS
            // ==========================================

            // 1. Logique RACC avec PDM et G29
            if (indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline") || indicatorId.startsWith("RANG2")) {
                if (resultat <= tMin) bonus = bMin * pdm;
                else if (resultat >= tMax) bonus = bMax * pdm;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * pdm * config.getFacteurG29();
            }

            // 2. Logique Normale : =SI(E<=G;I;SI(E>=H;J;(E-G)/(H-G)*J))
            else if (indicatorId.equals("SATCLI_OK") || indicatorId.equals("SATCLI_NOK") || indicatorId.equals("SAV_PERF")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax;
            }

            // 3. Logique GEM_NOK avec G44
            else if (indicatorId.equals("GEM_NOK")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * config.getFacteurG44();
            }

            // 4. Logique Inversée (Plus c'est bas, mieux c'est) : =SI(E>=G;I;SI(E<=H;J;(E-G)/(H-G)*J))
            else if (indicatorId.equals("SAV_SECURISATION") || indicatorId.equals("AUDIT") || indicatorId.equals("SAV_SATCLI") ||
                    indicatorId.equals("SAV_CCR") || indicatorId.equals("REE") || indicatorId.equals("SAV_TNH") ||
                    indicatorId.equals("PLAINTE") || indicatorId.equals("TNH") || indicatorId.equals("CADRAGE") || indicatorId.equals("INCOHERENCE_PTO")) {

                if (resultat >= tMin) {
                    bonus = bMin;
                } else if (resultat <= tMax) {
                    bonus = bMax;
                } else if (tMax != tMin) {
                    double facteur = 1.0;
                    if (indicatorId.equals("TNH")) facteur = config.getFacteurG45();
                    if (indicatorId.equals("CADRAGE")) facteur = config.getFacteurG46();

                    bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * facteur;
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