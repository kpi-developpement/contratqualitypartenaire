package com.cq.patenaire.controller;

import com.cq.patenaire.dto.ReportResponse;
import com.cq.patenaire.service.ExcelProcessingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/excel")
@CrossOrigin(origins = "*")
public class ExcelController {

    private final ExcelProcessingService excelProcessingService;

    @Autowired
    public ExcelController(ExcelProcessingService excelProcessingService) {
        this.excelProcessingService = excelProcessingService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadExcelFile(@RequestParam("file") MultipartFile file) {
        log.info("Requête reçue sur /api/v1/excel/upload");

        if (file.isEmpty()) {
            log.warn("Le fichier reçu est vide.");
            Map<String, String> error = new HashMap<>();
            error.put("message", "Le fichier est vide.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            ReportResponse result = excelProcessingService.processFile(file);
            log.info("Fichier traité avec succès. Renvoi de la réponse JSON.");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur lors du traitement : {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}