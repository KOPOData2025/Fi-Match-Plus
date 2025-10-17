package com.fimatchplus.backend.portfolio.controller;

import com.fimatchplus.backend.common.dto.ApiResponse;
import com.fimatchplus.backend.common.util.AuthUtil;
import com.fimatchplus.backend.portfolio.dto.*;
import com.fimatchplus.backend.portfolio.service.PortfolioAnalysisDetailService;
import com.fimatchplus.backend.portfolio.service.PortfolioCommandService;
import com.fimatchplus.backend.portfolio.service.PortfolioQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/portfolios")
public class PortfolioController {

    private final PortfolioCommandService portfolioCommandService;
    private final PortfolioQueryService portfolioQueryService;
    private final PortfolioAnalysisDetailService portfolioAnalysisDetailService;
    private final AuthUtil authUtil;

    /**
     * 사용자 포트폴리오 통합 합계 정보 조회 (포트폴리오 페이지 헤더)
     * <ul>
     *     <li>총 자산 합계</li>
     *     <li>전일대비 수익 금액</li>
     *     <li>전일대비 수익률</li>
     * </ul>
     * */
    @GetMapping("/summary")
    public ApiResponse<PortfolioSummaryResponse> getPortfolioSummary(HttpServletRequest request) {
        Long userId = authUtil.getUserIdFromRequest(request);
        log.info("GET /api/portfolios/summary - userId: {}", userId);

        PortfolioSummaryResponse response = portfolioQueryService.getPortfolioSummary(userId);
        return ApiResponse.success("포트폴리오 통합 정보를 조회합니다", response);
    }

    /**
     * 포트폴리오 생성
     * <ul>
     *     <li>포트폴리오 기본 정보 (이름, 설명, 총 자산)</li>
     *     <li>보유 종목 정보 (종목 코드, 이름, 수량, 가격, 비중 등)</li>
     *     <li>매매 규칙 (리밸런싱, 손절, 익절 전략)</li>
     * </ul>
     * */
    @PostMapping
    public ApiResponse<CreatePortfolioResult> createPortfolio(
            @Valid @RequestBody CreatePortfolioRequest request,
            HttpServletRequest httpRequest) {
        Long userId = authUtil.getUserIdFromRequest(httpRequest);
        log.info("POST /api/portfolios - userId: {}, name: {}", userId, request.name());

        CreatePortfolioResult data = portfolioCommandService.createPortfolio(userId, request);
        return ApiResponse.success("새로운 포트폴리오를 생성합니다", data);
    }

    /**
     * 포트폴리오 기본 정보 조회
     * <ul>
     *     <li>포트폴리오 식별자</li>
     *     <li>포트폴리오 이름, 설명, 총 자산</li>
     *     <li>보유 종목 상세 정보 (symbol, name, shares, currentPrice, totalValue, change, changePercent, weight)</li>
     * </ul>
     * */
    @GetMapping("/{portfolioId}")
    public ApiResponse<PortfolioDetailResponse> getPortfolioDetail(@PathVariable Long portfolioId) {
        log.info("GET /api/portfolios/{}", portfolioId);

        PortfolioDetailResponse response = portfolioQueryService.getPortfolioDetail(portfolioId);
        return ApiResponse.success("포트폴리오 상세 정보를 조회합니다", response);
    }

    /**
     * 단일 포트폴리오 상세 정보 조회 (포트폴리오 페이지용)
     * <ul>
     *     <li>포트폴리오 식별자</li>
     *     <li>보유 종목별 이름, 비중, 금액, 전일대비등락률</li>
     * </ul>
     * */
    @GetMapping("/{portfolioId}/long")
    public ApiResponse<PortfolioLongResponse> getPortfolioLong(@PathVariable Long portfolioId) {
        log.info("GET /api/portfolios/{}/long", portfolioId);

        PortfolioLongResponse response = portfolioQueryService.getPortfolioLong(portfolioId);
        return ApiResponse.success("단일 포트폴리오 조회", response);
    }

