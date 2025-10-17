package com.fimatchplus.backend.backtest.controller;
import com.fimatchplus.backend.backtest.domain.Backtest;
import com.fimatchplus.backend.backtest.dto.CreateBacktestRequest;
import com.fimatchplus.backend.backtest.dto.CreateBacktestResult;
import com.fimatchplus.backend.backtest.dto.UpdateBacktestRequest;
import com.fimatchplus.backend.backtest.dto.BacktestResponse;
import com.fimatchplus.backend.backtest.dto.BacktestResponseMapper;
import com.fimatchplus.backend.backtest.dto.BacktestDetailResponse;
import com.fimatchplus.backend.backtest.dto.BacktestMetaData;
import com.fimatchplus.backend.backtest.service.BacktestService;
import com.fimatchplus.backend.backtest.service.BacktestQueryService;
import com.fimatchplus.backend.backtest.service.BacktestExecutionService;
import com.fimatchplus.backend.backtest.event.BacktestSuccessEvent;
import com.fimatchplus.backend.backtest.event.BacktestFailureEvent;
import com.fimatchplus.backend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import com.fimatchplus.backend.backtest.dto.BacktestCallbackResponse;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/backtests")
public class BacktestController {

    private final BacktestService backtestService;
    private final BacktestQueryService backtestQueryService;
    private final BacktestExecutionService backtestExecutionService;
    private final BacktestResponseMapper backtestResponseMapper;
    private final ApplicationEventPublisher applicationEventPublisher;

    /**
     * 백테스트 생성
     * <ul>
     *     <li>백테스트 기본 정보 (제목, 설명, 기간)</li>
     *     <li>매매 규칙 (손절, 익절 전략) - 선택사항</li>
     *     <li>규칙이 있는 경우 MongoDB에 저장 후 rule_id 연결</li>
     * </ul>
     */
    @PostMapping("/portfolio/{portfolioId}")
    public ApiResponse<CreateBacktestResult> createBacktest(
            @PathVariable Long portfolioId,
            @Valid @RequestBody CreateBacktestRequest request) {
        
        log.info("POST /api/backtests/portfolio/{} - title: {}", portfolioId, request.title());
        
        if (!request.endAt().isAfter(request.startAt())) {
            throw new IllegalArgumentException("종료일은 시작일보다 나중이어야 합니다.");
        }
        
        CreateBacktestResult result = backtestService.createBacktest(portfolioId, request);
        return ApiResponse.success("백테스트가 생성되었습니다", result);
    }

    /**
     * 포트폴리오별 백테스트 조회
     * <ul>
     *     <li>해당 포트폴리오의 모든 백테스트 목록 조회</li>
     *     <li>portfolio_snapshots 데이터 존재 여부로 상태 판단</li>
     *     <li>완료된 백테스트의 경우 지표와 일별 수익률 포함</li>
     * </ul>
     */
    @GetMapping("/portfolio/{portfolioId}")
    public ApiResponse<List<BacktestResponse>> getBacktestsByPortfolioId(@PathVariable Long portfolioId) {
        
        log.info("GET /api/backtests/portfolio/{}", portfolioId);
        
        List<Backtest> backtests = backtestService.getBacktestsByPortfolioId(portfolioId);
        List<BacktestResponse> responses = backtestResponseMapper.toResponseList(backtests);
        
        return ApiResponse.success("포트폴리오 백테스트 목록을 조회했습니다", responses);
    }

    /**
     * 백테스트 메타데이터 조회 (설정 정보만)
     * <ul>
     *     <li>백테스트 생성 시 설정한 정보들만 조회</li>
     *     <li>제목, 설명, 기간, 벤치마크, 매매 규칙 등 포함</li>
     * </ul>
     */
    @GetMapping("/{backtestId}/metadata")
    public ApiResponse<BacktestMetaData> getBacktestMetaData(@PathVariable Long backtestId) {
        
        log.info("GET /api/backtests/{}/metadata", backtestId);
        
        BacktestMetaData response = backtestQueryService.getBacktestMetaData(backtestId);
        
        return ApiResponse.success("백테스트 메타데이터 조회 성공", response);
    }

    /**
     * 백테스트 상세 정보 조회
     * <ul>
     *     <li>백테스트 ID로 상세 정보 조회</li>
     *     <li>성과 지표, 일별 평가액, 포트폴리오 보유 정보 포함</li>
     * </ul>
     */
    @GetMapping("/{backtestId}")
    public ApiResponse<BacktestDetailResponse> getBacktestDetail(@PathVariable Long backtestId) {
        
        log.info("GET /api/backtests/{}", backtestId);
        
        BacktestDetailResponse response = backtestQueryService.getBacktestDetail(backtestId);
        
        return ApiResponse.success("백테스트 상세 조회 성공", response);
    }

