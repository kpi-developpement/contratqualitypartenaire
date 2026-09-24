package com.cq.patenaire.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class KyntusApiService {

    private static final String API_URL = "https://kyntus.fr/loadListeTICCQ.php";

    public Map<String, String> getActivePartners() {
        Map<String, String> map = new HashMap<>();
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map[] response = restTemplate.getForObject(API_URL, Map[].class);
            if (response != null) {
                for (Map<String, Object> item : response) {
                    String etat = (String) item.get("ETAT");
                    if ("ACTIF".equalsIgnoreCase(etat)) {
                        String kyn = (String) item.get("ID_TECNOW");
                        String entreprise = (String) item.get("ENTREPRISE");
                        if (kyn != null && !kyn.trim().isEmpty() && entreprise != null && !entreprise.trim().isEmpty()) {
                            map.put(kyn.trim().toUpperCase(), entreprise.trim());
                        }
                    }
                }
            }
            log.info("Récupération de {} partenaires ACTIFS depuis Kyntus API.", map.size());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'API Kyntus: {}", e.getMessage());
        }
        return map;
    }
}