import React, { useState, useEffect, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import CandlestickChart from "./components/CandlestickChart";
import EventToast from "./components/EventToast";
import "./App.css";

// 백엔드 API의 기본 URL을 설정합니다.
const BASE_URL = "http://localhost:8000"; // 실제 API 주소로 변경해주세요.
const CHART_DATA_LIMIT = 120; // 한 번에 가져올 차트 데이터 개수
const EVENT_DATA_LIMIT = 20; // 한 번에 가져올 이벤트 데이터 개수
const POLLING_INTERVAL = 10000; // 데이터 폴링 간격 (10초)

function App() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSeenEventTimestamp, setLastSeenEventTimestamp] = useState(null);
  const lastSeenEventTimestampRef = useRef(lastSeenEventTimestamp);

  useEffect(() => {
    lastSeenEventTimestampRef.current = lastSeenEventTimestamp;
  }, [lastSeenEventTimestamp]);

  // API 호출 함수
  const fetchData = useCallback(async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `API Error: ${response.status} ${
            errorData.message || response.statusText
          }`
        );
      }
      return await response.json();
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      return null;
    }
  }, []);

  // 마켓 목록 가져오기
  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoading(true);
      setError(null); // 이전 에러 메시지 초기화
      console.log("useEffect: Fetching markets..."); // 로그 추가
      const data = await fetchData("/api/markets");
      if (data) {
        console.log("useEffect: Markets data received:", data); // 로그 추가
        setMarkets(data);
        if (data.length > 0) {
          // selectedMarket이 아직 설정되지 않았을 때만 기본값 설정
          // setSelectedMarket(currentSelectedMarket => currentSelectedMarket || data[0].market);
          // 위보다는 아래처럼 명시적으로 초기 상태('')를 확인하는 것이 나을 수 있습니다.
          if (!selectedMarket) {
            // 초기 상태이거나, 아직 마켓 선택이 안 된 경우
            console.log(
              "useEffect: Setting default selected market to:",
              data[0].market
            ); // 로그 추가
            setSelectedMarket(data[0].market);
          }
        } else {
          console.log("useEffect: No markets found in data."); // 로그 추가
          setError("사용 가능한 마켓이 없습니다.");
        }
      } else {
        console.log("useEffect: Failed to fetch markets or data is null."); // 로그 추가
        // fetchData 함수 내에서 setError가 호출될 수 있음
      }
      setIsLoading(false);
    };
    fetchMarkets();
  }, [fetchData]);

  // 차트 데이터 및 이벤트 데이터 가져오기 (폴링)
  useEffect(() => {
    if (!selectedMarket) return;

    let intervalId = null; // intervalId 초기화

    const fetchMarketData = async () => {
      const newChartData = await fetchData(
        `/api/chart-data/${selectedMarket}?limit=${CHART_DATA_LIMIT}`
      );
      if (newChartData) {
        // console.log("setInterval: Chart data received.");
        setChartData(newChartData);
      }

      const newEvents = await fetchData(
        `/api/events/${selectedMarket}?limit=${EVENT_DATA_LIMIT}`
      );
      if (newEvents && newEvents.length > 0) {
        const latestEvent = newEvents[0];
        const eventTime = new Date(latestEvent.candle_date_time_kst).getTime();

        if (
          latestEvent.event_type === "Crossed Above Upper Band" ||
          latestEvent.event_type === "Crossed Below Lower Band"
        ) {
          // lastSeenEventTimestamp는 stale closure 문제를 피하기 위해 ref를 사용하거나,
          // 이 effect가 재실행되도록 의존성 배열에 두어야 합니다.
          // 현재는 의존성 배열에 있으므로, setLastSeenEventTimestamp 호출 시 effect가 재실행됩니다.
          if (
            !lastSeenEventTimestampRef.current ||
            eventTime > lastSeenEventTimestampRef.current
          ) {
            console.log(
              `%csetInterval: BTC Upper Band event DETECTED for ${selectedMarket}:`,
              "color: orange; font-weight: bold;",
              latestEvent
            );

            toast(
              (
                t // t는 react-hot-toast가 제공하는 토스트 제어 객체 (id, visible 등)
              ) => (
                // EventToast 컴포넌트에 event 객체와 t.id를 toastId로 전달
                <EventToast event={latestEvent} toastId={t.id} />
              ),
              {
                duration: 6000, // 6초 후 자동 닫힘 (닫기 버튼으로 수동 닫기 가능)
                position: "top-right",
                style: { border: "1px solid #4CAF50", padding: "16px" },
              }
            );

            // 5. setLastSeenEventTimestamp 호출 (상태 업데이트)
            //    - 알림을 보낸 이벤트의 시간으로 상태를 업데이트합니다.
            //    - 이 호출로 인해 위 3번 useEffect가 실행되어 ref 값도 업데이트됩니다.
            setLastSeenEventTimestamp(eventTime);
          }
        }
      }
    };

    // selectedMarket이 변경되었을 때, 또는 lastSeenEventTimestamp가 변경되었을 때
    // 먼저 데이터를 한 번 가져옵니다.
    console.log(
      `useEffect: Chart/Event Polling - Calling fetchMarketData initially for ${selectedMarket}.`
    );
    fetchMarketData();

    intervalId = setInterval(fetchMarketData, POLLING_INTERVAL);
    console.log(
      `useEffect: Chart/Event Polling - setInterval SET with ID: ${intervalId} for market ${selectedMarket}. Interval: ${POLLING_INTERVAL}ms`
    );

    return () => {
      console.log(
        `%cuseEffect: Chart/Event Polling - clearInterval CALLED with ID: ${intervalId} for market ${selectedMarket}.`,
        "color: red;"
      );
      clearInterval(intervalId);
    };
  }, [
    selectedMarket,
    fetchData,
    lastSeenEventTimestamp,
    CHART_DATA_LIMIT,
    EVENT_DATA_LIMIT,
    POLLING_INTERVAL,
  ]);

  const handleMarketChange = (event) => {
    const newMarket = event.target.value;
    console.log("Market changed to:", newMarket); // 여기 확인!
    setSelectedMarket(newMarket);
    setChartData([]);
    setLastSeenEventTimestamp(null);
  };

  return (
    <div className="App">
      <Toaster
        position="top-right" // 기본 위치 설정 (개별 토스트에서 재정의 가능)
        toastOptions={{}}
      />
      <header className="App-header">
        <h1>Real-time Crypto Monitor</h1>
        <div className="controls">
          <label htmlFor="market-select">Select Market: </label>
          <select
            id="market-select"
            value={selectedMarket}
            onChange={handleMarketChange}
            disabled={isLoading || markets.length === 0}
          >
            {markets.length === 0 && !isLoading && (
              <option key="loading-placeholder" value="">
                Loading markets...
              </option>
            )}
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="error-message">Error: {error}</div>}
      {isLoading && !chartData.length && (
        <div className="loading-message">Loading chart data...</div>
      )}

      <div className="chart-container">
        {selectedMarket && chartData.length > 0 ? (
          <CandlestickChart chartData={chartData} />
        ) : (
          !isLoading &&
          selectedMarket && <p>No chart data available for {selectedMarket}.</p>
        )}
        {!selectedMarket && !isLoading && (
          <p>Please select a market to view the chart.</p>
        )}
      </div>
    </div>
  );
}

export default App;
