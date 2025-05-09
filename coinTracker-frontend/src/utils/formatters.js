// src/utils/formatters.js
export const formatKST = (dateString) => {
  if (!dateString) return ""; // 날짜 문자열이 없는 경우 빈 문자열 반환
  const date = new Date(dateString);
  const options = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24시간 형식 사용
  };
  return date.toLocaleString("ko-KR", options);
};