    /**
     * 포트폴리오 분석 결과만 조회
     * <ul>
     *     <li>분석 상태 (PENDING, RUNNING, COMPLETED, FAILED)</li>
     *     <li>분석 결과 (전략별 위험도, 비중 등)</li>
     * </ul>
     * */
    @GetMapping("/{portfolioId}/analysis")
    public ApiResponse<PortfolioLongResponse.AnalysisDetail> getPortfolioAnalysis(@PathVariable Long portfolioId) {
        log.info("GET /api/portfolios/{}/analysis", portfolioId);

        PortfolioLongResponse.AnalysisDetail analysisDetail = portfolioQueryService.getPortfolioAnalysisDetail(portfolioId);
        return ApiResponse.success("포트폴리오 분석 결과를 조회합니다", analysisDetail);
    }

    /**
     * 포트폴리오 분석 상세 정보 조회 (리포트 포함)
     * <ul>
     *     <li>분석 상태 (PENDING, RUNNING, COMPLETED, FAILED)</li>
     *     <li>포트폴리오 이름</li>
     *     <li>분석 날짜</li>
     *     <li>분석 기간 (시작일, 종료일)</li>
     *     <li>최적화 결과(사용자 지정, 하방위험 최소화, 소르티노 비율 최적화)</li>
     *     <li>각 포트폴리오별 위험도, 보유 비중, 성과지표, 강점, 약점</li>
     * </ul>
     * */
    @GetMapping("/{portfolioId}/detail")
    public ApiResponse<PortfolioAnalysisDetailResponse> getPortfolioAnalysisDetail(@PathVariable Long portfolioId) {
        log.info("GET /api/portfolios/{}/detail", portfolioId);

        PortfolioAnalysisDetailResponse response = portfolioAnalysisDetailService.getPortfolioAnalysisDetail(portfolioId);
        return ApiResponse.success("포트폴리오 분석 상세 정보를 조회합니다", response);
    }

    /**
     * 사용자 포트폴리오 리스트 조회 (포트폴리오 페이지용) - 포트폴리오 항목별 정보
     * <ul>
     *     <li>포트폴리오 제목</li>
     *     <li>포트폴리오 설명</li>
     *     <li>자산 합계</li>
     *     <li>전일대비등락금액 합계</li>
     *     <li>전일대비등락률</li>
     *     <li>보유 종목별 ticker, 이름, 비중</li>
     * </ul>
     * */
    @GetMapping
    public ApiResponse<PortfolioListResponse> getPortfolioList(HttpServletRequest request) {
        Long userId = authUtil.getUserIdFromRequest(request);
        log.info("GET /api/portfolios - userId: {}", userId);

        PortfolioListResponse response = portfolioQueryService.getPortfolioList(userId);
        return ApiResponse.success("사용자의 포트폴리오 목록을 조회합니다", response);
    }

    /**
     * 포트폴리오 수정
     * <ul>
     *     <li>포트폴리오 기본 정보 (이름, 설명)</li>
     *     <li>보유 종목 정보 (종목 코드, 이름, 수량, 가격, 비중 등)</li>
     *     <li>매매 규칙 (리밸런싱, 손절, 익절 전략)</li>
     * </ul>
     * */
    @PutMapping("/{portfolioId}")
    public ApiResponse<Void> updatePortfolio(
            @PathVariable Long portfolioId,
            @Valid @RequestBody UpdatePortfolioRequest request,
            HttpServletRequest httpRequest) {
        Long userId = authUtil.getUserIdFromRequest(httpRequest);
        log.info("PUT /api/portfolios/{} - userId: {}, name: {}", portfolioId, userId, request.name());

        portfolioCommandService.updatePortfolio(portfolioId, userId, request);
        return ApiResponse.success("포트폴리오가 수정되었습니다", null);
    }

    /**
     * 포트폴리오 삭제 (Soft Delete)
     * <ul>
     *     <li>deleted_at 컬럼에 삭제 시간 기록</li>
     * </ul>
     * */
    @DeleteMapping("/{portfolioId}")
    public ApiResponse<Void> deletePortfolio(@PathVariable Long portfolioId, HttpServletRequest request) {
        Long userId = authUtil.getUserIdFromRequest(request);
        log.info("DELETE /api/portfolios/{} - userId: {}", portfolioId, userId);

        portfolioCommandService.deletePortfolio(portfolioId, userId);
        return ApiResponse.success("포트폴리오가 삭제되었습니다", null);
    }
}
