# OCI 배포 가이드 - 타이핑 게임 서버

이 가이드는 타이핑 게임 서버(Flask + 정적 SPA)를 OCI에서 Docker로 배포하는 방법을 설명합니다.

---

## 📋 사전 요구사항

- OCI Compute Instance (Ubuntu 22.04 권장)
- Docker 설치
- Cloudflare Tunnel 설정 권한
- 빌드된 `dist/` 디렉토리 (Vite build)

---

## 📁 프로젝트 구성

```
type-game/
├── dist/                 # Vite 빌드 결과
├── packs/                # 생성된 팩 JSON (영속 저장)
├── server/
│   ├── app.py            # Flask 서버 (API + SPA 서빙)
│   ├── requirements.txt  # Flask/Gunicorn 의존성
│   └── Dockerfile        # 컨테이너 이미지 정의
└── OCI_DEPLOYMENT_GUIDE.md
```

---

## 🚀 배포 절차 (OCI Compute Instance)

### 1) 로컬에서 빌드 및 압축

```bash
cd /mnt/c/Users/USER/OneDrive/Desktop/type-game
npm run build

tar -czf /tmp/typing-game.tar.gz \
  dist/ \
  server/ \
  packs/ \
  .dockerignore
```

### 2) OCI 인스턴스로 전송

```bash
scp -i ~/.ssh/oci_key.pem /tmp/typing-game.tar.gz ubuntu@<OCI_PUBLIC_IP>:~/
```

### 3) 서버에서 압축 해제

```bash
ssh -i ~/.ssh/oci_key.pem ubuntu@<OCI_PUBLIC_IP>

mkdir -p ~/typing-app
cd ~/typing-app
tar -xzf ~/typing-game.tar.gz
```

### 4) Docker 이미지 빌드

```bash
cd ~/typing-app
docker build -t typing-server:latest -f server/Dockerfile .
```

### 5) 컨테이너 실행

```bash
docker run -d \
  --name typing-server \
  --restart unless-stopped \
  -p 5003:5003 \
  -v ~/typing-app/packs:/app/packs \
  -e PUBLIC_BASE_URL=https://typing.youwillspeakkorean.com \
  typing-server:latest
```

### 6) 헬스체크

```bash
curl http://localhost:5003/health
```

---

## 🌐 Cloudflare Tunnel 설정

Cloudflare Tunnel에서 `typing.youwillspeakkorean.com → http://localhost:5003` 라우팅 추가.

**주의**: 포트 5003은 OCI Security List에 열지 않음 (Tunnel 전용).

---

## 🔗 n8n 내부 호출 참고

n8n에서 생성 요청은 **내부 Docker 네트워크**로 호출하는 패턴을 권장합니다.

예시:
```
http://typing-server:5003/api/create-pack-and-redirect
```

동일 Docker 네트워크를 사용하고, 컨테이너 이름(`typing-server`)으로 접근합니다.

---

## 🔧 운영 명령어

```bash
docker ps
docker logs -f typing-server
docker restart typing-server
docker stats typing-server
```

---

## 🔐 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | Flask 포트 | `5003` |
| `PUBLIC_BASE_URL` | 응답 링크 도메인 | 없음 |
| `PACKS_DIR` | 팩 저장 경로 | `/app/packs` |

