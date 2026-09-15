package com.cq.patenaire.service;

import com.cq.patenaire.dto.IndicatorResult;
import com.cq.patenaire.dto.ReportResponse;
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

    public ReportResponse processFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        log.info("Début du traitement du fichier : {}", filename);

        ReportResponse response = new ReportResponse();

        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            processCsv(file, response);
        } else {
            processExcel(file, response);
        }

        calculateFinalResults(response);
        log.info("Traitement terminé avec succès.");
        return response;
    }

    private void processCsv(MultipartFile file, ReportResponse response) throws Exception {
        boolean success = tryParseCsv(file, response, ';');
        if (!success) {
            boolean fallbackSuccess = tryParseCsv(file, response, ',');
            if (!fallbackSuccess) {
                throw new RuntimeException("Impossible de parser le CSV avec ';' ou ','. Vérifiez le format du fichier.");
            }
        }
    }

    private boolean tryParseCsv(MultipartFile file, ReportResponse response, char delimiter) throws Exception {
        CSVFormat format = CSVFormat.Builder.create()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setDelimiter(delimiter)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, format)) {

            Map<String, Integer> rawHeaderMap = csvParser.getHeaderMap();
            if (rawHeaderMap == null || rawHeaderMap.isEmpty()) {
                throw new RuntimeException("Le fichier CSV est vide ou n'a pas d'en-tête.");
            }

            Map<String, Integer> cleanHeaderMap = new HashMap<>();
            for (Map.Entry<String, Integer> entry : rawHeaderMap.entrySet()) {
                cleanHeaderMap.put(cleanHeaderName(entry.getKey()), entry.getValue());
            }

            if (cleanHeaderMap.size() <= 1 && delimiter == ';') return false;

            boolean hasRangColumns = cleanHeaderMap.containsKey(COL_RANG_RDV.toLowerCase()) && cleanHeaderMap.containsKey(COL_ZONE_STATUT.toLowerCase());
            boolean hasSatcliColumns = cleanHeaderMap.containsKey(COL_VALR_NOT_GLBL.toLowerCase());

            if (!hasRangColumns && !hasSatcliColumns) {
                throw new RuntimeException("Format de fichier non reconnu. Il manque les colonnes clés (RANG_RDV ou Valr Not Glbl).");
            }

            if (hasRangColumns) initRangResponse(response);
            if (hasSatcliColumns) initSatcliResponse(response);

            int rowCount = 0;
            for (CSVRecord record : csvParser) {
                String statutCr = getRecordValue(record, cleanHeaderMap, COL_STATUT_CR);

                if (hasRangColumns) {
                    String zoneStatutRaw = getRecordValue(record, cleanHeaderMap, COL_ZONE_STATUT);
                    String rangRdv = getRecordValue(record, cleanHeaderMap, COL_RANG_RDV);
                    String motfKo = getRecordValue(record, cleanHeaderMap, COL_MOTF_KO);
                    extractAndComputeRowRang(zoneStatutRaw, rangRdv, statutCr, motfKo, response);
                }

                if (hasSatcliColumns) {
                    String valrNotGlbl = getRecordValue(record, cleanHeaderMap, COL_VALR_NOT_GLBL);
                    extractAndComputeRowSatcli(statutCr, valrNotGlbl, response);
                }
                rowCount++;
            }
            log.info("CSV parsé avec succès. Lignes : {}", rowCount);
            return true;
        }
    }

    private void processExcel(MultipartFile file, ReportResponse response) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);

            if (headerRow == null) throw new RuntimeException("Le fichier Excel est vide ou n'a pas d'en-tête.");

            Map<String, Integer> colIndices = new HashMap<>();
            for (Cell cell : headerRow) {
                String headerName = cleanHeaderName(getCellValueAsString(cell));
                if (!headerName.isEmpty()) {
                    colIndices.put(headerName, cell.getColumnIndex());
                }
            }

            boolean hasRangColumns = colIndices.containsKey(COL_RANG_RDV.toLowerCase()) && colIndices.containsKey(COL_ZONE_STATUT.toLowerCase());
            boolean hasSatcliColumns = colIndices.containsKey(COL_VALR_NOT_GLBL.toLowerCase());

            if (!hasRangColumns && !hasSatcliColumns) {
                throw new RuntimeException("Format de fichier non reconnu. Il manque les colonnes clés.");
            }

            if (hasRangColumns) initRangResponse(response);
            if (hasSatcliColumns) initSatcliResponse(response);

            int rowCount = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String statutCr = getExcelValue(row, colIndices, COL_STATUT_CR);

                if (hasRangColumns) {
                    String zoneStatutRaw = getExcelValue(row, colIndices, COL_ZONE_STATUT);
                    String rangRdv = getExcelValue(row, colIndices, COL_RANG_RDV);
                    String motfKo = getExcelValue(row, colIndices, COL_MOTF_KO);
                    extractAndComputeRowRang(zoneStatutRaw, rangRdv, statutCr, motfKo, response);
                }

                if (hasSatcliColumns) {
                    String valrNotGlbl = getExcelValue(row, colIndices, COL_VALR_NOT_GLBL);
                    extractAndComputeRowSatcli(statutCr, valrNotGlbl, response);
                }
                rowCount++;
            }
            log.info("Excel parsé avec succès. Lignes : {}", rowCount);
        }
    }

    private void initRangResponse(ReportResponse response) {
        response.setPerfRang1(new HashMap<>());
        response.setPerfRang2(new HashMap<>());
        response.setTnh(new IndicatorResult(0, 0, 0.0));

        String[] activities = {"PLP", "Construction", "Hotline"};
        String[] zones = {"A", "B", "C"};

        for (String activity : activities) {
            Map<String, IndicatorResult> zoneMap = new HashMap<>();
            for (String zone : zones) {
                zoneMap.put(zone, new IndicatorResult(0, 0, 0.0));
            }
            response.getPerfRang1().put(activity, zoneMap);
        }
        for (String zone : zones) {
            response.getPerfRang2().put(zone, new IndicatorResult(0, 0, 0.0));
        }
    }

    private void initSatcliResponse(ReportResponse response) {
        response.setSatcliOk(new IndicatorResult(0, 0, 0.0));
        response.setSatcliNok(new IndicatorResult(0, 0, 0.0));
    }

    private void extractAndComputeRowRang(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, String motfKoRaw, ReportResponse response) {
        String motfKo = motfKoRaw != null ? motfKoRaw.trim() : "";
        response.getTnh().setDenum(response.getTnh().getDenum() + 1);

        if (VAL_MOTF_KO.equalsIgnoreCase(motfKo)) {
            response.getTnh().setNum(response.getTnh().getNum() + 1);
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
        boolean isRang1 = rangRdv.equals("1") || rangRdv.equals("1.0");

        if (isRang1) {
            if (!activity.isEmpty() && response.getPerfRang1().containsKey(activity) && response.getPerfRang1().get(activity).containsKey(zone)) {
                IndicatorResult ind = response.getPerfRang1().get(activity).get(zone);
                ind.setDenum(ind.getDenum() + 1);
                if (isCrOk) ind.setNum(ind.getNum() + 1);
            }
        } else {
            if (response.getPerfRang2().containsKey(zone)) {
                IndicatorResult ind = response.getPerfRang2().get(zone);
                ind.setDenum(ind.getDenum() + 1);
                if (isCrOk) ind.setNum(ind.getNum() + 1);
            }
        }
    }

    private void extractAndComputeRowSatcli(String statutCrRaw, String valrNotGlblRaw, ReportResponse response) {
        String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";
        String valrNotGlbl = valrNotGlblRaw != null ? valrNotGlblRaw.trim() : "";

        // SATCLI OK
        if (VAL_CR_OK.equalsIgnoreCase(statutCr)) {
            response.getSatcliOk().setDenum(response.getSatcliOk().getDenum() + 1);
            if ("5".equals(valrNotGlbl) || "5.0".equals(valrNotGlbl)) {
                response.getSatcliOk().setNum(response.getSatcliOk().getNum() + 1);
            }
        }

        // SATCLI NOK
        if (VAL_CR_NOK.equalsIgnoreCase(statutCr) || VAL_CR_DELAI.equalsIgnoreCase(statutCr)) {
            response.getSatcliNok().setDenum(response.getSatcliNok().getDenum() + 1);
            if ("4".equals(valrNotGlbl) || "4.0".equals(valrNotGlbl) || "5".equals(valrNotGlbl) || "5.0".equals(valrNotGlbl)) {
                response.getSatcliNok().setNum(response.getSatcliNok().getNum() + 1);
            }
        }
    }

    private void calculateFinalResults(ReportResponse response) {
        if (response.getPerfRang1() != null) {
            for (Map<String, IndicatorResult> zoneMap : response.getPerfRang1().values()) {
                for (IndicatorResult ind : zoneMap.values()) ind.calculateResult();
            }
            for (IndicatorResult ind : response.getPerfRang2().values()) ind.calculateResult();
            response.getTnh().calculateResult();
        }

        if (response.getSatcliOk() != null) {
            response.getSatcliOk().calculateResult();
            response.getSatcliNok().calculateResult();
        }
    }

    private String getRecordValue(CSVRecord record, Map<String, Integer> headerMap, String colName) {
        Integer idx = headerMap.get(colName.toLowerCase());
        return (idx != null && idx < record.size()) ? record.get(idx) : "";
    }

    private String getExcelValue(Row row, Map<String, Integer> colIndices, String colName) {
        Integer idx = colIndices.get(colName.toLowerCase());
        return idx != null ? getCellValueAsString(row.getCell(idx)) : "";
    }

    private String extractZoneLetter(String zoneRaw) {
        String upperZone = zoneRaw.toUpperCase();
        if (upperZone.contains("A")) return "A";
        if (upperZone.contains("B")) return "B";
        if (upperZone.contains("C")) return "C";
        return "UNKNOWN";
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
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            default: return "";
        }
    }
}