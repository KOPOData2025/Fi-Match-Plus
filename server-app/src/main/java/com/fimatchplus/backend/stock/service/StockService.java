package com.fimatchplus.backend.stock.service;

import com.fimatchplus.backend.stock.dto.StockDetailResponse;
import com.fimatchplus.backend.stock.dto.StockPriceResponse;
import com.fimatchplus.backend.stock.dto.StockSearchResponse;
import com.fimatchplus.backend.stock.repository.StockPriceRepository;
import com.fimatchplus.backend.stock.repository.StockRepository;
import com.fimatchplus.backend.stock.domain.Stock;
import com.fimatchplus.backend.stock.domain.StockPrice;
import com.fimatchplus.backend.stock.domain.PriceChangeSign;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@Transactional(readOnly = true, timeout = 30)
public class StockService {

    private final StockRepository stockRepository;
    private final StockPriceRepository stockPriceRepository;
    private final KisPriceClient kisPriceClient;

    public StockService(StockRepository stockRepository, StockPriceRepository stockPriceRepository, KisPriceClient kisPriceClient) {
        this.stockRepository = stockRepository;
        this.stockPriceRepository = stockPriceRepository;
        this.kisPriceClient = kisPriceClient;
    }

    @Transactional(readOnly = true, timeout = 15) 
    public StockPriceResponse getStockPrices(List<String> tickers) {
        List<Stock> stocks = findStocksByTickers(tickers);
        List<StockPrice> latestPrices = findLatestPricesByTickers(tickers);
        List<StockPriceResponse.StockPriceData> priceDataList = convertToStockPriceDataList(stocks, latestPrices);

        return StockPriceResponse.success(priceDataList);
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public StockPriceResponse getCurrentPriceForSingle(String ticker) {
        Stock stock = getStockByTickerWithTransaction(ticker);

        KisQuoteResponse quote = kisPriceClient.fetchQuote(ticker);
        java.util.Map<String, Object> out = quote != null ? quote.output() : null;
        if (out == null) {
            throw new RuntimeException("KIS quote response is empty");
        }

        KisParsed parsed = parseKisOutput(out);
        log.info(
                "KIS quote - status: {}, name: {}, prpr: {}, vrss: {}, sign: {}, ctrt: {}, mcap: {}",
                parsed.status, parsed.korName, parsed.currentPrice, parsed.dailyChange, parsed.sign, parsed.dailyRate, parsed.marketCap
        );

        List<StockPriceResponse.StockPriceData> data = List.of(
                new StockPriceResponse.StockPriceData(
                        stock.getTicker(),
                        stock.getName(),
                        parsed.currentPrice,
                        parsed.dailyRate,
                        parsed.dailyChange,
                        parsed.marketCap,
                        parsed.sign
                )
        );

        return StockPriceResponse.success(data);
    }

    private double parseDouble(Object value) {
        if (value == null) return 0.0;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private KisParsed parseKisOutput(java.util.Map<String, Object> out) {
        KisParsed parsed = new KisParsed();
        parsed.currentPrice = parseDouble(out.get("stck_prpr"));
        String signCode = String.valueOf(out.get("prdy_vrss_sign"));
        parsed.sign = PriceChangeSign.fromCode(signCode);
        parsed.dailyChange = parseDouble(out.get("prdy_vrss"));
        parsed.dailyRate = parseDouble(out.get("prdy_ctrt"));
        parsed.marketCap = parseDouble(out.get("hts_avls"));
        parsed.status = String.valueOf(out.get("iscd_stat_cls_code"));
        parsed.korName = String.valueOf(out.get("bstp_kor_isnm"));
        return parsed;
    }

    private static class KisParsed {
        double currentPrice;
        double dailyChange;
        double dailyRate;
        double marketCap;
        String status;
        String korName;
        PriceChangeSign sign;
    }


    public StockDetailResponse getStockDetail(String ticker, String interval) {
        Stock stock = getStockByTicker(ticker);
        List<StockDetailResponse.ChartData> chartData = getChartDataForDetail(ticker, interval);
        StockDetailResponse.SummaryData summaryData = createSummaryData(stock, ticker, interval);
        StockDetailResponse.StockDetailData detailData = createStockDetailData(stock, chartData, summaryData);

        return StockDetailResponse.success(
                "종목 상세 정보를 성공적으로 조회했습니다.",
                detailData
        );
    }

    public List<StockDetailResponse.ChartData> getChartData(String stockId, String intervalUnit, LocalDateTime startDate, LocalDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<StockPrice> prices = stockPriceRepository.findByStockCodeAndInterval(
                stockId, intervalUnit, startDate, endDate, pageable
        );

        return convertToChartDataList(prices);
    }

    public void sendRealTimeStockPrice(String ticker, double price) {
        System.out.println("Real-time price update - Ticker: " + ticker + ", Price: " + price);
    }

    /**
     * 종목 이름 또는 티커로 검색 (기본 정보만)
     *
     * @param keyword 검색 키워드 (종목명 또는 티커)
     * @param limit 검색 결과 제한 수 (기본값: 20)
     * @return 검색된 종목 리스트 (티커, 종목명, 업종)
     */
    public StockSearchResponse searchStocks(String keyword, int limit) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return StockSearchResponse.success(List.of());
        }

        List<Stock> stocks = stockRepository.searchByNameOrTicker(keyword.trim(), 
                org.springframework.data.domain.PageRequest.of(0, limit));
        
        List<StockSearchResponse.StockSearchData> searchData = stocks.stream()
                .map(stock -> StockSearchResponse.StockSearchData.of(
                        stock.getTicker(),
                        stock.getName(),
                        stock.getIndustryName()
                ))
                .collect(Collectors.toList());

        return StockSearchResponse.success(searchData);
    }

