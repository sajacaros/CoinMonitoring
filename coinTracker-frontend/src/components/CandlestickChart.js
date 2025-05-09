import React, { useEffect, useRef, memo } from "react";
import { createChart, TickMarkType } from "lightweight-charts";

const CandlestickChart = ({ chartData }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const bbCenterSeriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#e1e1e1" },
        horzLines: { color: "#e1e1e1" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false, // 초 단위 표시는 필요에 따라 true로 변경
        // tickMarkFormatter 추가
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const date = new Date(time * 1000); // Lightweight Charts는 초 단위 UNIX 타임스탬프를 제공

          // tickMarkType에 따라 다른 포맷 제공
          // (예: 'Year', 'Month', 'Day', 'Time', 'TimeWithSeconds')
          const kstOptionsBase = {
            timeZone: "Asia/Seoul",
            hour12: false,
          };

          switch (tickMarkType) {
            case TickMarkType.Year:
              return date.toLocaleDateString("ko-KR", {
                ...kstOptionsBase,
                year: "numeric",
              });
            case TickMarkType.Month:
              return date.toLocaleDateString("ko-KR", {
                ...kstOptionsBase,
                month: "short",
                year: "numeric",
              }); // 예: '2023년 5월'
            case TickMarkType.Day:
              // 일 단위 표시는 날짜만 표시하거나, 월/일로 표시
              return date.toLocaleDateString("ko-KR", {
                ...kstOptionsBase,
                month: "2-digit",
                day: "2-digit",
              }); // 예: '05. 10.'
            case TickMarkType.Time:
            case TickMarkType.TimeWithSeconds: // Time과 TimeWithSeconds를 동일하게 처리 (HH:mm)
              return date.toLocaleTimeString("ko-KR", {
                ...kstOptionsBase,
                hour: "2-digit",
                minute: "2-digit",
              }); // 예: '14:30'
            default:
              // 기본값 (혹은 더 상세한 포맷)
              return date.toLocaleTimeString("ko-KR", {
                ...kstOptionsBase,
                hour: "2-digit",
                minute: "2-digit",
              });
          }
        },
      },
    });

    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    bbUpperSeriesRef.current = chartRef.current.addLineSeries({
      color: "rgba(0, 0, 255, 0.7)",
      lineWidth: 1,
      lineStyle: 2, // Dotted
      priceLineVisible: false,
      lastValueVisible: false,
    });
    bbCenterSeriesRef.current = chartRef.current.addLineSeries({
      color: "rgba(255, 165, 0, 0.7)",
      lineWidth: 1,
      lineStyle: 2, // Dotted
      priceLineVisible: false,
      lastValueVisible: false,
    });
    bbLowerSeriesRef.current = chartRef.current.addLineSeries({
      color: "rgba(0, 0, 255, 0.7)",
      lineWidth: 1,
      lineStyle: 2, // Dotted
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, 400);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      !chartData ||
      chartData.length === 0 ||
      !candlestickSeriesRef.current ||
      !bbUpperSeriesRef.current ||
      !bbLowerSeriesRef.current ||
      !bbCenterSeriesRef.current
    ) {
      return;
    }

    const ohlcData = chartData.map((d) => ({
      time: new Date(d.t).getTime() / 1000, // lightweight-charts expects seconds
      open: parseFloat(d.o),
      high: parseFloat(d.h),
      low: parseFloat(d.l),
      close: parseFloat(d.c),
    }));

    const bbUpperData = chartData
      .filter((d) => d.ub !== null && d.ub !== undefined)
      .map((d) => ({
        time: new Date(d.t).getTime() / 1000,
        value: parseFloat(d.ub),
      }));

    const bbCenterData = chartData
      .filter((d) => d.center !== null && d.center !== undefined)
      .map((d) => ({
        time: new Date(d.t).getTime() / 1000,
        value: parseFloat(d.center),
      }));

    const bbLowerData = chartData
      .filter((d) => d.lb !== null && d.lb !== undefined)
      .map((d) => ({
        time: new Date(d.t).getTime() / 1000,
        value: parseFloat(d.lb),
      }));

    candlestickSeriesRef.current.setData(ohlcData);
    bbUpperSeriesRef.current.setData(bbUpperData);
    bbCenterSeriesRef.current.setData(bbCenterData);
    bbLowerSeriesRef.current.setData(bbLowerData);

    // Auto-fit view
    if (chartRef.current && ohlcData.length > 0) {
      // chartRef.current.timeScale().fitContent(); // 주석 처리 또는 조건부 실행
    }
  }, [chartData]);

  return (
    <div ref={chartContainerRef} style={{ width: "100%", height: "400px" }} />
  );
};

export default memo(CandlestickChart); // 차트 데이터가 자주 변경되므로 memo로 감싸 최적화
