from sqlalchemy import Column, Numeric, String, TIMESTAMP, PrimaryKeyConstraint # PrimaryKeyConstraint를 import 했는지 확인
# from sqlalchemy.ext.declarative import declarative_base # 이전 방식
from sqlalchemy.orm import declarative_base # 최신 방식 (SQLAlchemy 1.4+ 권장)

# database.py에서 Base를 정의하고 가져오는 것을 권장합니다.
# from .database import Base
# 만약 database.py에 Base가 없다면 여기서 직접 생성할 수 있습니다.
Base = declarative_base()

class MinutesCandleInfo(Base):
    __tablename__ = "minutes_candle_info"

    # __table_args__ 설정:
    # 1. PrimaryKeyConstraint 객체가 먼저 와야 합니다.
    # 2. 그 다음, 스키마 정보를 담은 딕셔너리가 와야 합니다.
    # 3. 이 전체는 튜플 (소괄호)로 묶여야 합니다.
    __table_args__ = (
        PrimaryKeyConstraint('market', 'candle_date_time_kst', name='minutes_candle_info_pkey'), # 기본 키 제약 조건
        {'schema': 'kafka_local'}  # 스키마 지정 (항상 딕셔너리 형태로, 제약조건들 뒤에 위치)
    )

    # 컬럼 정의:
    low_price = Column(Numeric(50, 20))
    trade_price = Column(Numeric(50, 20), nullable=False)
    timestamp_val = Column("timestamp", String(100)) # 실제 DB 컬럼명이 "timestamp"인 경우
    candle_acc_trade_price = Column(Numeric(50, 20))
    candle_acc_trade_volume = Column(Numeric(50, 20))

    # 복합 기본 키의 일부인 컬럼들은 Column 정의에서 primary_key=True를 설정하지 않습니다.
    # __table_args__의 PrimaryKeyConstraint가 이를 처리합니다.
    market = Column(String(100), nullable=False) # primary_key=True 제거
    candle_date_time_utc = Column(TIMESTAMP)
    candle_date_time_kst = Column(TIMESTAMP, nullable=False) # primary_key=True 제거

    opening_price = Column(Numeric(50, 20))
    unit = Column(Numeric(50, 20))
    high_price = Column(Numeric(50, 20))
    center = Column(Numeric(50, 20))
    ub = Column(Numeric(50, 20))
    lb = Column(Numeric(50, 20))