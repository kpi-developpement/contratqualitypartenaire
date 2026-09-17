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

    public ExcelProcessingService(MonthlyReportRepository repository) {
        this.repository = repository;
    }

    // ==========================================
    // MÉTHODES DE TRAITEMENT
    // ==========================================

    public MonthlyReport getReportByPeriod(String period) {
        return repository.findById(period).orElse(new MonthlyReport(period));
    }

    private MonthlyReport getOrCreateReport(String period) {
        return repository.findById(period).orElseGet(() -> new MonthlyReport(period));
    }

    // ----- RACC METHODS -----
    public MonthlyReport processRangFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.initDefaults();
        processGenericFile(file, record -> {
            String zoneStatutRaw = record.get("zone_statut prise");
            String rangRdvRaw = record.get("rang_rdv (copie)");
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            String motfKoRaw = record.get("motf_ko_cr_inst_first_crinstall_mnt");
            extractAndComputeRowRang(zoneStatutRaw, rangRdvRaw, statutCrRaw, motfKoRaw, report);
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    public MonthlyReport processSatcliFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setSatcliOk(new IndicatorResult(0, 0, 0.0));
        report.setSatcliNok(new IndicatorResult(0, 0, 0.0));
        processGenericFile(file, record -> {
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            String valrNotGlblRaw = record.get("valr not glbl");
            extractAndComputeRowSatcli(statutCrRaw, valrNotGlblRaw, report);
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    public MonthlyReport processPlainteFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        if (report.getTnh() == null || report.getTnh().getDenum() == 0) throw new RuntimeException("Veuillez d'abord importer le fichier RANG/TNH.");
        report.setTauxPlainte(new IndicatorResult(0, report.getTnh().getDenum(), 0.0));
        processGenericFile(file, record -> {
            String volTicketRaw = record.get("volume ticket qualité");
            int volume = 0;
            try { if (volTicketRaw != null && !volTicketRaw.trim().isEmpty()) volume = (int) Double.parseDouble(volTicketRaw.trim()); } catch (Exception ignored) {}
            report.getTauxPlainte().setNum(report.getTauxPlainte().getNum() + volume);
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    public MonthlyReport processPtoFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setIncoherencePto(new IndicatorResult(0, 0, 0.0));
        processGenericFile(file, record -> {
            String valRaw = record.get("pto magouille");
            if (valRaw != null) {
                String val = valRaw.trim();
                if ("1".equals(val) || "1.0".equals(val)) {
                    report.getIncoherencePto().setDenum(report.getIncoherencePto().getDenum() + 1);
                    report.getIncoherencePto().setNum(report.getIncoherencePto().getNum() + 1);
                } else if ("0".equals(val) || "0.0".equals(val)) {
                    report.getIncoherencePto().setDenum(report.getIncoherencePto().getDenum() + 1);
                }
            }
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    public MonthlyReport processCadrageFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setCadrage(new IndicatorResult(0, 0, 0.0));
        processGenericFile(file, record -> {
            String valRaw = record.get("mal_cadree");
            if (valRaw != null) {
                String val = valRaw.trim();
                if ("1".equals(val) || "1.0".equals(val)) {
                    report.getCadrage().setDenum(report.getCadrage().getDenum() + 1);
                    report.getCadrage().setNum(report.getCadrage().getNum() + 1);
                } else if ("0".equals(val) || "0.0".equals(val)) {
                    report.getCadrage().setDenum(report.getCadrage().getDenum() + 1);
                }
            }
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    public MonthlyReport processGemNokFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setGemNok(new IndicatorResult(0, 0, 0.0));
        processGenericFile(file, record -> {
            String tvcRaw = record.get("tvc");
            String flgGemRaw = record.get("flg gem");
            String statutCrRaw = record.get("grp_statut_crinstall_mnt");
            if (statutCrRaw == null) statutCrRaw = record.get("grp statut crinstall mnt");

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
        });
        calculateFinalResults(report);
        return repository.save(report);
    }

    // ----- SAV METHODS -----
    public MonthlyReport processSavFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);

        // Reset SAV stats
        report.setSavSatcli(new IndicatorResult(0, 0, 0.0));
        report.setSavSecurisation(new IndicatorResult(0, 0, 0.0));
        report.setSavTnh(new IndicatorResult(0, 0, 0.0));
        report.setSavCcr(new IndicatorResult(0, 0, 0.0));
        report.setSavPerf(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {

            // Extraction flexible des colonnes (Excel met souvent des espaces ou caractères cachés)
            String noteSatcli = getFlexibleRecord(record, "note satcli ftth");
            String flagSecu = getFlexibleRecord(record, "flag_secu_interv_cq2024");
            String statutInterv = getFlexibleRecord(record, "statut intervention");
            String codCltrMain = getFlexibleRecord(record, "cod cltr main");
            String poidsCcr = getFlexibleRecord(record, "poids ccr"); // Substring check for [CONTRAT_QUALITE_2025] Poids CCR

            // 1. SATCLI SAV
            if (noteSatcli != null && !noteSatcli.trim().isEmpty()) {
                String note = noteSatcli.trim();
                if (Arrays.asList("1", "1.0", "2", "2.0", "3", "3.0", "4", "4.0", "5", "5.0").contains(note)) {
                    report.getSavSatcli().setDenum(report.getSavSatcli().getDenum() + 1);
                    if (Arrays.asList("1", "1.0", "2", "2.0").contains(note)) {
                        report.getSavSatcli().setNum(report.getSavSatcli().getNum() + 1);
                    }
                }
            }

            // 2. SECURISATION SAV
            if (flagSecu != null && !flagSecu.trim().isEmpty()) {
                String flag = flagSecu.trim();
                if (Arrays.asList("0", "0.0", "1", "1.0").contains(flag)) {
                    report.getSavSecurisation().setDenum(report.getSavSecurisation().getDenum() + 1);
                    if ("1".equals(flag) || "1.0".equals(flag)) {
                        report.getSavSecurisation().setNum(report.getSavSecurisation().getNum() + 1);
                    }
                }
            }

            // 3. TNH SAV & 5. PERF SAV (Both rely on Statut Intervention for Denum)
            if (statutInterv != null && !statutInterv.trim().isEmpty()) {
                String statut = statutInterv.trim();

                // TNH
                report.getSavTnh().setDenum(report.getSavTnh().getDenum() + 1);
                String cod = codCltrMain != null ? codCltrMain.trim().toUpperCase() : "";
                if ("INR2B".equals(cod) || "INR2C".equals(cod)) {
                    report.getSavTnh().setNum(report.getSavTnh().getNum() + 1);
                }

                // PERF
                report.getSavPerf().setDenum(report.getSavPerf().getDenum() + 1);
                if ("TERMINEE_OK".equalsIgnoreCase(statut)) {
                    report.getSavPerf().setNum(report.getSavPerf().getNum() + 1);
                }
            }

            // 4. CCR SAV
            if (poidsCcr != null && !poidsCcr.trim().isEmpty()) {
                String poids = poidsCcr.trim();
                if (Arrays.asList("0", "0.0", "3", "3.0").contains(poids)) {
                    report.getSavCcr().setDenum(report.getSavCcr().getDenum() + 1);
                    if ("0".equals(poids) || "0.0".equals(poids)) {
                        report.getSavCcr().setNum(report.getSavCcr().getNum() + 1);
                    }
                }
            }

        });

        calculateFinalResults(report);
        return repository.save(report);
    }

    // ==========================================
    // HELPERS LOGIC
    // ==========================================
    private String getFlexibleRecord(Map<String, String> recordMap, String keyword) {
        for (String key : recordMap.keySet()) {
            if (key.contains(keyword)) {
                return recordMap.get(key);
            }
        }
        return null;
    }

    private void extractAndComputeRowRang(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, String motfKoRaw, MonthlyReport report) {
        String motfKo = motfKoRaw != null ? motfKoRaw.trim() : "";
        report.getTnh().setDenum(report.getTnh().getDenum() + 1);

        if ("CR DELAI - Organisation installateur".equalsIgnoreCase(motfKo)) {
            report.getTnh().setNum(report.getTnh().getNum() + 1);
        }

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

        // SAV
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
    // GENERIC FILE PARSER (CSV / EXCEL)
    // ==========================================
    private interface RecordProcessor {
        void process(Map<String, String> recordMap);
    }

    private void processGenericFile(MultipartFile file, RecordProcessor processor) throws Exception {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            boolean success = tryParseCsv(file, processor, ';');
            if (!success && !tryParseCsv(file, processor, ',')) {
                throw new RuntimeException("Impossible de parser le CSV.");
            }
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
            for (Map.Entry<String, Integer> entry : headerMap.entrySet()) {
                cleanHeaderMap.put(cleanHeaderName(entry.getKey()), entry.getValue());
            }

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
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {
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
                for (String key : colIndices.keySet()) {
                    recordMap.put(key, getCellValueAsString(row.getCell(colIndices.get(key))));
                }
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