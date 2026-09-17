package com.cq.patenaire.entity;

import com.cq.patenaire.dto.IndicatorResult;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Data
@Entity
@Table(name = "monthly_reports")
public class MonthlyReport {

    @Id
    private String period;

    // ================= RACC =================
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Map<String, IndicatorResult>> perfRang1 = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, IndicatorResult> perfRang2 = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult tnh;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult satcliOk;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult satcliNok;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult tauxPlainte;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult incoherencePto;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult cadrage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult gemNok;

    // ================= SAV =================
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult savSatcli;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult savSecurisation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult savTnh;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult savCcr;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private IndicatorResult savPerf;

    public MonthlyReport() {}

    public MonthlyReport(String period) {
        this.period = period;
        initDefaults();
    }

    public void initDefaults() {
        String[] activities = {"PLP", "Construction", "Hotline"};
        String[] zones = {"A", "B", "C"};

        for (String activity : activities) {
            Map<String, IndicatorResult> zoneMap = new HashMap<>();
            for (String zone : zones) zoneMap.put(zone, new IndicatorResult(0, 0, 0.0));
            perfRang1.put(activity, zoneMap);
        }

        for (String zone : zones) perfRang2.put(zone, new IndicatorResult(0, 0, 0.0));

        this.tnh = new IndicatorResult(0, 0, 0.0);
        this.satcliOk = new IndicatorResult(0, 0, 0.0);
        this.satcliNok = new IndicatorResult(0, 0, 0.0);
        this.tauxPlainte = new IndicatorResult(0, 0, 0.0);
        this.incoherencePto = new IndicatorResult(0, 0, 0.0);
        this.cadrage = new IndicatorResult(0, 0, 0.0);
        this.gemNok = new IndicatorResult(0, 0, 0.0);

        this.savSatcli = new IndicatorResult(0, 0, 0.0);
        this.savSecurisation = new IndicatorResult(0, 0, 0.0);
        this.savTnh = new IndicatorResult(0, 0, 0.0);
        this.savCcr = new IndicatorResult(0, 0, 0.0);
        this.savPerf = new IndicatorResult(0, 0, 0.0);
    }
}