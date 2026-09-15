package com.cq.patenaire.controller;

import com.cq.patenaire.entity.MonthlyReport;
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

    @GetMapping("/report/{period}")
    public ResponseEntity<MonthlyReport> getReport(@PathVariable String period) {
        return ResponseEntity.ok(excelProcessingService.getReportByPeriod(period));
    }

    @PostMapping("/upload/rang")
    public ResponseEntity<?> uploadRangFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) {
        return handleUpload(file, period, "RANG");
    }

    @PostMapping("/upload/satcli")
    public ResponseEntity<?> uploadSatcliFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) {
        return handleUpload(file, period, "SATCLI");
    }

    @PostMapping("/upload/plainte")
    public ResponseEntity<?> uploadPlainteFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) {
        return handleUpload(file, period, "PLAINTE");
    }

    private ResponseEntity<?> handleUpload(MultipartFile file, String period, String type) {
        if (file.isEmpty() || period == null || period.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Fichier ou période invalide.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            MonthlyReport result;
            if ("RANG".equals(type)) {
                result = excelProcessingService.processRangFile(file, period);
            } else if ("SATCLI".equals(type)) {
                result = excelProcessingService.processSatcliFile(file, period);
            } else {
                result = excelProcessingService.processPlainteFile(file, period);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur (Type: {}) : {}", type, e.getMessage(), e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}