# 1. Python 베이스 이미지 선택
FROM python:3.9-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 애플리케이션 소스 코드 복사
# 여기서는 app 폴더만 복사하지만, 필요에 따라 backend 폴더 전체를 복사할 수도 있습니다.
# COPY . .  # backend 폴더 전체를 복사하는 경우
COPY ./app ./app

# 5. Uvicorn 서버 실행
# app.main:app 은 main.py 파일 안에 있는 app 객체를 의미합니다.
# 만약 main.py가 backend 폴더 바로 밑에 있다면 CMD ["uvicorn", "main:app", ...]
# 여기서는 app 폴더 안에 main.py가 있으므로 app.main:app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]