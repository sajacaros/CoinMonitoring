from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text # SQLAlchemy에서 text 함수를 직접 임포트
from typing import List, Optional
from decimal import Decimal # Ensure Decimal is imported
from fastapi.middleware.cors import CORSMiddleware


from . import crud, models, schemas, database
from .config import get_settings

# To allow SQLAlchemy to create tables based on models.
# This is generally more for development. For production, use migrations (e.g., Alembic).
# Ensure your 'kafka_local' schema exists in the database before running this.
# If you have already created tables using your DDL, you might not need this.
# However, it's good for SQLAlchemy to be aware of the schema.
# models.Base.metadata.create_all(bind=database.engine)
# Note: create_all won't create the 'kafka_local' schema itself. That must exist.

settings = get_settings()
app = FastAPI(title="Coin Monitor API", version="0.1.0")

# CORS Middleware
# Allows requests from your React frontend (running on localhost:3000 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_origin, "http://localhost:3000", "http://127.0.0.1:3000"], # Add all expected origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Allow all standard methods
    allow_headers=["*"], # Allow all headers
)

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    """
    Event handler for application startup.
    Checks database connection and ensures the schema for tables exists if using create_all.
    """
    try:
        db = database.SessionLocal()
        # Test database connection
        db.execute(text("SELECT 1"))
        print("Database connection successful.")

        # If you want to ensure tables are created on startup (dev):
        # This requires the 'kafka_local' schema to exist.
        # from sqlalchemy import text
        # with database.engine.connect() as connection:
        #     connection.execute(text("CREATE SCHEMA IF NOT EXISTS kafka_local"))
        #     connection.commit()
        # models.Base.metadata.create_all(bind=database.engine)
        # print("Tables checked/created if they didn't exist within 'kafka_local' schema.")

        db.close()
    except Exception as e:
        print(f"Database connection or table creation failed: {e}")
        # Consider raising an error or exiting if DB is critical for startup
        # raise RuntimeError(f"Startup failed: {e}")


@app.get("/api/markets", response_model=List[str], summary="Get All Available Markets")
def read_markets(db: Session = Depends(get_db)):
    """
    Retrieve a list of all distinct markets (e.g., "KRW-BTC", "KRW-ETH")
    from the ``minutes_candle_info`` table.
    """
    markets = crud.get_distinct_markets(db)
    if not markets:
        # Return empty list if no markets, frontend can handle this
        return []
    return markets

@app.get("/api/chart-data/{market}", response_model=List[schemas.CandleChartData], summary="Get Candle Data for Chart")
def read_chart_data(
    market: str,
    limit: int = Query(120, description="Number of candles to retrieve (e.g., last 120 minutes)", ge=10, le=1000),
    db: Session = Depends(get_db)
):
    """
    Retrieve candle data for a specific market, formatted for OHLC candlestick charts.
    The data includes opening, high, low, close prices, and Bollinger Band values (center, ub, lb).
    Data is returned in chronological order (oldest first) suitable for time-series charts.

    - **market**: The market identifier (e.g., "KRW-BTC"). Case-insensitive handling by backend.
    - **limit**: Number of recent data points to fetch.
    """
    # The market name from URL path is case-sensitive as is.
    # If your DB stores them in a specific case (e.g., uppercase), adjust here or in CRUD.
    # crud.get_candles_for_chart already handles market.upper()
    candles = crud.get_candles_for_chart(db=db, market=market, limit=limit)
    if not candles:
        # Return empty list instead of 404 for a better frontend experience if no data for a market
        return []
    return candles

@app.get("/api/events/{market}", response_model=List[schemas.BollingerEvent], summary="Get Bollinger Band Events")
def read_bollinger_events(
    market: str,
    limit: int = Query(20, description="Number of recent events to retrieve", ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve Bollinger Band touch or cross events for a specific market.
    An event is triggered when the ``trade_price`` touches or crosses the
    upper (``ub``) or lower (``lb``) Bollinger Band.

    - **market**: The market identifier (e.g., "KRW-BTC").
    - **limit**: Number of recent events to fetch.
    """
    # crud.get_bollinger_events handles market.upper()
    events = crud.get_bollinger_events(db=db, market=market, limit=limit)
    if not events:
        return [] # Return empty list if no events
    return events

@app.get("/api/health", summary="Health Check Endpoint")
def health_check():
    """
    Simple health check endpoint to verify if the API is running.
    """
    return {"status": "ok", "message": "API is healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)