    /**
     * 티커로 주식 정보를 조회합니다.
     *
     * @param ticker 종목 티커
     * @return Stock 객체
     * @throws RuntimeException 종목을 찾을 수 없는 경우
     */
    public Stock getStockByTicker(String ticker) {
        return stockRepository.findByTicker(ticker)
                .orElseThrow(() -> new RuntimeException("종목을 찾을 수 없습니다: " + ticker));
    }

    @Transactional(readOnly = true, timeout = 5)
    public Stock getStockByTickerWithTransaction(String ticker) {
        return stockRepository.findByTicker(ticker)
                .orElseThrow(() -> new RuntimeException("종목을 찾을 수 없습니다: " + ticker));
    }

    /**
     * 여러 티커로 주식 정보를 배치 조회합니다.
     *
     * @param tickers 종목 티커 리스트
     * @return Stock 객체 리스트
     */
    public List<Stock> getStocksByTickers(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            return List.of();
        }
        return stockRepository.findByTickerIn(tickers);
    }

    /**
     * 여러 티커로 주식 정보를 배치 조회 (트랜잭션 내)
     *
     * @param tickers 종목 티커 리스트
     * @return Stock 객체 리스트
     */
    @Transactional(readOnly = true, timeout = 5)
    public List<Stock> getStocksWithTransaction(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            return List.of();
        }
        return stockRepository.findByTickerIn(tickers);
    }

    /**
     * 티커로 현재 가격을 조회합니다.
     *
     * @param ticker 종목 티커
     * @return 현재 가격 (double)
     * @throws RuntimeException 종목을 찾을 수 없거나 가격 데이터가 없는 경우
     */
    public double getCurrentPrice(String ticker) {
        StockPrice latestPrice = stockPriceRepository.findFirstByStockCodeAndIntervalUnitOrderByDatetimeDesc(ticker, "1d");
        if (latestPrice == null) {
            throw new RuntimeException("가격 데이터를 찾을 수 없습니다: " + ticker);
        }
        return latestPrice.getClosePrice().doubleValue();
    }


    /**
     * 멀티 종목의 실시간 현재가를 KIS API로 조회
     *
     * @param tickers 종목 티커 목록
     * @return StockPriceResponse 형태의 응답
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public StockPriceResponse getRealtimeStockPrices(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            return StockPriceResponse.success(List.of());
        }

        List<Stock> stocks = getStocksWithTransaction(tickers);
        Map<String, String> tickerNameMap = stocks.stream()
                .collect(Collectors.toMap(Stock::getTicker, Stock::getName));

        Map<String, StockPriceInfo> priceMap = getMultiCurrentPrices(tickers);

        List<StockPriceResponse.StockPriceData> priceDataList = tickers.stream()
                .map(ticker -> {
                    String name = tickerNameMap.getOrDefault(ticker, "알 수 없음");
                    StockPriceInfo priceInfo = priceMap.get(ticker);
                    
                    if (priceInfo == null) {
                        return new StockPriceResponse.StockPriceData(
                                ticker, name, 0.0, 0.0, 0.0, 0.0, PriceChangeSign.FLAT
                        );
                    }
                    
                    return new StockPriceResponse.StockPriceData(
                            ticker,
                            name,
                            priceInfo.currentPrice(),
                            priceInfo.dailyChangeRate(),
                            priceInfo.dailyChangePrice(),
                            0.0,
                            priceInfo.sign()
                    );
                })
                .collect(Collectors.toList());

        return StockPriceResponse.success(priceDataList);
    }

    /**
     * 여러 종목의 현재가와 전일종가를 KIS API로 조회합니다.
     *
     * @param tickers 종목 티커 목록
     * @return 종목별 현재가와 전일종가 정보
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Map<String, StockPriceInfo> getMultiCurrentPrices(List<String> tickers) {
        if (tickers.isEmpty()) {
            return Map.of();
        }

        try {
            KisMultiPriceResponse response = kisPriceClient.fetchMultiPrice(tickers);
            
            if (!"0".equals(response.rtCd())) {
                throw new RuntimeException("KIS API 오류: " + response.msg1());
            }

            Map<String, StockPriceInfo> priceMap = new HashMap<>();
            
            for (KisMultiPriceResponse.ResponseBodyOutput output : response.output()) {
                try {
                    String ticker = output.interShrnIscd();
                    double currentPrice = Double.parseDouble(output.inter2Prpr());
                    PriceChangeSign sign = PriceChangeSign.fromCode(output.prdyVrssSign());
                    double dailyChangeRate = parseDouble(output.prdyCtrt());
                    double dailyChangePrice = parseDouble(output.inter2PrdyVrss());
                    
                    priceMap.put(ticker, new StockPriceInfo(currentPrice, dailyChangeRate, dailyChangePrice, sign));
                } catch (NumberFormatException e) {
                    log.warn("가격 데이터 파싱 오류 - 종목: {}, 현재가: {}, 전일대비: {}", 
                            output.interShrnIscd(), output.inter2Prpr(), output.inter2PrdyVrss());
                }
            }
            
            return priceMap;
        } catch (Exception e) {
            log.error("KIS 다중 가격 조회 오류: {}", e.getMessage());
            throw new RuntimeException("가격 조회 실패: " + e.getMessage());
        }
    }

    /**
     * 종목 가격 정보를 담는 레코드
     */
    public record StockPriceInfo(double currentPrice, double dailyChangeRate, double dailyChangePrice, PriceChangeSign sign) {}


    private List<Stock> findStocksByTickers(List<String> tickers) {
        return stockRepository.findByTickerIn(tickers);
    }

    private List<StockPrice> findLatestPricesByTickers(List<String> tickers) {
        return stockPriceRepository.findLatestByStockCodesAndInterval(tickers, "1d");
    }

    private List<StockPriceResponse.StockPriceData> convertToStockPriceDataList(List<Stock> stocks, List<StockPrice> latestPrices) {
        return stocks.stream()
                .map(stock -> convertToStockPriceData(stock, latestPrices))
                .collect(Collectors.toList());
    }

    private StockPriceResponse.StockPriceData convertToStockPriceData(Stock stock, List<StockPrice> latestPrices) {
        StockPrice latestPrice = findLatestPriceForStock(stock.getTicker(), latestPrices);

        if (latestPrice == null) {
            return createEmptyStockPriceData(stock);
        }

        return createStockPriceDataFromPrice(stock, latestPrice);
    }

    private StockPrice findLatestPriceForStock(String ticker, List<StockPrice> latestPrices) {
        return latestPrices.stream()
                .filter(price -> price.getStockCode().equals(ticker))
                .findFirst()
                .orElse(null);
    }

    private StockPriceResponse.StockPriceData createEmptyStockPriceData(Stock stock) {
        return new StockPriceResponse.StockPriceData(
                stock.getTicker(),
                stock.getName(),
                0.0, 0.0, 0.0,
                0.0,
                PriceChangeSign.FLAT
        );
    }

    private StockPriceResponse.StockPriceData createStockPriceDataFromPrice(Stock stock, StockPrice latestPrice) {
        double currentPrice = latestPrice.getClosePrice().doubleValue();
        double dailyChange = latestPrice.getChangeAmount().doubleValue();
        double dailyRate = latestPrice.getChangeRate().doubleValue();
        
        PriceChangeSign sign = estimateSignFromRate(dailyRate);

        return new StockPriceResponse.StockPriceData(
                stock.getTicker(),
                stock.getName(),
                currentPrice,
                dailyRate,
                dailyChange,
                0.0,
                sign
        );
    }


    private List<StockDetailResponse.ChartData> getChartDataForDetail(String ticker, String interval) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(30);
        Pageable pageable = PageRequest.of(0, 100);
        List<StockPrice> chartPrices = stockPriceRepository.findByStockCodeAndInterval(
                ticker, interval, startDate, endDate, pageable
        );

        return convertToChartDataList(chartPrices);
    }

    private List<StockDetailResponse.ChartData> convertToChartDataList(List<StockPrice> prices) {
        return prices.stream()
                .map(this::convertToChartData)
                .collect(Collectors.toList());
    }

    private StockDetailResponse.ChartData convertToChartData(StockPrice price) {
        return new StockDetailResponse.ChartData(
                price.getDatetime().toInstant(ZoneOffset.UTC),
                price.getOpenPrice().doubleValue(),
                price.getClosePrice().doubleValue(),
                price.getHighPrice().doubleValue(),
                price.getLowPrice().doubleValue(),
                price.getVolume()
        );
    }

    private StockDetailResponse.SummaryData createSummaryData(Stock stock, String ticker, String interval) {
        StockPrice latestPrice = stockPriceRepository.findFirstByStockCodeAndIntervalUnitOrderByDatetimeDesc(ticker, interval);

        if (latestPrice == null) {
            return createEmptySummaryData(stock);
        }

        return createSummaryDataFromPrice(stock, latestPrice);
    }

    private StockDetailResponse.SummaryData createEmptySummaryData(Stock stock) {
        return new StockDetailResponse.SummaryData(
                stock.getTicker(),
                stock.getName(),
                0.0, 0.0, 0.0, 0L, 0.0,
                PriceChangeSign.FLAT
        );
    }

    private StockDetailResponse.SummaryData createSummaryDataFromPrice(Stock stock, StockPrice latestPrice) {
        double dailyRate = latestPrice.getChangeRate().doubleValue();
        PriceChangeSign sign = estimateSignFromRate(dailyRate);
        
        return new StockDetailResponse.SummaryData(
                stock.getTicker(),
                stock.getName(),
                latestPrice.getClosePrice().doubleValue(),
                dailyRate,
                latestPrice.getChangeAmount().doubleValue(),
                latestPrice.getVolume(),
                0.0,
                sign
        );
    }

    private StockDetailResponse.StockDetailData createStockDetailData(
            Stock stock,
            List<StockDetailResponse.ChartData> chartData,
            StockDetailResponse.SummaryData summaryData) {
        return new StockDetailResponse.StockDetailData(
                stock.getTicker(),
                stock.getName(),
                stock.getEngName(),
                stock.getExchange(),
                stock.getIndustryName(),
                chartData,
                summaryData
        );
    }

    /**
     * DB 데이터의 변동률로부터 PriceChangeSign을 추정하는 헬퍼 메서드
     * (실제 KIS API 부호 정보가 없는 경우 사용)
     */
    private PriceChangeSign estimateSignFromRate(double dailyRate) {
        if (dailyRate > 0) {
            return PriceChangeSign.RISE;
        } else if (dailyRate < 0) {
            return PriceChangeSign.FALL;
        } else {
            return PriceChangeSign.FLAT;
        }
    }
}
