package com.cq.patenaire.repository;

import com.cq.patenaire.entity.MonthlyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonthlyReportRepository extends JpaRepository<MonthlyReport, String> {
    List<MonthlyReport> findByPeriod(String period);
}