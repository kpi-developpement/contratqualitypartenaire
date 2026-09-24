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
import java.util.List;
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
    public ResponseEntity<List<MonthlyReport>> getReport(@PathVariable String period) {
        return ResponseEntity.ok(excelProcessingService.getReportsByPeriod(period));
    }

    @DeleteMapping("/report/{period}")
    public ResponseEntity<?> deleteReport(@PathVariable String period) {
        try {
            excelProcessingService.deleteReportsByPeriod(period);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Données supprimées avec succès pour " + period);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            log.error("Erreur lors de la suppression: {}", e.getMessage());
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/upload/rang")
    public ResponseEntity<?> uploadRangFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "RANG"); }

    @PostMapping("/upload/satcli")
    public ResponseEntity<?> uploadSatcliFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "SATCLI"); }

    @PostMapping("/upload/plainte")
    public ResponseEntity<?> uploadPlainteFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "PLAINTE"); }

    @PostMapping("/upload/pto")
    public ResponseEntity<?> uploadPtoFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "PTO"); }

    @PostMapping("/upload/cadrage")
    public ResponseEntity<?> uploadCadrageFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "CADRAGE"); }

    @PostMapping("/upload/gemnok")
    public ResponseEntity<?> uploadGemNokFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "GEM_NOK"); }

    @PostMapping("/upload/audit")
    public ResponseEntity<?> uploadAuditFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "AUDIT"); }

    @PostMapping("/upload/ree")
    public ResponseEntity<?> uploadReeFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "REE"); }

    @PostMapping("/upload/sav")
    public ResponseEntity<?> uploadSavFile(@RequestParam("file") MultipartFile file, @RequestParam("period") String period) { return handleUpload(file, period, "SAV"); }

    private ResponseEntity<?> handleUpload(MultipartFile file, String period, String type) {
        if (file.isEmpty() || period == null || period.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Fichier ou période invalide.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            List<MonthlyReport> result;
            if ("RANG".equals(type)) result = excelProcessingService.processRangFile(file, period);
            else if ("SATCLI".equals(type)) result = excelProcessingService.processSatcliFile(file, period);
            else if ("PLAINTE".equals(type)) result = excelProcessingService.processPlainteFile(file, period);
            else if ("PTO".equals(type)) result = excelProcessingService.processPtoFile(file, period);
            else if ("GEM_NOK".equals(type)) result = excelProcessingService.processGemNokFile(file, period);
            else if ("AUDIT".equals(type)) result = excelProcessingService.processAuditFile(file, period);
            else if ("REE".equals(type)) result = excelProcessingService.processReeFile(file, period);
            else if ("SAV".equals(type)) result = excelProcessingService.processSavFile(file, period);
            else result = excelProcessingService.processCadrageFile(file, period);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur (Type: {}) : {}", type, e.getMessage(), e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}