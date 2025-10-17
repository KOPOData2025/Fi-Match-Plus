package com.fimatchplus.backend.backtest.domain;

import com.fimatchplus.backend.backtest.dto.BacktestStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "backtests")
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Backtest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 30)
    private String description;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "rule_id", length = 30)
    private String ruleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BacktestStatus status = BacktestStatus.CREATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", length = 20)
    private ResultStatus resultStatus;

    @Column(name = "benchmark_code", length = 20)
    private String benchmarkCode;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;


    public Backtest(Long portfolioId, String title, String description, 
                    LocalDateTime startAt, LocalDateTime endAt, String ruleId) {
        this.portfolioId = portfolioId;
        this.title = title;
        this.description = description;
        this.startAt = startAt;
        this.endAt = endAt;
        this.ruleId = ruleId;
    }

    public static Backtest create(
            Long portfolioId,
            String title,
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String ruleId
    ) {
        return new Backtest(portfolioId, title, description, startAt, endAt, ruleId);
    }

    public static Backtest create(
            Long portfolioId,
            String title,
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {
        return new Backtest(portfolioId, title, description, startAt, endAt, null);
    }

    public void updateRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public void updateStatus(BacktestStatus status) {
        this.status = status;
    }

    public void updateResultStatus(ResultStatus resultStatus) {
        this.resultStatus = resultStatus;
    }

    public void setBenchmarkCode(String benchmarkCode) {
        this.benchmarkCode = benchmarkCode;
    }

    public void updateBasicInfo(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public void updatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
