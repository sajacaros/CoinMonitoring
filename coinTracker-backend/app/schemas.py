from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class CandleBase(BaseModel): # 공통 필드를 위한 기본 모델
    market: str
    # ... other common fields ...

    class Config:
        from_attributes = True # Pydantic V2 이상 (이전 버전에서는 orm_mode = True)
        # Decimal 타입을 JSON으로 변환 시 float으로 처리하고 싶다면 json_encoders 사용 가능

class CandleChartData(BaseModel): # CandleBase 상속 가능
    t: datetime # candle_date_time_kst
    o: Optional[Decimal] # opening_price
    h: Optional[Decimal] # high_price
    l: Optional[Decimal] # low_price
    c: Decimal         # trade_price
    center: Optional[Decimal]
    ub: Optional[Decimal]
    lb: Optional[Decimal]

    class Config:
        from_attributes = True

class BollingerEvent(BaseModel):
    market: str
    candle_date_time_kst: datetime
    trade_price: Decimal
    event_type: str
    ub: Optional[Decimal]
    lb: Optional[Decimal]

    class Config:
        from_attributes = True