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

    private static final String COL_ZONE_STATUT = "Zone_statut prise";
    private static final String COL_RANG_RDV = "RANG_RDV (copie)";
    private static final String COL_STATUT_CR = "GRP_STATUT_CRINSTALL_MNT";
    private static final String VAL_CR_OK = "CR_MNT_OK";

    // NOUVEAU: Constantes pour l'indicateur TNH
    private static final String COL_MOTF_KO = "MOTF_KO_CR_INST_FIRST_CRINSTALL_MNT";
    private static final String VAL_MOTF_KO = "CR DELAI - Organisation installateur";

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
        log.info("Tentative de parsing CSV avec délimiteur ';'");
        boolean success = tryParseCsv(file, response, ';');

        if (!success) {
            log.warn("Échec avec ';'. Tentative de parsing CSV avec délimiteur ','");
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

            if (cleanHeaderMap.size() <= 1 && delimiter == ';') {
                return false;
            }

            validateHeaders(cleanHeaderMap.keySet());

            int rowCount = 0;
            for (CSVRecord record : csvParser) {
                String zoneStatutRaw = record.get(cleanHeaderMap.get(COL_ZONE_STATUT.toLowerCase()));
                String rangRdv = record.get(cleanHeaderMap.get(COL_RANG_RDV.toLowerCase()));
                String statutCr = record.get(cleanHeaderMap.get(COL_STATUT_CR.toLowerCase()));
                String motfKo = record.get(cleanHeaderMap.get(COL_MOTF_KO.toLowerCase()));

                extractAndComputeRow(zoneStatutRaw, rangRdv, statutCr, motfKo, response);
                rowCount++;
            }
            log.info("CSV parsé avec succès. Nombre de lignes traitées : {}", rowCount);
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

            validateHeaders(colIndices.keySet());

            int idxZoneStatut = colIndices.get(COL_ZONE_STATUT.toLowerCase());
            int idxRangRdv = colIndices.get(COL_RANG_RDV.toLowerCase());
            int idxStatutCr = colIndices.get(COL_STATUT_CR.toLowerCase());
            int idxMotfKo = colIndices.get(COL_MOTF_KO.toLowerCase());

            int rowCount = 0;
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String zoneStatutRaw = getCellValueAsString(row.getCell(idxZoneStatut));
                String rangRdv = getCellValueAsString(row.getCell(idxRangRdv));
                String statutCr = getCellValueAsString(row.getCell(idxStatutCr));
                String motfKo = getCellValueAsString(row.getCell(idxMotfKo));

                extractAndComputeRow(zoneStatutRaw, rangRdv, statutCr, motfKo, response);
                rowCount++;
            }
            log.info("Excel parsé avec succès. Nombre de lignes traitées : {}", rowCount);
        }
    }

    private String cleanHeaderName(String header) {
        if (header == null) return "";
        return header.replace("\uFEFF", "").replace("\"", "").trim().toLowerCase();
    }

    private void validateHeaders(Set<String> foundHeaders) {
        List<String> requiredHeaders = Arrays.asList(
                COL_ZONE_STATUT.toLowerCase(),
                COL_RANG_RDV.toLowerCase(),
                COL_STATUT_CR.toLowerCase(),
                COL_MOTF_KO.toLowerCase()
        );

        List<String> missingHeaders = new ArrayList<>();
        for (String req : requiredHeaders) {
            if (!foundHeaders.contains(req)) {
                missingHeaders.add(req);
            }
        }

        if (!missingHeaders.isEmpty()) {
            String errorMsg = String.format("Colonnes manquantes : [%s]. Colonnes trouvées : [%s]",
                    String.join(", ", missingHeaders), String.join(", ", foundHeaders));
            log.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
    }

    private void extractAndComputeRow(String zoneStatutRaw, String rangRdvRaw, String statutCrRaw, String motfKoRaw, ReportResponse response) {

        // 1. Logique TNH (Toutes les lignes comptent pour le Denum)
        String motfKo = motfKoRaw != null ? motfKoRaw.trim() : "";
        response.getTnh().setDenum(response.getTnh().getDenum() + 1);
        if (VAL_MOTF_KO.equalsIgnoreCase(motfKo)) {
            response.getTnh().setNum(response.getTnh().getNum() + 1);
        }

        // Si la Zone est vide, on s'arrête ici pour les rangs (mais on a déjà compté pour TNH)
        if (zoneStatutRaw == null || zoneStatutRaw.trim().isEmpty()) return;

        String rangRdv = rangRdvRaw != null ? rangRdvRaw.trim() : "";
        String statutCr = statutCrRaw != null ? statutCrRaw.trim() : "";

        String[] parts = zoneStatutRaw.split("\\r?\\n");
        String activityRaw = parts.length > 0 ? parts[0].trim().toUpperCase() : "";

        String activity = "";
        if (activityRaw.contains("PLP")) activity = "PLP";
        else if (activityRaw.contains("CONSTRUCTION")) activity = "Construction";
        else if (activityRaw.contains("HOTLINE")) activity = "Hotline";

        String zoneRaw = parts.length > 1 ? parts[1].trim() : "";
        String zone = extractZoneLetter(zoneRaw);

        boolean isCrOk = statutCr.equalsIgnoreCase(VAL_CR_OK);
        boolean isRang1 = rangRdv.equals("1") || rangRdv.equals("1.0");

        // 2. Logique PERF RANG 1 et RANG 2
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

    private String extractZoneLetter(String zoneRaw) {
        String upperZone = zoneRaw.toUpperCase();
        if (upperZone.contains("A")) return "A";
        if (upperZone.contains("B")) return "B";
        if (upperZone.contains("C")) return "C";
        return "UNKNOWN";
    }

    private void calculateFinalResults(ReportResponse response) {
        for (Map<String, IndicatorResult> zoneMap : response.getPerfRang1().values()) {
            for (IndicatorResult ind : zoneMap.values()) ind.calculateResult();
        }
        for (IndicatorResult ind : response.getPerfRang2().values()) {
            ind.calculateResult();
        }
        // Calcul du TNH
        response.getTnh().calculateResult();
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