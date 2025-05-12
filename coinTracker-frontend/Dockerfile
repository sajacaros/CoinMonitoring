# 1. 빌드 단계 (Node.js 사용)
FROM node:18-alpine AS build

WORKDIR /app

# package.json과 package-lock.json (또는 yarn.lock) 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# React 앱 빌드
# Docker Compose에서 환경변수를 전달받아 빌드 시점에 API 주소를 설정할 수 있습니다.
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

# 2. 서빙 단계 (Nginx 사용)
FROM nginx:1.25-alpine

# 빌드된 정적 파일들을 Nginx의 기본 HTML 디렉토리로 복사
COPY --from=build /app/build /usr/share/nginx/html

# (선택 사항) Nginx 설정 파일 복사 (API 프록시 등을 설정할 경우)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx가 80 포트를 사용하도록 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]