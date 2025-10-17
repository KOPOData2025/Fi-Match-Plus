package com.fimatchplus.backend.backtest.service;

import com.fimatchplus.backend.backtest.domain.Backtest;
import com.fimatchplus.backend.backtest.domain.RuleCategory;
import com.fimatchplus.backend.backtest.dto.*;
import com.fimatchplus.backend.backtest.repository.BacktestRepository;
import com.fimatchplus.backend.backtest.repository.BacktestRuleRepository;
import com.fimatchplus.backend.backtest.util.ThresholdValueNormalizer;
import com.fimatchplus.backend.common.exception.ResourceNotFoundException;
import com.fimatchplus.backend.portfolio.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BacktestService {

    private final BacktestRepository backtestRepository;
    private final PortfolioRepository portfolioRepository;
    private final BacktestRuleRepository backtestRuleRepository;

    /**
     * 백테스트 생성
     *
     * @param portfolioId 포트폴리오 ID
     * @param request     백테스트 생성 요청
     * @return 생성된 백테스트 정보
     */
    @Transactional
    public CreateBacktestResult createBacktest(Long portfolioId, CreateBacktestRequest request) {
        log.info("Creating backtest for portfolioId: {}, title: {}", portfolioId, request.title());

        portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        Backtest backtest = Backtest.create(
                portfolioId,
                request.title(),
                request.description(),
                request.startAt(),
                request.endAt()
        );

        Backtest savedBacktest = backtestRepository.save(backtest);

        if (request.rules() != null && hasRules(request.rules())) {
            String ruleId = saveBacktestRules(savedBacktest.getId(), request.rules());
            
            savedBacktest.updateRuleId(ruleId);
            savedBacktest = backtestRepository.save(savedBacktest);
        }

        savedBacktest.setBenchmarkCode(request.benchmarkCode());
        savedBacktest = backtestRepository.save(savedBacktest);
        log.info("벤치마크 지수 설정 완료: {} for backtestId: {}", request.benchmarkCode(), savedBacktest.getId());

        return new CreateBacktestResult(
                savedBacktest.getId(),
                savedBacktest.getTitle(),
                savedBacktest.getDescription(),
                savedBacktest.getRuleId(),
                savedBacktest.getStartAt(),
                savedBacktest.getEndAt(),
                savedBacktest.getBenchmarkCode()
        );
    }


    /**
     * 포트폴리오별 백테스트 목록 조회
     *
     * @param portfolioId 포트폴리오 ID
     * @return 백테스트 목록
     */
    public List<Backtest> getBacktestsByPortfolioId(Long portfolioId) {
        log.info("Getting backtests for portfolioId: {}", portfolioId);

        portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        return backtestRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId);
    }

    /**
     * 포트폴리오별 백테스트 상태만 조회
     *
     * @param portfolioId 포트폴리오 ID
     * @return 백테스트 ID와 상태 맵 (백테스트 ID -> 상태)
     */
    public Map<String, String> getBacktestStatusesByPortfolioId(Long portfolioId) {
        log.info("Getting backtest statuses for portfolioId: {}", portfolioId);

        portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio not found with id: " + portfolioId));

        List<Backtest> backtests = backtestRepository.findByPortfolioIdOrderByCreatedAtDesc(portfolioId);
        
        return backtests.stream()
                .collect(Collectors.toMap(
                    backtest -> String.valueOf(backtest.getId()),
                    backtest -> backtest.getStatus().name()
                ));
    }


    /**
     * 백테스트 상태 업데이트
     */
    @Transactional
    public void updateBacktestStatus(Long backtestId, BacktestStatus status) {
        log.info("Updating backtest status to {} for backtestId: {}", status, backtestId);
        
        Backtest backtest = backtestRepository.findById(backtestId)
                .orElseThrow(() -> new ResourceNotFoundException("Backtest not found with id: " + backtestId));
        backtest.updateStatus(status);
        backtestRepository.save(backtest);
        
        log.info("Successfully updated backtest status to {} for backtestId: {}", status, backtestId);
    }

    /**
     * 백테스트 수정
     *
     * @param backtestId 수정할 백테스트 ID
     * @param portfolioId 포트폴리오 ID (권한 확인용)
     * @param request 수정 요청
     */
    @Transactional
    public void updateBacktest(Long backtestId, Long portfolioId, UpdateBacktestRequest request) {
        log.info("Updating backtest - backtestId: {}, portfolioId: {}, title: {}", backtestId, portfolioId, request.title());

        Backtest backtest = backtestRepository.findById(backtestId)
                .orElseThrow(() -> new ResourceNotFoundException("Backtest not found with id: " + backtestId));
        
        if (!backtest.getPortfolioId().equals(portfolioId)) {
            throw new ResourceNotFoundException("백테스트 수정 권한이 없습니다: " + backtestId);
        }

        backtest.updateBasicInfo(request.title(), request.description());
        backtest.updatePeriod(request.startAt(), request.endAt());
        backtest.setBenchmarkCode(request.benchmarkCode());
        
        backtest.updateStatus(BacktestStatus.CREATED);

        if (request.rules() != null && hasUpdateRules(request.rules())) {
            if (backtest.getRuleId() != null) {
                String ruleId = updateBacktestRules(backtest.getId(), backtest.getRuleId(), request.rules());
                backtest.updateRuleId(ruleId);
            } else {
                String ruleId = saveUpdateBacktestRules(backtest.getId(), request.rules());
                backtest.updateRuleId(ruleId);
            }
        }

        backtestRepository.save(backtest);
        log.info("Backtest updated successfully - backtestId: {}", backtestId);
    }

    /**
     * 백테스트 삭제 (Soft Delete)
     *
     * @param backtestId 삭제할 백테스트 ID
     * @param portfolioId 포트폴리오 ID (권한 확인용)
     */
    @Transactional
    public void deleteBacktest(Long backtestId, Long portfolioId) {
        log.info("Deleting backtest - backtestId: {}, portfolioId: {}", backtestId, portfolioId);

        Backtest backtest = backtestRepository.findById(backtestId)
                .orElseThrow(() -> new ResourceNotFoundException("Backtest not found with id: " + backtestId));
        
        if (!backtest.getPortfolioId().equals(portfolioId)) {
            throw new ResourceNotFoundException("백테스트 삭제 권한이 없습니다: " + backtestId);
        }

        backtestRepository.softDelete(backtestId);

        log.info("Backtest soft deleted successfully - backtestId: {}", backtestId);
    }


    private boolean hasRules(CreateBacktestRequest.RulesRequest rules) {
        return (rules.stopLoss() != null && !rules.stopLoss().isEmpty()) ||
               (rules.takeProfit() != null && !rules.takeProfit().isEmpty()) ||
               (rules.memo() != null && !rules.memo().trim().isEmpty());
    }

    private String saveBacktestRules(Long backtestId, CreateBacktestRequest.RulesRequest rulesRequest) {
        List<BacktestRuleDocument.RuleItem> stopLossItems = convertToRuleItems(rulesRequest.stopLoss());
        List<BacktestRuleDocument.RuleItem> takeProfitItems = convertToRuleItems(rulesRequest.takeProfit());

        BacktestRuleDocument backtestRule = new BacktestRuleDocument(
                backtestId,
                rulesRequest.memo(),
                stopLossItems,
                takeProfitItems
        );

        BacktestRuleDocument savedRule = backtestRuleRepository.save(backtestRule);
        log.info("Saved backtest rule to MongoDB with id: {}", savedRule.getId());
        
        return savedRule.getId();
    }

    private List<BacktestRuleDocument.RuleItem> convertToRuleItems(List<CreateBacktestRequest.RuleItemRequest> items) {
        if (items == null) {
            return List.of();
        }
        
        return items.stream()
                .map(item -> {
                    RuleCategory category = RuleCategory.fromCode(item.category());
                    if (category == null) {
                        throw new IllegalArgumentException(
                            String.format("유효하지 않은 규칙 카테고리입니다: '%s'. " +
                                "사용 가능한 카테고리: BETA(베타 일정값 초과), MDD(MDD 초과), VAR(VaR 초과), LOSS_LIMIT(손실 한계선), ONEPROFIT(단일 종목 목표 수익률 달성)", 
                                item.category())
                        );
                    }
                    String categoryCode = category.getCode();
                    
                    String normalizedThreshold = ThresholdValueNormalizer.normalize(
                        categoryCode, 
                        item.threshold()
                    );
                    
                    log.debug("Normalized rule - category: {} -> {}, threshold: {} -> {}", 
                             item.category(), categoryCode, item.threshold(), normalizedThreshold);
                    
                    return new BacktestRuleDocument.RuleItem(
                        categoryCode,
                        normalizedThreshold,
                        item.description()
                    );
                })
                .toList();
    }

    private boolean hasUpdateRules(UpdateBacktestRequest.RulesRequest rules) {
        return (rules.stopLoss() != null && !rules.stopLoss().isEmpty()) ||
               (rules.takeProfit() != null && !rules.takeProfit().isEmpty()) ||
               (rules.memo() != null && !rules.memo().trim().isEmpty());
    }

    private String saveUpdateBacktestRules(Long backtestId, UpdateBacktestRequest.RulesRequest rulesRequest) {
        List<BacktestRuleDocument.RuleItem> stopLossItems = convertUpdateToRuleItems(rulesRequest.stopLoss());
        List<BacktestRuleDocument.RuleItem> takeProfitItems = convertUpdateToRuleItems(rulesRequest.takeProfit());

        BacktestRuleDocument backtestRule = new BacktestRuleDocument(
                backtestId,
                rulesRequest.memo(),
                stopLossItems,
                takeProfitItems
        );

        BacktestRuleDocument savedRule = backtestRuleRepository.save(backtestRule);
        log.info("Saved backtest rule to MongoDB with id: {}", savedRule.getId());
        
        return savedRule.getId();
    }

    private String updateBacktestRules(Long backtestId, String ruleId, UpdateBacktestRequest.RulesRequest rulesRequest) {
        List<BacktestRuleDocument.RuleItem> stopLossItems = convertUpdateToRuleItems(rulesRequest.stopLoss());
        List<BacktestRuleDocument.RuleItem> takeProfitItems = convertUpdateToRuleItems(rulesRequest.takeProfit());

        BacktestRuleDocument backtestRule = new BacktestRuleDocument(
                backtestId,
                rulesRequest.memo(),
                stopLossItems,
                takeProfitItems
        );
        backtestRule.setId(ruleId);

        BacktestRuleDocument savedRule = backtestRuleRepository.save(backtestRule);
        log.info("Updated backtest rule in MongoDB with id: {}", savedRule.getId());
        
        return savedRule.getId();
    }

    private List<BacktestRuleDocument.RuleItem> convertUpdateToRuleItems(List<UpdateBacktestRequest.RuleItemRequest> items) {
        if (items == null) {
            return List.of();
        }
        
        return items.stream()
                .map(item -> {
                    RuleCategory category = RuleCategory.fromCode(item.category());
                    if (category == null) {
                        throw new IllegalArgumentException(
                            String.format("유효하지 않은 규칙 카테고리입니다: '%s'. " +
                                "사용 가능한 카테고리: BETA(베타 일정값 초과), MDD(MDD 초과), VAR(VaR 초과), LOSS_LIMIT(손실 한계선), ONEPROFIT(단일 종목 목표 수익률 달성)", 
                                item.category())
                        );
                    }
                    String categoryCode = category.getCode();
                    
                    String normalizedThreshold = ThresholdValueNormalizer.normalize(
                        categoryCode, 
                        item.threshold()
                    );
                    
                    log.debug("Normalized rule - category: {} -> {}, threshold: {} -> {}", 
                             item.category(), categoryCode, item.threshold(), normalizedThreshold);
                    
                    return new BacktestRuleDocument.RuleItem(
                        categoryCode,
                        normalizedThreshold,
                        item.description()
                    );
                })
                .toList();
    }
}