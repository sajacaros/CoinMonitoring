// src/components/EventToast.js
import React from "react";
import { toast } from "react-hot-toast"; // react-hot-toast에서 toast 함수를 직접 import
import { formatKST } from "../utils/formatters";
import "./EventToast.css"; // EventToast를 위한 CSS 파일 (아래에 예시)

const EventToast = ({ event, toastId }) => {
  // toastId를 prop으로 받음
  if (!event) {
    return null;
  }

  const { market, event_type, trade_price, candle_date_time_kst } = event;

  let eventTypeText = "이벤트 발생";
  if (event_type === "Crossed Above Upper Band") {
    eventTypeText = "상단 터치!";
  } else if (event_type === "Crossed Below Lower Band") {
    eventTypeText = "하단 터치!";
  }

  // 닫기 버튼 클릭 시 해당 토스트를 닫는 함수
  const handleClose = () => {
    console.log("토스트 닫기 클릭됨"); // 디버깅용 로그
    if (toastId) {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="event-toast-container">
      <div className="event-toast-content">
        <strong>
          🔔 {market} - {eventTypeText}
        </strong>
        <br />
        가격: {parseFloat(trade_price).toFixed(2)}
        <br />
        시간: {formatKST(candle_date_time_kst)}
      </div>
      <button
        onClick={handleClose}
        className="event-toast-close-button"
        aria-label="닫기" // 접근성을 위한 라벨
      >
        &times; {/* HTML 엔티티로 'X' 문자 표시 */}
      </button>
    </div>
  );
};

export default EventToast;
