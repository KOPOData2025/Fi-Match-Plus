package com.fimatchplus.backend.portfolio.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fimatchplus.backend.common.exception.ResourceNotFoundException;
import com.fimatchplus.backend.portfolio.domain.Portfolio;
import com.fimatchplus.backend.portfolio.dto.PortfolioAnalysisDetailResponse;
import com.fimatchplus.backend.portfolio.dto.PortfolioAnalysisResponse;
import com.fimatchplus.backend.portfolio.dto.PortfolioInsightReport;
import com.fimatchplus.backend.portfolio.repository.PortfolioRepository;
import com.fimatchplus.backend.stock.domain.Stock;
import com.fimatchplus.backend.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 포트폴리오 분석 상세 조회 서비스
 * analysis_result와 report_result를 파싱하여 상세 정보를 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioAnalysisDetailService {

    private final PortfolioRepository portfolioRepository;
    private final ObjectMapper objectMapper;
    private final StockService stockService;

    /**
     * 포트폴리오 분석 상세 조회 (리포트 포함)
     * analysis_result와 report_result를 파싱하여 상세 정보 반환
     * 
     * @param portfolioId 포트폴리오 ID
     * @return 포트폴리오 분석 상세 정보
     */
    public PortfolioAnalysisDetailResponse getPortfolioAnalysisDetail(Long portfolioId) {
        log.info("Getting portfolio analysis detail for portfolioId: {}", portfolioId);

        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", "id", portfolioId));

        if (portfolio.analysisResult() == null || portfolio.analysisResult().trim().isEmpty()) {
            throw new RuntimeException("포트폴리오 분석 결과가 없습니다. 분석이 완료되지 않았을 수 있습니다.");
        }

        PortfolioAnalysisResponse analysisResponse;
        try {
            analysisResponse = objectMapper.readValue(
                    portfolio.analysisResult(), 
                    PortfolioAnalysisResponse.class
            );
        } catch (Exception e) {
            log.error("Failed to parse analysis_result for portfolioId: {}", portfolioId, e);
            throw new RuntimeException("포트폴리오 분석 결과 파싱에 실패했습니다.", e);
        }

        PortfolioInsightReport insightReport = null;
        if (portfolio.reportResult() != null && !portfolio.reportResult().trim().isEmpty()) {
            try {
                insightReport = objectMapper.readValue(
                        portfolio.reportResult(), 
                        PortfolioInsightReport.class
                );
            } catch (Exception e) {
                log.warn("Failed to parse report_result for portfolioId: {}, will use null", portfolioId, e);
            }
        }

        return buildDetailResponse(portfolio, analysisResponse, insightReport);
    }

    /**
     * 상세 응답 생성
     */
    private PortfolioAnalysisDetailResponse buildDetailResponse(
            Portfolio portfolio,
            PortfolioAnalysisResponse analysisResponse,
            PortfolioInsightReport insightReport
    ) {
        PortfolioAnalysisDetailResponse.AnalysisPeriod analysisPeriod = 
                new PortfolioAnalysisDetailResponse.AnalysisPeriod(
                        formatDate(analysisResponse.metadata().period().start()),
                        formatDate(analysisResponse.metadata().period().end())
                );

        Map<String, PortfolioInsightReport.PortfolioInsight> insightMap = buildInsightMap(insightReport);
        
        Map<String, String> stockCodeToNameMap = buildStockNameMap(analysisResponse);

        List<PortfolioAnalysisDetailResponse.PortfolioInsight> results = 
                createPortfolioInsights(analysisResponse, insightMap, stockCodeToNameMap);

        PortfolioAnalysisDetailResponse.ComparativeAnalysis comparativeAnalysis = 
                createComparativeAnalysis(insightReport);

        PortfolioAnalysisDetailResponse.PersonalizedRecommendation personalizedRecommendation = 
                createPersonalizedRecommendation(insightReport);

        return PortfolioAnalysisDetailResponse.of(
                portfolio.status().name(),
                portfolio.name(),
                analysisResponse.metadata().timestamp(),
                analysisPeriod,
                analysisResponse.metadata().executionTime(),
                results,
                comparativeAnalysis,
                personalizedRecommendation
        );
    }
    
    /**
     * 인사이트를 type별로 매핑
     */
    private Map<String, PortfolioInsightReport.PortfolioInsight> buildInsightMap(
            PortfolioInsightReport insightReport
    ) {
        if (insightReport == null || insightReport.portfolioInsights() == null) {
            return new HashMap<>();
        }
        
        return insightReport.portfolioInsights().stream()
                    .collect(Collectors.toMap(
                            PortfolioInsightReport.PortfolioInsight::type,
                            insight -> insight,
                            (existing, replacement) -> replacement
                    ));
        }

    /**
     * 종목 코드 -> 종목명 맵 생성
     */
    private Map<String, String> buildStockNameMap(PortfolioAnalysisResponse analysisResponse) {
        List<String> allStockCodes = analysisResponse.portfolios().stream()
                .flatMap(p -> p.weights().keySet().stream())
                .distinct()
                .collect(Collectors.toList());
        
        return getStockNameMap(allStockCodes);
    }
    
    /**
     * 포트폴리오 인사이트 리스트 생성
     */
    private List<PortfolioAnalysisDetailResponse.PortfolioInsight> createPortfolioInsights(
            PortfolioAnalysisResponse analysisResponse,
            Map<String, PortfolioInsightReport.PortfolioInsight> insightMap,
            Map<String, String> stockCodeToNameMap
    ) {
        List<PortfolioAnalysisDetailResponse.PortfolioInsight> portfolioInsights = new ArrayList<>();
        
        if (analysisResponse.portfolios() == null) {
            return portfolioInsights;
        }
        
            for (PortfolioAnalysisResponse.PortfolioStrategyResponse portfolioStrategy : analysisResponse.portfolios()) {
                String type = portfolioStrategy.type();
                PortfolioInsightReport.PortfolioInsight insight = insightMap.get(type);

            List<PortfolioAnalysisDetailResponse.HoldingInfo> holdings = 
                    createHoldingInfoList(portfolioStrategy.weights(), stockCodeToNameMap);
                
                PortfolioAnalysisDetailResponse.Metrics metrics = new PortfolioAnalysisDetailResponse.Metrics(
                        portfolioStrategy.metrics().expectedReturn(),
                        portfolioStrategy.metrics().downsideDeviation(),
                        portfolioStrategy.metrics().sortinoRatio()
                );
            
            PortfolioAnalysisDetailResponse.RiskProfile riskProfile = extractRiskProfile(insight);
            PortfolioAnalysisDetailResponse.PerformanceInsight performanceInsight = extractPerformanceInsight(insight);
            String riskLevel = extractRiskLevel(insight);
            List<String> strengths = insight != null ? insight.keyStrengths() : null;
            List<String> weaknesses = insight != null ? insight.keyWeaknesses() : null;
            
            PortfolioAnalysisDetailResponse.PortfolioInsight portfolioInsight = new PortfolioAnalysisDetailResponse.PortfolioInsight(
                    type,
                    riskLevel,
                    holdings,
                    metrics,
                    riskProfile,
                    strengths,
                    weaknesses,
                    performanceInsight
            );
            
            portfolioInsights.add(portfolioInsight);
        }
        
        return portfolioInsights;
    }
    
    /**
     * holdings 정보 리스트 생성 (종목 코드 + 종목명 + 비중)
     */
    private List<PortfolioAnalysisDetailResponse.HoldingInfo> createHoldingInfoList(
            Map<String, Double> weights,
            Map<String, String> stockCodeToNameMap
    ) {
        return weights.entrySet().stream()
                .map(entry -> new PortfolioAnalysisDetailResponse.HoldingInfo(
                        entry.getKey(),
                        stockCodeToNameMap.getOrDefault(entry.getKey(), entry.getKey()),
                        entry.getValue()
                ))
                .collect(Collectors.toList());
    }
    
    /**
     * 위험 프로필 추출
     */
    private PortfolioAnalysisDetailResponse.RiskProfile extractRiskProfile(
            PortfolioInsightReport.PortfolioInsight insight
    ) {
        if (insight == null || insight.riskProfile() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.RiskProfile(
                insight.riskProfile().riskLevel(),
                insight.riskProfile().suitability(),
                insight.riskProfile().interpretation()
        );
    }
    
    /**
     * 성과 인사이트 추출
     */
    private PortfolioAnalysisDetailResponse.PerformanceInsight extractPerformanceInsight(
            PortfolioInsightReport.PortfolioInsight insight
    ) {
        if (insight == null || insight.performanceInsight() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.PerformanceInsight(
                insight.performanceInsight().riskInterpretation(),
                insight.performanceInsight().returnInterpretation(),
                insight.performanceInsight().efficiencyInterpretation()
        );
    }
    
    /**
     * 위험 수준 추출 및 변환 (한국어 -> 영어)
     */
    private String extractRiskLevel(PortfolioInsightReport.PortfolioInsight insight) {
        if (insight == null || insight.riskProfile() == null) {
            return null;
        }
        return convertRiskLevel(insight.riskProfile().riskLevel());
    }
    
    /**
     * 비교 분석 추출
     */
    private PortfolioAnalysisDetailResponse.ComparativeAnalysis createComparativeAnalysis(
            PortfolioInsightReport insightReport
    ) {
        if (insightReport == null || insightReport.comparativeAnalysis() == null) {
            return null;
        }
        
        PortfolioInsightReport.ComparativeAnalysis srcAnalysis = insightReport.comparativeAnalysis();
        PortfolioAnalysisDetailResponse.DecisionFramework decisionFramework = extractDecisionFramework(srcAnalysis);
        PortfolioAnalysisDetailResponse.ThreeWayComparison threeWayComparison = extractThreeWayComparison(srcAnalysis);
        
        return new PortfolioAnalysisDetailResponse.ComparativeAnalysis(
                srcAnalysis.keyDifferentiator(),
                decisionFramework,
                threeWayComparison
        );
    }
    
    /**
     * 의사결정 프레임워크 추출
     */
    private PortfolioAnalysisDetailResponse.DecisionFramework extractDecisionFramework(
            PortfolioInsightReport.ComparativeAnalysis srcAnalysis
    ) {
        if (srcAnalysis.decisionFramework() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.DecisionFramework(
                srcAnalysis.decisionFramework().chooseUserPortfolioIf(),
                srcAnalysis.decisionFramework().chooseMinDownsideRiskIf(),
                srcAnalysis.decisionFramework().chooseMaxSortinoIf()
        );
    }
    
    /**
     * 3가지 포트폴리오 비교 추출
     */
    private PortfolioAnalysisDetailResponse.ThreeWayComparison extractThreeWayComparison(
            PortfolioInsightReport.ComparativeAnalysis srcAnalysis
    ) {
        if (srcAnalysis.threeWayComparison() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.ThreeWayComparison(
                srcAnalysis.threeWayComparison().riskPerspective(),
                srcAnalysis.threeWayComparison().returnPerspective(),
                srcAnalysis.threeWayComparison().efficiencyPerspective()
        );
    }
    
    /**
     * 맞춤형 추천 추출
     */
    private PortfolioAnalysisDetailResponse.PersonalizedRecommendation createPersonalizedRecommendation(
            PortfolioInsightReport insightReport
    ) {
        if (insightReport == null || insightReport.personalizedRecommendation() == null) {
            return null;
        }
        
        PortfolioInsightReport.PersonalizedRecommendation srcRecommendation = insightReport.personalizedRecommendation();
        PortfolioAnalysisDetailResponse.RiskToleranceAssessment riskToleranceAssessment = extractRiskToleranceAssessment(srcRecommendation);
        PortfolioAnalysisDetailResponse.InvestmentHorizonAssessment investmentHorizonAssessment = extractInvestmentHorizonAssessment(srcRecommendation);
        
        return new PortfolioAnalysisDetailResponse.PersonalizedRecommendation(
                srcRecommendation.finalGuidance(),
                riskToleranceAssessment,
                investmentHorizonAssessment
        );
    }
    
    /**
     * 위험 성향 평가 추출
     */
    private PortfolioAnalysisDetailResponse.RiskToleranceAssessment extractRiskToleranceAssessment(
            PortfolioInsightReport.PersonalizedRecommendation srcRecommendation
    ) {
        if (srcRecommendation.riskToleranceAssessment() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.RiskToleranceAssessment(
                srcRecommendation.riskToleranceAssessment().lowRiskTolerance(),
                srcRecommendation.riskToleranceAssessment().mediumRiskTolerance(),
                srcRecommendation.riskToleranceAssessment().highRiskTolerance()
        );
    }
    
    /**
     * 투자 기간 평가 추출
     */
    private PortfolioAnalysisDetailResponse.InvestmentHorizonAssessment extractInvestmentHorizonAssessment(
            PortfolioInsightReport.PersonalizedRecommendation srcRecommendation
    ) {
        if (srcRecommendation.investmentHorizonAssessment() == null) {
            return null;
        }
        
        return new PortfolioAnalysisDetailResponse.InvestmentHorizonAssessment(
                srcRecommendation.investmentHorizonAssessment().shortTerm(),
                srcRecommendation.investmentHorizonAssessment().mediumTerm(),
                srcRecommendation.investmentHorizonAssessment().longTerm()
        );
    }
    
    /**
     * 종목 코드로 종목명 맵 생성
     */
    private Map<String, String> getStockNameMap(List<String> stockCodes) {
        if (stockCodes == null || stockCodes.isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            List<Stock> stocks = stockService.getStocksByTickers(stockCodes);
            return stocks.stream()
                    .collect(Collectors.toMap(
                            Stock::getTicker,
                            Stock::getName,
                            (existing, replacement) -> existing
                    ));
        } catch (Exception e) {
            log.warn("Failed to fetch stock names for codes: {}", stockCodes, e);
            return new HashMap<>();
        }
    }

    /**
     * 위험 수준 라벨 변환
     */
    private String convertRiskLevel(String koreanRiskLevel) {
        if (koreanRiskLevel == null) {
            return null;
        }
        
        return switch (koreanRiskLevel.trim()) {
            case "저위험" -> "LOW";
            case "중위험" -> "MEDIUM";
            case "고위험" -> "HIGH";
            default -> {
                log.warn("Unknown risk level: {}", koreanRiskLevel);
                yield null;
            }
        };
    }

    /**
     * 일시 문자열 yyyy-MM-dd 형식
     */
    private String formatDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return dateString;
        }
        
        if (dateString.contains("T")) {
            return dateString.substring(0, 10);
        }
        
        return dateString;
    }
}

