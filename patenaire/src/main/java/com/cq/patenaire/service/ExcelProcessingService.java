package com.cq.patenaire.service;

import com.cq.patenaire.dto.IndicatorResult;
import com.cq.patenaire.dto.ReportResponse;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
public class ExcelProcessingService {

    private static final String COL_ZONE_STATUT = "Zone_statut prise";
    private static final String COL_RANG_RDV = "RANG_RDV (copie)";
    private static final String COL_STATUT_CR = "GRP_STATUT_CRINSTALL_MNT";
    private static final String VAL_CR_OK = "CR_MNT_OK";

    public ReportResponse processExcelFile(MultipartFile file) throws Exception {
        ReportResponse response = new ReportResponse();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0); // Prendre la première feuille
            Row headerRow = sheet.getRow(0);

            if (headerRow == null) {
                throw new RuntimeException("Le fichier Excel est vide ou n'a pas d'en-tête.");
            }

            // 1. Trouver les index des colonnes dynamiquement
            Map<String, Integer> colIndices = new HashMap<>();
            for (Cell cell : headerRow) {
                String headerName = getCellValueAsString(cell).trim();
                colIndices.put(headerName, cell.getColumnIndex());
            }

            // Vérifier si les colonnes requises existent
            if (!colIndices.containsKey(COL_ZONE_STATUT) ||
                    !colIndices.containsKey(COL_RANG_RDV) ||
                    !colIndices.containsKey(COL_STATUT_CR)) {
                throw new RuntimeException("Colonnes manquantes dans le fichier Excel. Vérifiez les noms des colonnes.");
            }

            int idxZoneStatut = colIndices.get(COL_ZONE_STATUT);
            int idxRangRdv = colIndices.get(COL_RANG_RDV);
            int idxStatutCr = colIndices.get(COL_STATUT_CR);

            // 2. Parcourir les lignes (ignorer l'en-tête)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String zoneStatutRaw = getCellValueAsString(row.getCell(idxZoneStatut));
                String rangRdv = getCellValueAsString(row.getCell(idxRangRdv)).trim();
                String statutCr = getCellValueAsString(row.getCell(idxStatutCr)).trim();

                if (zoneStatutRaw.isEmpty()) continue;

                // 3. Extraire l'Activité et la Zone (Split par saut de ligne \n ou \r\n)
                String[] parts = zoneStatutRaw.split("\\r?\\n");
                String activity = parts.length > 0 ? parts[0].trim() : "";
                String zoneRaw = parts.length > 1 ? parts[1].trim() : "";

                // Nettoyer la zone pour garder juste "A", "B", ou "C" (ex: "ZONE A" -> "A")
                String zone = extractZoneLetter(zoneRaw);

                boolean isCrOk = statutCr.equalsIgnoreCase(VAL_CR_OK);
                boolean isRang1 = rangRdv.equals("1") || rangRdv.equals("1.0"); // Gérer le format numérique Excel

                // 4. Mettre à jour les compteurs
                if (isRang1) {
                    // Logique PERF RANG 1
                    if (response.getPerfRang1().containsKey(activity) && response.getPerfRang1().get(activity).containsKey(zone)) {
                        IndicatorResult ind = response.getPerfRang1().get(activity).get(zone);
                        ind.setDenum(ind.getDenum() + 1);
                        if (isCrOk) {
                            ind.setNum(ind.getNum() + 1);
                        }
                    }
                } else {
                    // Logique PERF RANG 2 (On ignore l'activité, on se base juste sur la zone)
                    if (response.getPerfRang2().containsKey(zone)) {
                        IndicatorResult ind = response.getPerfRang2().get(zone);
                        ind.setDenum(ind.getDenum() + 1);
                        if (isCrOk) {
                            ind.setNum(ind.getNum() + 1);
                        }
                    }
                }
            }

            // 5. Calculer les résultats finaux (num / denum)
            calculateFinalResults(response);

        }
        return response;
    }

    private String extractZoneLetter(String zoneRaw) {
        if (zoneRaw.toUpperCase().contains("A")) return "A";
        if (zoneRaw.toUpperCase().contains("B")) return "B";
        if (zoneRaw.toUpperCase().contains("C")) return "C";
        return "UNKNOWN";
    }

    private void calculateFinalResults(ReportResponse response) {
        // Calcul Rang 1
        for (Map<String, IndicatorResult> zoneMap : response.getPerfRang1().values()) {
            for (IndicatorResult ind : zoneMap.values()) {
                ind.calculateResult();
            }
        }
        // Calcul Rang 2
        for (IndicatorResult ind : response.getPerfRang2().values()) {
            ind.calculateResult();
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // Si c'est un entier, on enlève le .0
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    return String.valueOf((long) val);
                }
                return String.valueOf(val);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}