    /**
     * 포트폴리오별 백테스트 상태 조회
     * <ul>
     *     <li>해당 포트폴리오의 모든 백테스트 ID와 상태만 조회</li>
     *     <li>Map 형태로 반환 (백테스트 ID -> 상태)</li>
     * </ul>
     */
    @GetMapping("/portfolios/{portfolioId}/status")
    public ApiResponse<Map<String, String>> getBacktestStatusesByPortfolioId(@PathVariable Long portfolioId) {
        
        log.info("GET /api/backtests/portfolios/{}/status", portfolioId);
        
        Map<String, String> backtestStatuses = backtestService.getBacktestStatusesByPortfolioId(portfolioId);
        
        return ApiResponse.success("포트폴리오 백테스트 상태 목록을 조회했습니다", backtestStatuses);
    }

    /**
     * 백테스트 실행 (백그라운드 작업)
     * <ul>
     *     <li>즉시 작업 ID 반환</li>
     *     <li>클라이언트가 페이지를 떠나도 작업 계속 진행</li>
     *     <li>SSE로 실시간 상태 확인 가능</li>
     * </ul>
     */
    @PostMapping("/{backtestId}/execute")
    public ResponseEntity<ApiResponse<String>> executeBacktest(@PathVariable Long backtestId) {
        log.info("POST /api/backtests/{}/execute - 백그라운드 작업으로 시작", backtestId);

        
        CompletableFuture<Void> future = backtestExecutionService.startBacktest(backtestId);
        
        future.thenRun(() -> {
            log.info("Backtest execution completed for backtestId: {}", backtestId);
        }).exceptionally(throwable -> {
            log.error("Backtest execution failed for backtestId: {}", backtestId, throwable);
            return null;
        });
        
        return ResponseEntity.ok(ApiResponse.success(
            "백테스트 실행이 시작되었습니다", 
            backtestId.toString()
        ));
    }

    /**
     * 백테스트 엔진에서 콜백 수신
     */
    @PostMapping("/callback")
    public ResponseEntity<Object> handleBacktestCallback(
            @RequestBody BacktestCallbackResponse callback,
            HttpServletRequest request) {
        
        String clientIP = getClientIP(request);
        
        try {
            log.info("Backtest callback received - ip: {}, jobId: {}, success: {}", clientIP, callback.jobId(), callback.success());
            Long backtestId = callback.backtestId();
            if (backtestId == null) {
                log.error("No backtestId found in callback for jobId: {}", callback.jobId());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            if (Boolean.TRUE.equals(callback.success())) {
                BacktestSuccessEvent successEvent = new BacktestSuccessEvent(backtestId, callback);
                applicationEventPublisher.publishEvent(successEvent);
            } else {
                BacktestFailureEvent failureEvent = new BacktestFailureEvent(backtestId, "Backtest failed");
                applicationEventPublisher.publishEvent(failureEvent);
            }
            return ResponseEntity.ok().build();
        } catch (Exception error) {
            log.error("Error processing backtest callback for jobId: {}", callback.jobId(), error);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * 백테스트 수정
     * <ul>
     *     <li>백테스트 기본 정보 (제목, 설명, 기간)</li>
     *     <li>매매 규칙 (손절, 익절 전략)</li>
     *     <li>벤치마크 지수</li>
     * </ul>
     */
    @PutMapping("/{backtestId}/portfolio/{portfolioId}")
    public ApiResponse<Void> updateBacktest(
            @PathVariable Long backtestId,
            @PathVariable Long portfolioId,
            @Valid @RequestBody UpdateBacktestRequest request) {
        
        log.info("PUT /api/backtests/{}/portfolio/{} - title: {}", backtestId, portfolioId, request.title());
        
        if (!request.endAt().isAfter(request.startAt())) {
            throw new IllegalArgumentException("종료일은 시작일보다 나중이어야 합니다.");
        }
        
        backtestService.updateBacktest(backtestId, portfolioId, request);
        return ApiResponse.success("백테스트가 수정되었습니다", null);
    }

    /**
     * 백테스트 삭제 (Soft Delete)
     * <ul>
     *     <li>deleted_at 컬럼에 삭제 시간 기록</li>
     * </ul>
     */
    @DeleteMapping("/{backtestId}/portfolio/{portfolioId}")
    public ApiResponse<Void> deleteBacktest(
            @PathVariable Long backtestId,
            @PathVariable Long portfolioId) {
        
        log.info("DELETE /api/backtests/{}/portfolio/{}", backtestId, portfolioId);
        
        backtestService.deleteBacktest(backtestId, portfolioId);
        return ApiResponse.success("백테스트가 삭제되었습니다", null);
    }

    /**
     * 클라이언트 IP 추출
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }

}
