# CoinMonitoring

## 실행

```
$ coinTracker-backend
$ pip install -r requirements.txt
$ vi .env 			# config
$ uvicorn app.main:app --reload
```

## 실행

```
$ cd coinTracker-frontend
$ npm install
$ npm start
```

## docker

### .env 준비

```
$ cp .env_template .env # configure
```

### build 및 실행

```
$ docker-compose up --build
```

### docker hub push

```
$ docker login
$ docker-compose push
```
