from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from . import models, schemas # 같은 디렉토리의 models.py와 schemas.py 임포트
from typing import List


def get_distinct_markets(db: Session) -> List[str]:
    results = db.query(models.MinutesCandleInfo.market).distinct().order_by(models.MinutesCandleInfo.market).all()
    return [result[0] for result in results]

def get_candles_for_chart(db: Session, market: str, limit: int = 120) -> List[schemas.CandleChartData]:
    """
    지정된 마켓의 최근 캔들 데이터를 가져와 차트용 Pydantic 스키마 리스트로 반환합니다.
    데이터는 시간 오름차순으로 정렬됩니다 (차트 표시에 적합).
    """
    # 최근 'limit' 개의 캔들을 가져오기 위한 서브쿼리 (candle_date_time_kst 기준 내림차순)
    subquery = db.query(models.MinutesCandleInfo)\
        .filter(models.MinutesCandleInfo.market == market.upper())\
        .order_by(desc(models.MinutesCandleInfo.candle_date_time_kst))\
        .limit(limit)\
        .subquery('latest_candles') # 서브쿼리에 별칭 부여

    # 서브쿼리 결과를 다시 시간 오름차순으로 정렬
    db_candles = db.query(subquery)\
        .order_by(subquery.c.candle_date_time_kst)\
        .all()

    chart_data_list: List[schemas.CandleChartData] = []
    for candle in db_candles:
        chart_data_list.append(
            schemas.CandleChartData(
                t=candle.candle_date_time_kst, # datetime 객체
                o=candle.opening_price,        # Decimal 또는 None
                h=candle.high_price,           # Decimal 또는 None
                l=candle.low_price,            # Decimal 또는 None
                c=candle.trade_price,          # Decimal (non-nullable 가정)
                center=candle.center,          # Decimal 또는 None
                ub=candle.ub,                  # Decimal 또는 None
                lb=candle.lb                   # Decimal 또는 None
            )
        )
    return chart_data_list


def get_bollinger_events(db: Session, market: str, limit: int = 20) -> List[schemas.BollingerEvent]:
    """
    지정된 마켓의 볼린저 밴드 관련 이벤트를 Pydantic 스키마 리스트로 반환합니다.
    이벤트는 발생 시간의 내림차순 (최신 이벤트 먼저)으로 정렬됩니다.
    """
    # 볼린저 밴드 이벤트 조건:
    # 1. 상단 밴드(ub)가 NULL이 아니고, 현재가가 상단 밴드보다 크거나 같은 경우
    # 2. 하단 밴드(lb)가 NULL이 아니고, 현재가가 하단 밴드보다 작거나 같은 경우
    event_condition = or_(
        and_(
            models.MinutesCandleInfo.ub != None,  # ub가 NULL이 아닌 경우에만 비교
            models.MinutesCandleInfo.trade_price >= models.MinutesCandleInfo.ub
        ),
        and_(
            models.MinutesCandleInfo.lb != None,  # lb가 NULL이 아닌 경우에만 비교
            models.MinutesCandleInfo.trade_price <= models.MinutesCandleInfo.lb
        )
    )

    db_events_query = db.query(models.MinutesCandleInfo) \
        .filter(models.MinutesCandleInfo.market == market.upper()) \
        .filter(event_condition) \
        .order_by(desc(models.MinutesCandleInfo.candle_date_time_kst)) \
        .limit(limit)

    db_events = db_events_query.all()

    bollinger_events_list: List[schemas.BollingerEvent] = []
    for candle in db_events:
        event_type = "Unknown Event"
        # 이벤트 타입 결정
        if candle.ub is not None and candle.trade_price is not None:
            if candle.trade_price > candle.ub:
                event_type = "Crossed Above Upper Band"
            elif candle.trade_price == candle.ub:
                event_type = "Touched Upper Band"

        # 이미 상단 밴드 이벤트로 결정되지 않았고, 하단 밴드 조건 확인
        if event_type == "Unknown Event" and candle.lb is not None and candle.trade_price is not None:
            if candle.trade_price < candle.lb:
                event_type = "Crossed Below Lower Band"
            elif candle.trade_price == candle.lb:
                event_type = "Touched Lower Band"

        # 만약 trade_price가 ub/lb와 동시에 같을 수 있는 극단적인 경우 (예: ub == lb == price)
        # 위의 로직은 상단 밴드 이벤트를 우선합니다. 필요시 조정 가능.

        # 만약 위에서 event_type이 여전히 "Unknown Event"라면,
        # 이는 매우 드문 경우이거나 데이터에 이상이 있을 수 있습니다.
        # (예: trade_price가 null이거나, ub/lb가 null인데 event_condition을 통과한 경우 - and_ 조건으로 방지)
        # 여기서는 event_condition을 통과했으므로 최소한 하나의 조건은 만족했을 것입니다.
        # 다만, 위에서 event_type을 결정하는 로직이 모든 event_condition의 경우를 커버하는지 확인합니다.
        # 만약 trade_price가 ub보다 크면서 동시에 lb보다 작은 경우는 없으므로,
        # 하나의 candle이 상단과 하단 이벤트를 동시에 발생시키는 경우는 없습니다.
        # (단, ub < lb 인 비정상적인 데이터가 아니라면)

        if event_type != "Unknown Event":  # 유효한 이벤트 타입이 결정된 경우에만 추가
            bollinger_events_list.append(
                schemas.BollingerEvent(
                    market=candle.market,
                    candle_date_time_kst=candle.candle_date_time_kst,
                    trade_price=candle.trade_price,
                    event_type=event_type,
                    ub=candle.ub,
                    lb=candle.lb
                )
            )
    return bollinger_events_list