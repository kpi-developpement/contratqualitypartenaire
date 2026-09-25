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

    // ==========================================
    // NOUVEAU: CALCULER POUR TOUT LE MONDE EN 1 SEUL APPEL
    // ==========================================
    public Map<String, Map<String, BonusResultItem>> calculateBonusForAll(String period, BonusConfigRequest config) {
        List<MonthlyReport> reports = repository.findByPeriod(period);
        Map<String, Map<String, BonusResultItem>> allResults = new HashMap<>();

        for (MonthlyReport report : reports) {
            String partner = (report.getPartenaire() == null || report.getPartenaire().isEmpty()) ? "GLOBAL" : report.getPartenaire();
            allResults.put(partner, calculateBonusInternal(report, config));
        }
        return allResults;
    }

    // ==========================================
    // MOTEUR DE CALCUL INTERNE (Réutilisable)
    // ==========================================
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

            if (indicatorId.startsWith("RANG2")) {
                if (totalDenumR2 > 0) pdm = stat.getDenum() / totalDenumR2;
            } else if (indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline")) {
                if (totalDenumR1 > 0) pdm = stat.getDenum() / totalDenumR1;
            }

            double divisor = (indicatorId.equals("REE") || indicatorId.equals("AUDIT")) ? 1.0 : 100.0;
            double tMin = target.getPointMin() / divisor;
            double tMax = target.getPointMax() / divisor;
            double bMin = target.getBonusMin() != null ? target.getBonusMin() / 100.0 : config.getBonusMin() / 100.0;
            double bMax = target.getBonusMax() != null ? target.getBonusMax() / 100.0 : config.getBonusMax() / 100.0;

            double bonus = 0.0;

            if (indicatorId.startsWith("PLP") || indicatorId.startsWith("Construction") || indicatorId.startsWith("Hotline") || indicatorId.startsWith("RANG2")) {
                if (resultat <= tMin) bonus = bMin * pdm;
                else if (resultat >= tMax) bonus = bMax * pdm;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * pdm * config.getFacteurG29();
            }
            else if (indicatorId.equals("SATCLI_OK") || indicatorId.equals("SATCLI_NOK") || indicatorId.equals("SAV_PERF")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax;
            }
            else if (indicatorId.equals("GEM_NOK")) {
                if (resultat <= tMin) bonus = bMin;
                else if (resultat >= tMax) bonus = bMax;
                else if (tMax != tMin) bonus = ((resultat - tMin) / (tMax - tMin)) * bMax * config.getFacteurG44();
            }
            else if (indicatorId.equals("SAV_SECURISATION") || indicatorId.equals("AUDIT") || indicatorId.equals("SAV_SATCLI") ||
                    indicatorId.equals("SAV_CCR") || indicatorId.equals("REE") || indicatorId.equals("SAV_TNH") ||
                    indicatorId.equals("PLAINTE") || indicatorId.equals("TNH") || indicatorId.equals("CADRAGE") || indicatorId.equals("INCOHERENCE_PTO")) {

                if (resultat >= tMin) bonus = bMin;
                else if (resultat <= tMax) bonus = bMax;
                else if (tMax != tMin) {
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