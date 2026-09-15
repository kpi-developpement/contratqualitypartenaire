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

    // Constantes RANG / TNH
    private static final String COL_ZONE_STATUT = "Zone_statut prise";
    private static final String COL_RANG_RDV = "RANG_RDV (copie)";
    private static final String COL_STATUT_CR = "GRP_STATUT_CRINSTALL_MNT";
    private static final String VAL_CR_OK = "CR_MNT_OK";
    private static final String COL_MOTF_KO = "MOTF_KO_CR_INST_FIRST_CRINSTALL_MNT";
    private static final String VAL_MOTF_KO = "CR DELAI - Organisation installateur";

    // Constantes SATCLI
    private static final String COL_VALR_NOT_GLBL = "Valr Not Glbl";
    private static final String VAL_CR_NOK = "CR_MNT_NOK";
    private static final String VAL_CR_DELAI = "CR_MNT_DELAI";

    // Constantes TAUX DE PLAINTE
    private static final String COL_VOL_TICKET = "Volume ticket qualité";

    // Constantes PTO / CADRAGE
    private static final String COL_PTO_MAGOUILLE = "PTO magouille";
    private static final String COL_MAL_CADREE = "MAL_CADREE";

    // Constantes GEM NOK
    private static final String COL_TVC = "TVC";
    private static final String COL_FLG_GEM = "Flg Gem";

    public MonthlyReport getReportByPeriod(String period) {
        return repository.findById(period).orElse(new MonthlyReport(period));
    }

    private MonthlyReport getOrCreateReport(String period) {
        return repository.findById(period).orElseGet(() -> new MonthlyReport(period));
    }

    // ==========================================
    // PROCESS RANG (Rang 1, Rang 2, TNH)
    // ==========================================
    public MonthlyReport processRangFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.initDefaults(); // Reset existing rang data if re-uploading

        processGenericFile(file, record -> {
            String zoneStatutRaw = record.get(COL_ZONE_STATUT.toLowerCase());
            String rangRdvRaw = record.get(COL_RANG_RDV.toLowerCase());
            String statutCrRaw = record.get(COL_STATUT_CR.toLowerCase());
            String motfKoRaw = record.get(COL_MOTF_KO.toLowerCase());

            extractAndComputeRowRang(zoneStatutRaw, rangRdvRaw, statutCrRaw, motfKoRaw, report);
        });

        calculateFinalResults(report);
        return repository.save(report);
    }

    // ==========================================
    // PROCESS SATCLI (Satcli OK & NOK)
    // ==========================================
    public MonthlyReport processSatcliFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setSatcliOk(new IndicatorResult(0, 0, 0.0));
        report.setSatcliNok(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String statutCrRaw = record.get(COL_STATUT_CR.toLowerCase());
            String valrNotGlblRaw = record.get(COL_VALR_NOT_GLBL.toLowerCase());

            extractAndComputeRowSatcli(statutCrRaw, valrNotGlblRaw, report);
        });

        calculateFinalResults(report);
        return repository.save(report);
    }

    // ==========================================
    // PROCESS TAUX DE PLAINTE
    // ==========================================
    public MonthlyReport processPlainteFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);

        if (report.getTnh() == null || report.getTnh().getDenum() == 0) {
            throw new RuntimeException("Veuillez d'abord importer le fichier RANG/TNH pour la période " + period + " afin d'avoir le dénominateur.");
        }

        report.setTauxPlainte(new IndicatorResult(0, report.getTnh().getDenum(), 0.0));

        processGenericFile(file, record -> {
            String volTicketRaw = record.get(COL_VOL_TICKET.toLowerCase());
            int volume = 0;
            try {
                if (volTicketRaw != null && !volTicketRaw.trim().isEmpty()) {
                    volume = (int) Double.parseDouble(volTicketRaw.trim());
                }
            } catch (Exception ignored) {}

            report.getTauxPlainte().setNum(report.getTauxPlainte().getNum() + volume);
        });

        calculateFinalResults(report);
        return repository.save(report);
    }

    // ==========================================
    // PROCESS INCOHERENCE PTO
    // ==========================================
    public MonthlyReport processPtoFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setIncoherencePto(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String valRaw = record.get(COL_PTO_MAGOUILLE.toLowerCase());
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

    // ==========================================
    // PROCESS CADRAGE
    // ==========================================
    public MonthlyReport processCadrageFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setCadrage(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String valRaw = record.get(COL_MAL_CADREE.toLowerCase());
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

    // ==========================================
    // PROCESS GEM NOK
    // ==========================================
    public MonthlyReport processGemNokFile(MultipartFile file, String period) throws Exception {
        MonthlyReport report = getOrCreateReport(period);
        report.setGemNok(new IndicatorResult(0, 0, 0.0));

        processGenericFile(file, record -> {
            String tvcRaw = record.get(COL_TVC.toLowerCase());
            String flgGemRaw = record.get(COL_FLG_GEM.toLowerCase());

            // Fallback: Au cas où le fichier utilise "Grp Statut Crinstall Mnt" avec des espaces au lieu des underscores
            String statutCrRaw = record.get(COL_STATUT_CR.toLowerCase());
            if (statutCrRaw == null) {
                statutCrRaw = record.get("grp statut crinstall mnt");
            }

            if (tvcRaw != null && flgGemRaw != null) {
                String tvc = tvcRaw.trim();
                String flgGem = flgGemRaw.trim();
                String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";

                // DENUM = TVC "OUI" et Flg Gem "1"
                if ("OUI".equalsIgnoreCase(tvc) && ("1".equals(flgGem) || "1.0".equals(flgGem))) {
                    report.getGemNok().setDenum(report.getGemNok().getDenum() + 1);

                    // NUM = DENUM + CR_MNT_OK
                    if (VAL_CR_OK.equalsIgnoreCase(statutCr)) {
                        report.getGemNok().setNum(report.getGemNok().getNum() + 1);
                    }
                }
            }
        });

        calculateFinalResults(report);
        return repository.save(report);
    }

    // ==========================================
    // HELPERS EXTRACTION LOGIC
    // ==========================================
    private void extractAndComputeRowRang(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, String motfKoRaw, MonthlyReport report) {
        String motfKo = motfKoRaw != null ? motfKoRaw.trim() : "";
        report.getTnh().setDenum(report.getTnh().getDenum() + 1);

        if (VAL_MOTF_KO.equalsIgnoreCase(motfKo)) {
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
        boolean isCrOk = statutCr.equalsIgnoreCase(VAL_CR_OK);
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

        if (VAL_CR_OK.equalsIgnoreCase(statutCr)) {
            report.getSatcliOk().setDenum(report.getSatcliOk().getDenum() + 1);
            if ("5".equals(valrNotGlbl) || "5.0".equals(valrNotGlbl)) {
                report.getSatcliOk().setNum(report.getSatcliOk().getNum() + 1);
            }
        }

        if (VAL_CR_NOK.equalsIgnoreCase(statutCr) || VAL_CR_DELAI.equalsIgnoreCase(statutCr)) {
            report.getSatcliNok().setDenum(report.getSatcliNok().getDenum() + 1);
            if ("4".equals(valrNotGlbl) || "4.0".equals(valrNotGlbl) || "5".equals(valrNotGlbl) || "5.0".equals(valrNotGlbl)) {
                report.getSatcliNok().setNum(report.getSatcliNok().getNum() + 1);
            }
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