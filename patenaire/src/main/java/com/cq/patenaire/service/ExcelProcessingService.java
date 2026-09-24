package com.cq.patenaire.service;

import com.cq.patenaire.dto.IndicatorResult;
import com.cq.patenaire.entity.MonthlyReport;
import com.cq.patenaire.repository.MonthlyReportRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
public class ExcelProcessingService {

    private final MonthlyReportRepository repository;
    private final KyntusApiService kyntusApiService;

    public ExcelProcessingService(MonthlyReportRepository repository, KyntusApiService kyntusApiService) {
        this.repository = repository;
        this.kyntusApiService = kyntusApiService;
    }

    public List<MonthlyReport> getReportsByPeriod(String period) {
        List<MonthlyReport> reports = repository.findByPeriod(period);
        boolean hasGlobal = false;

        for (MonthlyReport r : reports) {
            // FIX : Convertir les anciens rapports sans partenaire en "GLOBAL"
            if (r.getPartenaire() == null || r.getPartenaire().trim().isEmpty()) {
                r.setPartenaire("GLOBAL");
            }
            if ("GLOBAL".equals(r.getPartenaire())) {
                hasGlobal = true;
            }
        }

        // S'il n'y a pas de rapport GLOBAL, on le crée
        if (!hasGlobal) {
            MonthlyReport global = new MonthlyReport(period, "GLOBAL");
            repository.save(global);
            reports.add(global);
        }
        return reports;
    }

    private Map<String, MonthlyReport> loadAllReportsForPeriod(String period) {
        List<MonthlyReport> list = repository.findByPeriod(period);
        Map<String, MonthlyReport> map = new HashMap<>();

        for (MonthlyReport r : list) {
            String part = (r.getPartenaire() == null || r.getPartenaire().trim().isEmpty()) ? "GLOBAL" : r.getPartenaire();
            r.setPartenaire(part); // Assure que c'est propre
            map.put(part, r);
        }

        if (!map.containsKey("GLOBAL")) {
            map.put("GLOBAL", new MonthlyReport(period, "GLOBAL"));
        }
        return map;
    }

    private List<MonthlyReport> saveAndReturn(Map<String, MonthlyReport> reports) {
        for (MonthlyReport r : reports.values()) {
            calculateFinalResults(r);
            repository.save(r);
        }
        return new ArrayList<>(reports.values());
    }

