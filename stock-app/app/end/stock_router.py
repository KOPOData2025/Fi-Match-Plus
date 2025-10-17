"""주가 데이터 HTTP 엔드포인트"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_async_session
from app.models.schemas import (
    StockPriceCollectionRequest,
    ErrorResponse
)
from app.services.prices.stock_price_service import StockPriceService
from app.utils.logger import get_logger, log_api_request

logger = get_logger(__name__)
router = APIRouter(prefix="/stock-price", tags=["stock-price"])


@router.post(
    "/collect/{symbol}",
    response_model=dict,
    summary="특정 종목 주가 데이터 수집",
    description="특정 종목의 연월봉 데이터를 수집합니다."
)
async def collect_stock_prices_by_symbol(
    symbol: str = Path(..., description="종목코드"),
    interval: str = Query("1Y", description="시간간격 (1Y/1M)"),
    start_date: Optional[datetime] = Query(None, description="시작일"),
    end_date: Optional[datetime] = Query(None, description="종료일"),
    session: AsyncSession = Depends(get_async_session)
):
    """특정 종목의 주가 데이터 수집"""
    log_api_request(
        logger, 
        method="POST", 
        url=f"/stock-price/collect/{symbol}",
        symbol=symbol,
        interval=interval,
        start_date=start_date,
        end_date=end_date
    )
    
    try:
        if interval not in ["1d"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid interval."
            )
        
        stock_price_service = StockPriceService(session)
        
        collection_request = StockPriceCollectionRequest(
            symbols=[symbol],
            interval=interval,
            start_date=start_date,
            end_date=end_date
        )
        
        result = await stock_price_service.collect_stock_prices(collection_request)
        
        logger.info(
            "종목별 주가 데이터 수집 완료",
            symbol=symbol,
            interval=interval,
            count=len(result.get(symbol, []))
        )
        
        return {
            "message": "Stock prices collected successfully",
            "symbol": symbol,
            "interval": interval,
            "count": len(result.get(symbol, [])),
            "data": result
        }
    
    except Exception as e:
        logger.error(
            "종목별 주가 데이터 수집 실패",
            error=str(e),
            symbol=symbol
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/collect",
    response_model=dict,
    summary="특정 날짜 일봉 데이터 수집",
    description="특정 날짜의 일봉 데이터를 수집합니다."
)
async def collect_daily_prices_by_date(
    date: datetime = Query(..., description="날짜 (yyyyMMdd 형식)"),
    session: AsyncSession = Depends(get_async_session)
):
    """특정 날짜의 일봉 데이터 수집"""
    log_api_request(
        logger, 
        method="POST", 
        url="/stock-price/collect",
        date=date
    )
    
    try:
        stock_price_service = StockPriceService(session)
        
        collection_request = StockPriceCollectionRequest(
            symbols=[],
            interval="1d",
            start_date=date,
            end_date=date
        )
        
        result = await stock_price_service.collect_stock_prices(collection_request)
        
        total_count = sum(len(prices) for prices in result.values())
        
        logger.info(
            "날짜별 일일 데이터 수집 완료",
            date=date,
            total_count=total_count
        )
        
        return {
            "message": "Daily prices collected successfully",
            "date": date,
            "total_count": total_count,
            "data": result
        }
    
    except Exception as e:
        logger.error(
            "날짜별 일일 데이터 수집 실패",
            error=str(e),
            date=date
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/collect/batch",
    response_model=dict,
    summary="배치 주가 데이터 수집",
    description="여러 종목의 주가 데이터를 배치로 수집합니다."
)
async def collect_stock_prices_batch(
    request: StockPriceCollectionRequest,
    session: AsyncSession = Depends(get_async_session)
):
    """배치 주가 데이터 수집"""
    try:
        if len(request.symbols) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 symbols allowed per batch"
            )
        
        stock_price_service = StockPriceService(session)
        
        result = await stock_price_service.collect_stock_prices(request)
        
        total_count = sum(len(prices) for prices in result.values())
        
        logger.info(
            "배치 주가 데이터 수집 완료",
            symbols=request.symbols,
            interval=request.interval,
            total_count=total_count
        )
        
        return {
            "message": "Batch stock prices collected successfully",
            "symbols": request.symbols,
            "interval": request.interval,
            "total_count": total_count,
            "data": result
        }
    
    except Exception as e:
        logger.error(
            "배치 주가 데이터 수집 실패",
            error=str(e),
            symbols=request.symbols
        )
        raise HTTPException(status_code=500, detail=str(e))
