package com.fimatchplus.backend.portfolio.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fimatchplus.backend.portfolio.domain.Portfolio;
import com.fimatchplus.backend.portfolio.dto.PortfolioAnalysisResponse;
import com.fimatchplus.backend.portfolio.event.PortfolioAnalysisSuccessEvent;
import com.fimatchplus.backend.portfolio.event.PortfolioAnalysisFailureEvent;
import com.fimatchplus.backend.portfolio.event.PortfolioCreatedEvent;
import com.fimatchplus.backend.ai.service.PortfolioReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.concurrent.CompletableFuture;

import static org.springframework.transaction.annotation.Propagation.REQUIRES_NEW;

/**
 * 포트폴리오 분석 결과 처리 서비스
 * 포트폴리오 최적화 분석 결과를 받아서 처리하고 리포트 생성
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioAnalysisService {

    private final PortfolioReportService portfolioReportService;
    private final PortfolioCommandService portfolioCommandService;
    private final ObjectMapper objectMapper;
    private final PortfolioAnalysisEngineClient portfolioAnalysisEngineClient;

    /**
     * 포트폴리오 생성 완료 이벤트 처리 (트랜잭션 커밋 후 실행)
     */
    @Async("backgroundTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handlePortfolioCreated(PortfolioCreatedEvent event) {
        Long portfolioId = event.getPortfolioId();
        log.info("Starting portfolio analysis for portfolioId: {}", portfolioId);

        try {
            portfolioCommandService.updatePortfolioStatus(portfolioId, Portfolio.PortfolioStatus.RUNNING);
            portfolioAnalysisEngineClient.submitToPortfolioAnalysisEngineAsync(portfolioId);

        } catch (Exception e) {
            log.error("Failed to start portfolio analysis for portfolioId: {}", portfolioId, e);
            portfolioCommandService.updatePortfolioStatus(portfolioId, Portfolio.PortfolioStatus.FAILED);
        }
    }

    /**
     * 포트폴리오 분석 수동 실행
     */
    @Transactional
    public void startPortfolioAnalysis(Long portfolioId) {
        log.info("Manually starting portfolio analysis for portfolioId: {}", portfolioId);
        portfolioCommandService.updatePortfolioStatus(portfolioId, Portfolio.PortfolioStatus.RUNNING);
        portfolioAnalysisEngineClient.submitToPortfolioAnalysisEngineAsync(portfolioId);
    }

    /**
     * 포트폴리오 분석 성공 이벤트 처리
     */
    @EventListener
    @Async("backgroundTaskExecutor")
    @Transactional(propagation = REQUIRES_NEW)
    public CompletableFuture<Void> handlePortfolioAnalysisSuccess(PortfolioAnalysisSuccessEvent event) {
        log.info("Processing portfolio analysis success - portfolioId: {}", 
                event.getPortfolioId());
        
        try {
            PortfolioAnalysisResponse analysisResponse = event.getAnalysisResponse();
            logAnalysisResult(analysisResponse);
            
            String analysisResultJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(analysisResponse);
            
            savePortfolioAnalysisResult(event.getPortfolioId(), analysisResultJson);
            generatePortfolioAnalysisReport(event.getPortfolioId(), analysisResultJson);
            
            log.info("Portfolio analysis processing completed - portfolioId: {}", 
                    event.getPortfolioId());
            
        } catch (Exception e) {
            log.error("Failed to process portfolio analysis success - portfolioId: {}", 
                    event.getPortfolioId(), e);
            
            try {
                portfolioCommandService.updatePortfolioStatus(event.getPortfolioId(), Portfolio.PortfolioStatus.FAILED);
            } catch (Exception updateException) {
                log.error("Failed to update portfolio status to FAILED - portfolioId: {}", 
                        event.getPortfolioId(), updateException);
            }
        }
        
        return CompletableFuture.completedFuture(null);
    }

    /**
     * 포트폴리오 분석 실패 이벤트 처리
     */
    @EventListener
    @Async("backgroundTaskExecutor")
    @Transactional(propagation = REQUIRES_NEW)
    public CompletableFuture<Void> handlePortfolioAnalysisFailure(PortfolioAnalysisFailureEvent event) {
        log.error("Portfolio analysis failed - portfolioId: {}, error: {}", 
                event.getPortfolioId(), event.getErrorMessage());
        
        try {
            portfolioCommandService.updatePortfolioStatus(event.getPortfolioId(), 
                    Portfolio.PortfolioStatus.FAILED);
            
        } catch (Exception e) {
            log.error("Failed to update portfolio status to FAILED - portfolioId: {}", 
                    event.getPortfolioId(), e);
        }
        
        return CompletableFuture.completedFuture(null);
    }

    /**
     * 분석 결과 로깅
     */
    private void logAnalysisResult(PortfolioAnalysisResponse analysisResponse) {
        try {
            validateRiskMetrics(analysisResponse);
            
            String analysisJson = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(analysisResponse);
            log.info("Portfolio analysis result: {}", analysisJson);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize analysis result for logging: {}", e.getMessage());
        }
    }
    
    /**
     * 위험 지표 값 검증
     */
    private void validateRiskMetrics(PortfolioAnalysisResponse analysisResponse) {
        if (analysisResponse.portfolios() != null) {
            for (PortfolioAnalysisResponse.PortfolioStrategyResponse portfolio : analysisResponse.portfolios()) {
                if (portfolio.metrics() != null) {
                    Double varValue = portfolio.metrics().varValue();
                    Double cvarValue = portfolio.metrics().cvarValue();
                    
                    if (varValue == null || varValue == 0.0) {
                        log.warn("VaR value is null or zero for portfolio type: {}", portfolio.type());
                    }
                    
                    if (cvarValue == null || cvarValue == 0.0) {
                        log.warn("CVaR value is null or zero for portfolio type: {}", portfolio.type());
                    }

                    log.info("Risk metrics for {}: VaR={}, CVaR={}, Volatility={}, MaxDrawdown={}", 
                            portfolio.type(), varValue, cvarValue, 
                            portfolio.metrics().stdDeviation(), portfolio.metrics().maxDrawdown());
                }
            }
        }
    }

    /**
     * 포트폴리오 분석 결과 저장
     */
    private void savePortfolioAnalysisResult(Long portfolioId, String analysisResultJson) {
        try {
            portfolioCommandService.savePortfolioAnalysisResult(portfolioId, analysisResultJson);
            log.info("Portfolio analysis result saved successfully - portfolioId: {}", portfolioId);
            
        } catch (Exception e) {
            log.error("Failed to save portfolio analysis result - portfolioId: {}", portfolioId, e);
            throw e;
        }
    }

    /**
     * 포트폴리오 분석 리포트 생성 (비동기)
     */
    @Async("backgroundTaskExecutor")
    public CompletableFuture<String> generatePortfolioAnalysisReport(Long portfolioId, String analysisResultJson) {
        log.info("Generating portfolio analysis report for portfolioId: {}", portfolioId);
        
        try {
            String report = portfolioReportService.generateOptimizationInsightFromAnalysis(analysisResultJson);
            
            portfolioCommandService.savePortfolioReportResult(portfolioId, report);
            
            log.info("Portfolio analysis report generated and saved successfully - portfolioId: {}, report length: {}", 
                    portfolioId, report.length());
            
            return CompletableFuture.completedFuture(report);
            
        } catch (Exception e) {
            log.error("Failed to generate portfolio analysis report for portfolioId: {}", portfolioId, e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * 포트폴리오 분석 리포트 수동 생성
     * DB에서 저장된 분석 결과를 조회하여 LLM 리포트 생성 후 저장
     */
    public String generatePortfolioAnalysisReportFromDb(Long portfolioId) {
        log.info("Manually generating portfolio analysis report for portfolioId: {}", portfolioId);
        
        try {
            Portfolio portfolio = portfolioCommandService.getPortfolioById(portfolioId);
            if (portfolio.analysisResult() == null || portfolio.analysisResult().trim().isEmpty()) {
                throw new RuntimeException("포트폴리오 분석 결과가 없습니다. 먼저 포트폴리오 분석을 실행해주세요.");
            }
            
            String report = portfolioReportService.generateOptimizationInsightFromAnalysis(portfolio.analysisResult());
            portfolioCommandService.savePortfolioReportResult(portfolioId, report);
            
            log.info("Portfolio analysis report generated and saved successfully from DB - portfolioId: {}, report length: {}", 
                    portfolioId, report.length());
            
            return report;
            
        } catch (Exception e) {
            log.error("Failed to generate portfolio analysis report from DB for portfolioId: {}", portfolioId, e);
            throw new RuntimeException("포트폴리오 분석 리포트 생성에 실패했습니다.", e);
        }
    }
}