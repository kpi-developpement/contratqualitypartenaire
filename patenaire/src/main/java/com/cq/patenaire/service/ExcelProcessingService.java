package com.cq.patenaire.service;

import com.cq.patenaire.dto.IndicatorResult;
import com.cq.patenaire.dto.ReportResponse;
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
import java.util.HashMap;
import java.util.Map;

@Service
public class ExcelProcessingService {

    private static final String COL_ZONE_STATUT = "Zone_statut prise";
    private static final String COL_RANG_RDV = "RANG_RDV (copie)";
    private static final String COL_STATUT_CR = "GRP_STATUT_CRINSTALL_MNT";
    private static final String VAL_CR_OK = "CR_MNT_OK";

    public ReportResponse processFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename();
        ReportResponse response = new ReportResponse();

        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            processCsv(file, response);
        } else {
            processExcel(file, response);
        }

        calculateFinalResults(response);
        return response;
    }

    private void processCsv(MultipartFile file, ReportResponse response) throws Exception {
        // Configuration CSV : Accepte le point-virgule (standard Excel FR) ou la virgule
        CSVFormat format = CSVFormat.Builder.create()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setDelimiter(';') // Changer à ',' si vos CSV utilisent la virgule
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, format)) {

            Map<String, Integer> headerMap = csvParser.getHeaderMap();
            if (headerMap == null || !headerMap.containsKey(COL_ZONE_STATUT) ||
                    !headerMap.containsKey(COL_RANG_RDV) || !headerMap.containsKey(COL_STATUT_CR)) {

                // Fallback si le délimiteur était une virgule
                format = CSVFormat.Builder.create().setHeader().setSkipHeaderRecord(true).setDelimiter(',').setIgnoreHeaderCase(true).setTrim(true).build();
                try (BufferedReader reader2 = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
                     CSVParser csvParser2 = new CSVParser(reader2, format)) {

                    if (!csvParser2.getHeaderMap().containsKey(COL_ZONE_STATUT)) {
                        throw new RuntimeException("Colonnes manquantes dans le fichier CSV.");
                    }
                    for (CSVRecord record : csvParser2) {
                        extractAndComputeRow(record.get(COL_ZONE_STATUT), record.get(COL_RANG_RDV), record.get(COL_STATUT_CR), response);
                    }
                }
                return;
            }

            for (CSVRecord record : csvParser) {
                extractAndComputeRow(record.get(COL_ZONE_STATUT), record.get(COL_RANG_RDV), record.get(COL_STATUT_CR), response);
            }
        }
    }

    private void processExcel(MultipartFile file, ReportResponse response) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);

            if (headerRow == null) throw new RuntimeException("Le fichier Excel est vide.");

            Map<String, Integer> colIndices = new HashMap<>();
            for (Cell cell : headerRow) {
                colIndices.put(getCellValueAsString(cell).trim(), cell.getColumnIndex());
            }

            if (!colIndices.containsKey(COL_ZONE_STATUT) || !colIndices.containsKey(COL_RANG_RDV) || !colIndices.containsKey(COL_STATUT_CR)) {
                throw new RuntimeException("Colonnes manquantes dans le fichier Excel.");
            }

            int idxZoneStatut = colIndices.get(COL_ZONE_STATUT);
            int idxRangRdv = colIndices.get(COL_RANG_RDV);
            int idxStatutCr = colIndices.get(COL_STATUT_CR);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String zoneStatutRaw = getCellValueAsString(row.getCell(idxZoneStatut));
                String rangRdv = getCellValueAsString(row.getCell(idxRangRdv));
                String statutCr = getCellValueAsString(row.getCell(idxStatutCr));

                extractAndComputeRow(zoneStatutRaw, rangRdv, statutCr, response);
            }
        }
    }

    // L'Algorithme unifié (Business Logic)
    private void extractAndComputeRow(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, ReportResponse response) {
        if (zoneStatutRaw == null || zoneStatutRaw.trim().isEmpty()) return;

        String rangRdv = rangRdvRaw != null ? rangRdvRaw.trim() : "";
        String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";

        String[] parts = zoneStatutRaw.split("\\r?\\n");
        String activity = parts.length > 0 ? parts[0].trim() : "";
        String zoneRaw = parts.length > 1 ? parts[1].trim() : "";
        String zone = extractZoneLetter(zoneRaw);

        boolean isCrOk = statutCr.equalsIgnoreCase(VAL_CR_OK);
        boolean isRang1 = rangRdv.equals("1") || rangRdv.equals("1.0");

        if (isRang1) {
            if (response.getPerfRang1().containsKey(activity) && response.getPerfRang1().get(activity).containsKey(zone)) {
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

    private String extractZoneLetter(String zoneRaw) {
        if (zoneRaw.toUpperCase().contains("A")) return "A";
        if (zoneRaw.toUpperCase().contains("B")) return "B";
        if (zoneRaw.toUpperCase().contains("C")) return "C";
        return "UNKNOWN";
    }

    private void calculateFinalResults(ReportResponse response) {
        for (Map<String, IndicatorResult> zoneMap : response.getPerfRang1().values()) {
            for (IndicatorResult ind : zoneMap.values()) ind.calculateResult();
        }
        for (IndicatorResult ind : response.getPerfRang2().values()) {
            ind.calculateResult();
        }
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