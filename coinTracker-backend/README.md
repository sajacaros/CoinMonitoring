# CoinTracker
## 설치
```
$ pip install -r requirements.txt
```
## 설정
```
$ cp .env_template .env  
$ vi .env           # modify .env
```
## 실행 방법
```
$ uvicorn app.main:app --reload
```