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
import java.util.*;

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
        // Essayer d'abord avec le point-virgule (Standard Excel FR)
        boolean success = tryParseCsv(file, response, ';');

        // Si ça échoue (souvent à cause d'une seule colonne détectée), essayer avec la virgule
        if (!success) {
            boolean fallbackSuccess = tryParseCsv(file, response, ',');
            if (!fallbackSuccess) {
                // Si les deux échouent, l'erreur a déjà été levée dans tryParseCsv avec les détails
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

            // Nettoyer les noms des colonnes (Enlever BOM, guillemets, espaces)
            Map<String, Integer> cleanHeaderMap = new HashMap<>();
            for (Map.Entry<String, Integer> entry : rawHeaderMap.entrySet()) {
                cleanHeaderMap.put(cleanHeaderName(entry.getKey()), entry.getValue());
            }

            // Si le délimiteur est mauvais, il va tout mettre dans une seule colonne
            if (cleanHeaderMap.size() <= 1 && delimiter == ';') {
                return false; // Forcer le fallback vers la virgule
            }

            // Vérifier les colonnes manquantes avec des détails précis
            validateHeaders(cleanHeaderMap.keySet());

            // Traitement des lignes
            for (CSVRecord record : csvParser) {
                // On utilise l'index pour récupérer la valeur car le nom de la colonne dans CSVRecord n'est pas nettoyé
                String zoneStatutRaw = record.get(cleanHeaderMap.get(COL_ZONE_STATUT.toLowerCase()));
                String rangRdv = record.get(cleanHeaderMap.get(COL_RANG_RDV.toLowerCase()));
                String statutCr = record.get(cleanHeaderMap.get(COL_STATUT_CR.toLowerCase()));

                extractAndComputeRow(zoneStatutRaw, rangRdv, statutCr, response);
            }
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

            // Vérifier les colonnes manquantes avec des détails précis
            validateHeaders(colIndices.keySet());

            int idxZoneStatut = colIndices.get(COL_ZONE_STATUT.toLowerCase());
            int idxRangRdv = colIndices.get(COL_RANG_RDV.toLowerCase());
            int idxStatutCr = colIndices.get(COL_STATUT_CR.toLowerCase());

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

    // --- MÉTHODES UTILITAIRES ET LOGIQUE MÉTIER ---

    private String cleanHeaderName(String header) {
        if (header == null) return "";
        // Enlever le BOM UTF-8 (\uFEFF), les guillemets, les espaces superflus, et mettre en minuscule
        return header.replace("\uFEFF", "")
                .replace("\"", "")
                .trim()
                .toLowerCase();
    }

    private void validateHeaders(Set<String> foundHeaders) {
        List<String> requiredHeaders = Arrays.asList(
                COL_ZONE_STATUT.toLowerCase(),
                COL_RANG_RDV.toLowerCase(),
                COL_STATUT_CR.toLowerCase()
        );

        List<String> missingHeaders = new ArrayList<>();
        for (String req : requiredHeaders) {
            if (!foundHeaders.contains(req)) {
                missingHeaders.add(req);
            }
        }

        if (!missingHeaders.isEmpty()) {
            // Construire un message d'erreur ultra précis
            String errorMsg = String.format(
                    "Colonnes manquantes : [%s]. Colonnes trouvées dans le fichier : [%s]",
                    String.join(", ", missingHeaders),
                    String.join(", ", foundHeaders)
            );
            throw new RuntimeException(errorMsg);
        }
    }

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