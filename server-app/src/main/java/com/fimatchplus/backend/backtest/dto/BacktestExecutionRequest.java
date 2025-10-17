package com.fimatchplus.backend.backtest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fimatchplus.backend.portfolio.domain.Holding;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 백테스트 엔진으로 보낼 비동기 요청 DTO
 */
public record BacktestExecutionRequest(
    @JsonProperty("backtest_id")
    Long backtestId,
    LocalDateTime start,
    LocalDateTime end,
    List<HoldingRequest> holdings,
    @JsonProperty("rebalance_frequency")
    String rebalanceFrequency,
    @JsonProperty("callback_url")
    String callbackUrl,
    RulesRequest rules,
    @JsonProperty("benchmark_code")
    String benchmarkCode
) {
    public static BacktestExecutionRequest of(Long backtestId, LocalDateTime start, LocalDateTime end,
                                              List<Holding> holdings, String callbackUrl, RulesRequest rules, 
                                              String benchmarkCode) {
        List<HoldingRequest> holdingRequests = holdings.stream()
                .map(holding -> new HoldingRequest(holding.symbol(), holding.shares()))
                .toList();
        return new BacktestExecutionRequest(backtestId, start, end, holdingRequests, "daily", callbackUrl, rules, benchmarkCode);
    }
    
    public record HoldingRequest(
        String code,
        int quantity
    ) {}
    
    /**
     * 백테스트 엔진에 전달할 규칙 정보
     */
    public record RulesRequest(
        @JsonProperty("stopLoss")
        List<RuleItem> stopLoss,
        @JsonProperty("takeProfit") 
        List<RuleItem> takeProfit
    ) {}
    
    /**
     * 개별 규칙 항목
     */
    public record RuleItem(
        String category,
        Double value
    ) {}
}
