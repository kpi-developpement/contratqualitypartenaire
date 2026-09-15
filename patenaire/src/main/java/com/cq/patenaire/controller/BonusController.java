package com.cq.patenaire.controller;

import com.cq.patenaire.dto.BonusConfigRequest;
import com.cq.patenaire.dto.BonusResultItem;
import com.cq.patenaire.service.BonusCalculationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/bonus")
@CrossOrigin(origins = "*")
public class BonusController {

    private final BonusCalculationService bonusCalculationService;

    @Autowired
    public BonusController(BonusCalculationService bonusCalculationService) {
        this.bonusCalculationService = bonusCalculationService;
    }

    @PostMapping("/calculate/{period}")
    public ResponseEntity<?> calculateBonus(
            @PathVariable String period,
            @RequestBody BonusConfigRequest configRequest) {

        log.info("Requête de calcul de bonus reçue pour la période : {}", period);

        if (period == null || period.trim().isEmpty() || configRequest == null || configRequest.getTargets() == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Période invalide ou configuration manquante.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            Map<String, BonusResultItem> result = bonusCalculationService.calculateBonus(period, configRequest);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur lors du calcul du bonus : {}", e.getMessage(), e);
            Map<String, String> err = new HashMap<>();
            err.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }
}