    // ==========================================
    // RACC
    // ==========================================
    public List<MonthlyReport> processRangFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) r.initDefaults();

        processGenericFile(file, record -> {
            String zoneStatutRaw = record.get("zone_statut prise");
            String rangRdvRaw = record.get("rang_rdv (copie)");
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            String motfKoRaw = record.get("motf_ko_cr_inst_first_crinstall_mnt");
            String partenaire = extractPartner(record, activePartners);

            // Toujours ajouter au GLOBAL (même si pas de partenaire)
            extractAndComputeRowRang(zoneStatutRaw, rangRdvRaw, statutCrRaw, motfKoRaw, reports.get("GLOBAL"));

            // Ajouter spécifiquement au partenaire s'il existe et est ACTIF
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> {
                    MonthlyReport r = new MonthlyReport(period, p);
                    r.initDefaults();
                    return r;
                });
                extractAndComputeRowRang(zoneStatutRaw, rangRdvRaw, statutCrRaw, motfKoRaw, pReport);
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processSatcliFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) {
            r.setSatcliOk(new IndicatorResult(0, 0, 0.0));
            r.setSatcliNok(new IndicatorResult(0, 0, 0.0));
        }

        processGenericFile(file, record -> {
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            String valrNotGlblRaw = record.get("valr not glbl");
            String partenaire = extractPartner(record, activePartners);

            extractAndComputeRowSatcli(statutCrRaw, valrNotGlblRaw, reports.get("GLOBAL"));
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getSatcliOk() == null) {
                    pReport.setSatcliOk(new IndicatorResult(0,0,0.0));
                    pReport.setSatcliNok(new IndicatorResult(0,0,0.0));
                }
                extractAndComputeRowSatcli(statutCrRaw, valrNotGlblRaw, pReport);
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processPlainteFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        if (reports.get("GLOBAL").getTnh() == null || reports.get("GLOBAL").getTnh().getDenum() == 0) {
            throw new RuntimeException("Veuillez d'abord importer le fichier RANG/TNH.");
        }

        for (MonthlyReport r : reports.values()) {
            int tnhDenum = r.getTnh() != null ? r.getTnh().getDenum() : 0;
            r.setTauxPlainte(new IndicatorResult(0, tnhDenum, 0.0));
        }

        processGenericFile(file, record -> {
            String volTicketRaw = record.get("volume ticket qualité");
            int volume = 0;
            try { if (volTicketRaw != null && !volTicketRaw.trim().isEmpty()) volume = (int) Double.parseDouble(volTicketRaw.trim()); } catch (Exception ignored) {}

            String partenaire = extractPartner(record, activePartners);
            reports.get("GLOBAL").getTauxPlainte().setNum(reports.get("GLOBAL").getTauxPlainte().getNum() + volume);

            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getTauxPlainte() == null) pReport.setTauxPlainte(new IndicatorResult(0, pReport.getTnh() != null ? pReport.getTnh().getDenum() : 0, 0.0));
                pReport.getTauxPlainte().setNum(pReport.getTauxPlainte().getNum() + volume);
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processPtoFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) r.setIncoherencePto(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String valRaw = record.get("pto magouille");
            String partenaire = extractPartner(record, activePartners);

            updatePtoCadrage(valRaw, reports.get("GLOBAL"), "PTO");
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getIncoherencePto() == null) pReport.setIncoherencePto(new IndicatorResult(0,0,0.0));
                updatePtoCadrage(valRaw, pReport, "PTO");
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processCadrageFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) r.setCadrage(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String valRaw = record.get("mal_cadree");
            String partenaire = extractPartner(record, activePartners);

            updatePtoCadrage(valRaw, reports.get("GLOBAL"), "CADRAGE");
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getCadrage() == null) pReport.setCadrage(new IndicatorResult(0,0,0.0));
                updatePtoCadrage(valRaw, pReport, "CADRAGE");
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processGemNokFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) r.setGemNok(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String tvcRaw = record.get("tvc");
            String flgGemRaw = record.get("flg gem");
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            if (statutCrRaw == null) statutCrRaw = record.get("grp statut crinstall mnt");
            String partenaire = extractPartner(record, activePartners);

            updateGemNok(tvcRaw, flgGemRaw, statutCrRaw, reports.get("GLOBAL"));
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getGemNok() == null) pReport.setGemNok(new IndicatorResult(0,0,0.0));
                updateGemNok(tvcRaw, flgGemRaw, statutCrRaw, pReport);
            }
        });
        return saveAndReturn(reports);
    }

    // ==========================================
    // SAV
    // ==========================================
    public List<MonthlyReport> processSavFile(MultipartFile file, String period) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();

        for (MonthlyReport r : reports.values()) {
            r.setSavSatcli(new IndicatorResult(0, 0, 0.0));
            r.setSavSecurisation(new IndicatorResult(0, 0, 0.0));
            r.setSavTnh(new IndicatorResult(0, 0, 0.0));
            r.setSavCcr(new IndicatorResult(0, 0, 0.0));
            r.setSavPerf(new IndicatorResult(0, 0, 0.0));
        }

        processGenericFile(file, record -> {
            String partenaire = extractPartner(record, activePartners);
            updateSavRow(record, reports.get("GLOBAL"));
            if (partenaire != null) {
                MonthlyReport pReport = reports.computeIfAbsent(partenaire, p -> new MonthlyReport(period, p));
                if (pReport.getSavPerf() == null) {
                    pReport.setSavSatcli(new IndicatorResult(0, 0, 0.0));
                    pReport.setSavSecurisation(new IndicatorResult(0, 0, 0.0));
                    pReport.setSavTnh(new IndicatorResult(0, 0, 0.0));
                    pReport.setSavCcr(new IndicatorResult(0, 0, 0.0));
                    pReport.setSavPerf(new IndicatorResult(0, 0, 0.0));
                }
                updateSavRow(record, pReport);
            }
        });
        return saveAndReturn(reports);
    }

    public List<MonthlyReport> processAuditFile(MultipartFile file, String period) throws Exception {
        return processPercentileFile(file, period, "AUDIT");
    }

    public List<MonthlyReport> processReeFile(MultipartFile file, String period) throws Exception {
        return processPercentileFile(file, period, "REE");
    }

    private List<MonthlyReport> processPercentileFile(MultipartFile file, String period, String type) throws Exception {
        Map<String, MonthlyReport> reports = loadAllReportsForPeriod(period);
        Map<String, String> activePartners = kyntusApiService.getActivePartners();
        Map<String, List<Double>> partnerValues = new HashMap<>();
        partnerValues.put("GLOBAL", new ArrayList<>());

        processGenericFile(file, record -> {
            String valStr = getFlexibleRecord(record, "percentile délai traitement mainteneur");
            String partenaire = extractPartner(record, activePartners);
            if (valStr != null && !valStr.trim().isEmpty()) {
                try {
                    double val = Double.parseDouble(valStr.trim().replace(",", "."));
                    partnerValues.get("GLOBAL").add(val);
                    if (partenaire != null) {
                        partnerValues.computeIfAbsent(partenaire, p -> new ArrayList<>()).add(val);
                    }
                } catch (NumberFormatException ignored) {}
            }
        });

        for (Map.Entry<String, List<Double>> entry : partnerValues.entrySet()) {
            MonthlyReport r = reports.computeIfAbsent(entry.getKey(), k -> new MonthlyReport(period, k));
            double percentile = calculate90thPercentile(entry.getValue());
            IndicatorResult result = new IndicatorResult(0, entry.getValue().size(), percentile);
            if ("AUDIT".equals(type)) r.setAudit(result);
            else r.setRee(result);
        }
        return saveAndReturn(reports);
    }

    // ==========================================
    // HELPERS EXTRACT
    // ==========================================
    private String extractPartner(Map<String, String> record, Map<String, String> activePartners) {
        String kyn = getFlexibleRecord(record, "kyn");
        if (kyn == null || kyn.trim().isEmpty()) kyn = getFlexibleRecord(record, "id_tecnow");
        return (kyn != null) ? activePartners.get(kyn.trim().toUpperCase()) : null;
    }

    private String getFlexibleRecord(Map<String, String> recordMap, String keyword) {
        for (String key : recordMap.keySet()) {
            if (key.contains(keyword)) return recordMap.get(key);
        }
        return null;
    }

    private void updatePtoCadrage(String valRaw, MonthlyReport report, String type) {
        IndicatorResult ind = "PTO".equals(type) ? report.getIncoherencePto() : report.getCadrage();
        if (valRaw != null) {
            String val = valRaw.trim();
            if ("1".equals(val) || "1.0".equals(val)) {
                ind.setDenum(ind.getDenum() + 1);
                ind.setNum(ind.getNum() + 1);
            } else if ("0".equals(val) || "0.0".equals(val)) {
                ind.setDenum(ind.getDenum() + 1);
            }
        }
    }

    private void updateGemNok(String tvcRaw, String flgGemRaw, String statutCrRaw, MonthlyReport report) {
        if (tvcRaw != null && flgGemRaw != null) {
            String tvc = tvcRaw.trim();
            String flgGem = flgGemRaw.trim();
            String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";
            if ("OUI".equalsIgnoreCase(tvc) && ("1".equals(flgGem) || "1.0".equals(flgGem))) {
                report.getGemNok().setDenum(report.getGemNok().getDenum() + 1);
                if ("CR_MNT_OK".equalsIgnoreCase(statutCr)) {
                    report.getGemNok().setNum(report.getGemNok().getNum() + 1);
                }
            }
        }
    }

    private void updateSavRow(Map<String, String> record, MonthlyReport report) {
        String noteSatcli = getFlexibleRecord(record, "note satcli ftth");
        String flagSecu = getFlexibleRecord(record, "flag_secu_interv_cq2024");
        String statutInterv = getFlexibleRecord(record, "statut intervention");
        String codCltrMain = getFlexibleRecord(record, "cod cltr main");
        String poidsCcr = getFlexibleRecord(record, "poids ccr");

        if (noteSatcli != null && !noteSatcli.trim().isEmpty()) {
            String note = noteSatcli.trim();
            if (Arrays.asList("1", "1.0", "2", "2.0", "3", "3.0", "4", "4.0", "5", "5.0").contains(note)) {
                report.getSavSatcli().setDenum(report.getSavSatcli().getDenum() + 1);
                if (Arrays.asList("1", "1.0", "2", "2.0").contains(note)) {
                    report.getSavSatcli().setNum(report.getSavSatcli().getNum() + 1);
                }
            }
        }
        if (flagSecu != null && !flagSecu.trim().isEmpty()) {
            String flag = flagSecu.trim();
            if (Arrays.asList("0", "0.0", "1", "1.0").contains(flag)) {
                report.getSavSecurisation().setDenum(report.getSavSecurisation().getDenum() + 1);
                if ("1".equals(flag) || "1.0".equals(flag)) {
                    report.getSavSecurisation().setNum(report.getSavSecurisation().getNum() + 1);
                }
            }
        }
        if (statutInterv != null && !statutInterv.trim().isEmpty()) {
            String statut = statutInterv.trim();
            report.getSavTnh().setDenum(report.getSavTnh().getDenum() + 1);
            String cod = codCltrMain != null ? codCltrMain.trim().toUpperCase() : "";
            if ("INR2B".equals(cod) || "INR2C".equals(cod)) report.getSavTnh().setNum(report.getSavTnh().getNum() + 1);

            report.getSavPerf().setDenum(report.getSavPerf().getDenum() + 1);
            if ("TERMINEE_OK".equalsIgnoreCase(statut)) report.getSavPerf().setNum(report.getSavPerf().getNum() + 1);
        }
        if (poidsCcr != null && !poidsCcr.trim().isEmpty()) {
            String poids = poidsCcr.trim();
            if (Arrays.asList("0", "0.0", "3", "3.0").contains(poids)) {
                report.getSavCcr().setDenum(report.getSavCcr().getDenum() + 1);
                if ("0".equals(poids) || "0.0".equals(poids)) report.getSavCcr().setNum(report.getSavCcr().getNum() + 1);
            }
        }
    }

    private void extractAndComputeRowRang(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, String motfKoRaw, MonthlyReport report) {
        String motfKo = motfKoRaw != null ? motfKoRaw.trim() : "";
        report.getTnh().setDenum(report.getTnh().getDenum() + 1);
        if ("CR DELAI - Organisation installateur".equalsIgnoreCase(motfKo)) report.getTnh().setNum(report.getTnh().getNum() + 1);
        if (zoneStatutRaw == null || zoneStatutRaw.trim().isEmpty()) return;

        String rangRdv = rangRdvRaw != null ? rangRdvRaw.trim() : "";
        String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";
        String[] parts = zoneStatutRaw.split("\\r?\\n");
        String activityRaw = parts.length > 0 ? parts[0].trim().toUpperCase() : "";

        String activity = "";
        if (activityRaw.contains("PLP")) activity = "PLP";
        else if (activityRaw.contains("CONSTRUCTION")) activity = "Construction";
        else if (activityRaw.contains("HOTLINE")) activity = "Hotline";

        String zone = extractZoneLetter(parts.length > 1 ? parts[1].trim() : "");
        boolean isCrOk = "CR_MNT_OK".equalsIgnoreCase(statutCr);
        boolean isRang1 = "1".equals(rangRdv) || "1.0".equals(rangRdv);

        if (isRang1) {
            if (!activity.isEmpty() && report.getPerfRang1().containsKey(activity) && report.getPerfRang1().get(activity).containsKey(zone)) {
                IndicatorResult ind = report.getPerfRang1().get(activity).get(zone);
                ind.setDenum(ind.getDenum() + 1);
                if (isCrOk) ind.setNum(ind.getNum() + 1);
            }
        } else {
            if (report.getPerfRang2().containsKey(zone)) {
                IndicatorResult ind = report.getPerfRang2().get(zone);
                ind.setDenum(ind.getDenum() + 1);
                if (isCrOk) ind.setNum(ind.getNum() + 1);
            }
        }
    }

    private void extractAndComputeRowSatcli(String statutCrRaw, String valrNotGlblRaw, MonthlyReport report) {
        String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";
        String valrNotGlbl = valrNotGlblRaw != null ? valrNotGlblRaw.trim() : "";

        if ("CR_MNT_OK".equalsIgnoreCase(statutCr)) {
            report.getSatcliOk().setDenum(report.getSatcliOk().getDenum() + 1);
            if ("5".equals(valrNotGlbl) || "5.0".equals(valrNotGlbl)) report.getSatcliOk().setNum(report.getSatcliOk().getNum() + 1);
        }

        if ("CR_MNT_NOK".equalsIgnoreCase(statutCr) || "CR_MNT_DELAI".equalsIgnoreCase(statutCr)) {
            report.getSatcliNok().setDenum(report.getSatcliNok().getDenum() + 1);
            if (Arrays.asList("4", "4.0", "5", "5.0").contains(valrNotGlbl)) report.getSatcliNok().setNum(report.getSatcliNok().getNum() + 1);
        }
    }

    private double calculate90thPercentile(List<Double> values) {
        if (values == null || values.isEmpty()) return 0.0;
        Collections.sort(values);
        int n = values.size();
        if (n == 1) return values.get(0);
        double index = 0.9 * (n - 1);
        int lower = (int) Math.floor(index);
        int upper = (int) Math.ceil(index);
        if (lower == upper) return values.get(lower);
        double weight = index - lower;
        return values.get(lower) + weight * (values.get(upper) - values.get(lower));
    }

    private void calculateFinalResults(MonthlyReport report) {
        if (report.getPerfRang1() != null) {
            for (Map<String, IndicatorResult> zoneMap : report.getPerfRang1().values()) {
                for (IndicatorResult ind : zoneMap.values()) ind.calculateResult();
            }
            for (IndicatorResult ind : report.getPerfRang2().values()) ind.calculateResult();
            if (report.getTnh() != null) report.getTnh().calculateResult();
        }

        if (report.getSatcliOk() != null) report.getSatcliOk().calculateResult();
        if (report.getSatcliNok() != null) report.getSatcliNok().calculateResult();
        if (report.getTauxPlainte() != null) report.getTauxPlainte().calculateResult();
        if (report.getIncoherencePto() != null) report.getIncoherencePto().calculateResult();
        if (report.getCadrage() != null) report.getCadrage().calculateResult();
        if (report.getGemNok() != null) report.getGemNok().calculateResult();

        if (report.getSavSatcli() != null) report.getSavSatcli().calculateResult();
        if (report.getSavSecurisation() != null) report.getSavSecurisation().calculateResult();
        if (report.getSavTnh() != null) report.getSavTnh().calculateResult();
        if (report.getSavCcr() != null) report.getSavCcr().calculateResult();
        if (report.getSavPerf() != null) report.getSavPerf().calculateResult();
    }

    private String extractZoneLetter(String zoneRaw) {
        String upperZone = zoneRaw.toUpperCase();
        if (upperZone.contains("A")) return "A";
        if (upperZone.contains("B")) return "B";
        if (upperZone.contains("C")) return "C";
        return "UNKNOWN";
    }

    // ==========================================
    // GENERIC FILE PARSER
    // ==========================================
    private interface RecordProcessor {
        void process(Map<String, String> recordMap);
    }

    private void processGenericFile(MultipartFile file, RecordProcessor processor) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            boolean success = tryParseCsv(file, processor, ';');
            if (!success && !tryParseCsv(file, processor, ',')) throw new RuntimeException("Impossible de parser le CSV.");
        } else {
            processExcel(file, processor);
        }
    }

    private boolean tryParseCsv(MultipartFile file, RecordProcessor processor, char delimiter) throws Exception {
        CSVFormat format = CSVFormat.Builder.create()
                .setHeader().setSkipHeaderRecord(true).setDelimiter(delimiter).setIgnoreHeaderCase(true).setTrim(true).build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, format)) {

            Map<String, Integer> headerMap = csvParser.getHeaderMap();
            if (headerMap == null || headerMap.size() <= 1 && delimiter == ';') return false;

            Map<String, Integer> cleanHeaderMap = new HashMap<>();
            for (Map.Entry<String, Integer> entry : headerMap.entrySet()) cleanHeaderMap.put(cleanHeaderName(entry.getKey()), entry.getValue());

            for (CSVRecord record : csvParser) {
                Map<String, String> recordMap = new HashMap<>();
                for (String key : cleanHeaderMap.keySet()) {
                    Integer idx = cleanHeaderMap.get(key);
                    recordMap.put(key, (idx != null && idx < record.size()) ? record.get(idx) : "");
                }
                processor.process(recordMap);
            }
            return true;
        }
    }

    private void processExcel(MultipartFile file, RecordProcessor processor) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new RuntimeException("Fichier vide.");

            Map<String, Integer> colIndices = new HashMap<>();
            for (Cell cell : headerRow) {
                String headerName = cleanHeaderName(getCellValueAsString(cell));
                if (!headerName.isEmpty()) colIndices.put(headerName, cell.getColumnIndex());
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, String> recordMap = new HashMap<>();
                for (String key : colIndices.keySet()) recordMap.put(key, getCellValueAsString(row.getCell(colIndices.get(key))));
                processor.process(recordMap);
            }
        }
    }

    private String cleanHeaderName(String header) {
        return header == null ? "" : header.replace("\uFEFF", "").replace("\"", "").trim().toLowerCase();
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC:
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) return String.valueOf((long) val);
                return String.valueOf(val);
            case BOOLEAN:
                return cell.getBooleanCellValue() ? "1" : "0";
            default: return "";
        }
    }
}