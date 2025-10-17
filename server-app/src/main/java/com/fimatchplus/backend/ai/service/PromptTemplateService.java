package com.fimatchplus.backend.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * 프롬프트 템플릿 관리 서비스
 * 외부 파일이나 설정에서 프롬프트를 관리할 수 있도록 지원
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptTemplateService {
    
    @Qualifier("webApplicationContext")
    private final ResourceLoader resourceLoader;
    
    @Value("${ai.prompts.backtest-report.template-file}")
    private String backtestTemplatePath;
    
    @Value("${ai.prompts.portfolio-optimization.template-file}")
    private String portfolioTemplatePath;
    
    /**
     * 백테스트 리포트 생성용 프롬프트 템플릿 반환
     * 파일에서 로드
     */
    public String getBacktestReportPrompt() {
        try {
            Resource resource = resourceLoader.getResource(backtestTemplatePath);
            if (resource.exists()) {
                return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.warn("프롬프트 템플릿 파일 로드 실패: {}", e.getMessage());
        }
        
        return getDefaultBacktestReportPrompt();
    }
    
    /**
     * 프롬프트 템플릿에 변수 치환하여 최종 프롬프트 생성
     * 
     * @param template 템플릿 문자열
     * @param variables 치환할 변수들
     * @return 치환된 최종 프롬프트
     */
    public String buildPrompt(String template, Map<String, Object> variables) {
        String result = template;
        
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        
        return result;
    }
    
    /**
     * 백테스트 리포트용 프롬프트 생성 (편의 메서드)
     * 
     * @param backtestData 백테스트 데이터
     * @param analysisFocus 분석 초점
     * @return 최종 프롬프트
     */
    public String buildBacktestReportPrompt(String backtestData, String analysisFocus) {
        String template = getBacktestReportPrompt();
        
        Map<String, Object> variables = Map.of(
            "backtestData", backtestData != null ? backtestData : "",
            "analysisFocus", analysisFocus != null ? analysisFocus : "",
            "analysisFocusSection", analysisFocus != null && !analysisFocus.trim().isEmpty() 
                ? "\n특별히 다음 관점에서 분석해주세요: " + analysisFocus 
                : ""
        );
        
        return buildPrompt(template, variables);
    }
    
    /**
     * 포트폴리오 최적화 리포트 생성용 프롬프트 템플릿 반환
     */
    public String getPortfolioOptimizationPrompt() {
        try {
            Resource resource = resourceLoader.getResource(portfolioTemplatePath);
            if (resource.exists()) {
                return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.warn("포트폴리오 최적화 프롬프트 템플릿 파일 로드 실패: {}", e.getMessage());
        }
        
        return getDefaultPortfolioOptimizationPrompt();
    }
    
    /**
     * 포트폴리오 최적화 리포트용 프롬프트 생성 (편의 메서드)
     * 
     * @param portfolioData 포트폴리오 최적화 데이터
     * @return 최종 프롬프트
     */
    public String buildPortfolioOptimizationPrompt(String portfolioData) {
        String template = getPortfolioOptimizationPrompt();
        
        Map<String, Object> variables = Map.of(
            "portfolioData", portfolioData != null ? portfolioData : ""
        );
        
        return buildPrompt(template, variables);
    }
    
    /**
     * 기본 백테스트 리포트 프롬프트 (fallback)
     */
    private String getDefaultBacktestReportPrompt() {
        return """
            다음 백테스트 결과를 분석하여 전문적인 투자 전략 리포트를 작성해주세요:

            {{backtestData}}

            다음 항목들을 포함하여 종합적인 분석 리포트를 작성해주세요:
            - 백테스트 성과 요약 (수익률, 리스크 지표)
            - 매매 전략의 효과성 분석
            - 위험 관리 측면의 평가
            - 벤치마크 지수 대비 성과 비교 분석 (벤치마크 지수 정보가 제공된 경우 해당 벤치마크와의 비교)
            - 시장 환경 대비 성과 분석
            - 전략 개선 방안 및 추천사항{{analysisFocusSection}}

            전문적이고 실용적인 투자 분석 리포트를 작성해주세요.
            전문적으로 보이되, 어떤 의미를 가지는지 취약 금융 취약 소비자들도 쉽게 이해할 수 있도록 풀어서 작성해주세요.
            """;
    }
    
    /**
     * 기본 포트폴리오 최적화 리포트 프롬프트 (fallback)
     */
    private String getDefaultPortfolioOptimizationPrompt() {
        return """
            다음 포트폴리오 최적화 분석 결과를 바탕으로 투자자를 위한 인사이트 리포트를 작성해주세요:

            {{portfolioData}}

            다음 항목들을 포함하여 종합적인 인사이트를 제공해주세요:
            - 현재 포트폴리오 진단 (비중, 리스크 기여도, 성과 지표)
            - 포스트 모던 포트폴리오 이론 기반 최적 포트폴리오 구성 제안 (최소 하방위험, 최대 소르티노)
            - 종목별 특성 및 비중 조정 근거
            - 벤치마크 대비 성과 개선 전망
            - 실행 가이드 및 주의사항

            전문적이면서도 일반 투자자가 쉽게 이해할 수 있도록 작성해주세요.
            """;
    }
}
