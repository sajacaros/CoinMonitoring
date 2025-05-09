import React from "react";
import ReactDOM from "react-dom/client"; // React 18의 createRoot API 임포트
import "./index.css"; // 전역 CSS 파일 (선택 사항, 파일이 없다면 이 줄은 제거하거나 주석 처리)
import App from "./App"; // 메인 App 컴포넌트 임포트

const rootElement = document.getElementById("root");

// rootElement가 null이 아닌지 확인하는 것이 좋습니다.
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error(
    "Failed to find the root element. Ensure an element with ID 'root' exists in your HTML."
  );
}
