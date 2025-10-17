package com.fimatchplus.backend.portfolio.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fimatchplus.backend.portfolio.domain.Holding;
import com.fimatchplus.backend.portfolio.domain.Portfolio;
import com.fimatchplus.backend.portfolio.dto.PortfolioAnalysisRequest;
import com.fimatchplus.backend.portfolio.dto.PortfolioAnalysisStartResponse;
import com.fimatchplus.backend.portfolio.repository.PortfolioRepository;
import com.fimatchplus.backend.portfolio.event.PortfolioAnalysisFailureEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * 포트폴리오 최적화 관련 엔진 통신 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioAnalysisEngineClient {

    private final PortfolioRepository portfolioRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Qualifier("portfolioAnalysisEngineWebClient")
    private final WebClient portfolioAnalysisEngineWebClient;

    @Value("${portfolio.callback.base-url}")
    private String callbackBaseUrl;

    /**
     * 실행 엔진에 포트폴리오 최적화 비동기 요청 제출
     */
    @Async("backgroundTaskExecutor")
    public CompletableFuture<Void> submitToPortfolioAnalysisEngineAsync(Long portfolioId) {
        try {
            Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("포트폴리오를 찾을 수 없습니다: " + portfolioId));

            PortfolioAnalysisRequest request = createPortfolioAnalysisRequest(portfolio);

            try {
                String requestBody = objectMapper.writeValueAsString(request);
                log.info("Sending portfolio analysis request to engine - portfolioId: {}, requestBody: {}", 
                        portfolioId, requestBody);
            } catch (Exception e) {
                log.warn("Failed to serialize request body for logging: {}", e.getMessage());
            }

            PortfolioAnalysisStartResponse response = portfolioAnalysisEngineWebClient
                .post()
                .uri("/analysis/start")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PortfolioAnalysisStartResponse.class)
                .block();

            log.info("Portfolio analysis submitted to engine: portfolioId={}, status={}, message={}", portfolioId, response.status(), response.message());

        } catch (Exception e) {
            log.error("Failed to submit portfolio analysis to engine: portfolioId={}", portfolioId, e);
            try {
                eventPublisher.publishEvent(new PortfolioAnalysisFailureEvent(portfolioId,  e.getMessage()));
            } catch (Exception publishError) {
                log.warn("Failed to publish PortfolioAnalysisFailureEvent for portfolioId: {} - {}", portfolioId, publishError.getMessage());
            }
        }

        return CompletableFuture.completedFuture(null);
    }

    /**
     *  포트폴리오 최적화 요청 생성
     */
    public PortfolioAnalysisRequest createPortfolioAnalysisRequest(Portfolio portfolio) {
        try {
            List<Holding> holdings = portfolioRepository.findHoldingsByPortfolioId(portfolio.id());
            
            return PortfolioAnalysisRequest.of(
                portfolio.id(),
                holdings,
                callbackBaseUrl + "/portfolio-analysis/callback"
            );

        } catch (Exception e) {
            log.error("Failed to create portfolio analysis request for portfolioId: {}", portfolio.id(), e);
            throw new RuntimeException("Failed to create portfolio analysis request", e);
        }
    }
}
