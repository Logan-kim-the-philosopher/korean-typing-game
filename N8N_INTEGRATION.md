# n8n 연동 가이드 - 타이핑 게임

이 문서는 n8n 컨테이너가 타이핑 게임 서버를 **내부 Docker नेटवर्क**로 호출하는 방법을 설명합니다.

---

## ✅ 핵심 원칙

- Cloudflare Tunnel은 **외부 → 내부**만 지원
- n8n에서 API 호출은 **내부 Docker 네트워크**로 해야 함
- 컨테이너 이름을 호스트명으로 사용 (예: `typing-server`)

---

## 1) 공용 Docker 네트워크 생성

```bash
docker network create oci-services
```

---

## 2) 타이핑 서버 컨테이너 실행 (네트워크 포함)

```bash
docker run -d \
  --name typing-server \
  --network oci-services \
  --restart unless-stopped \
  -p 5003:5003 \
  -v ~/typing-app/packs:/app/packs \
  -e PUBLIC_BASE_URL=https://typing.youwillspeakkorean.com \
  typing-server:latest
```

---

## 3) n8n 컨테이너 실행 (네트워크 포함)

```bash
docker run -d \
  --name n8n-docker \
  --network oci-services \
  --restart unless-stopped \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=<password> \
  n8nio/n8n:latest
```

---

## 4) 기존 컨테이너에 네트워크 추가 (이미 실행 중일 때)

```bash
docker network connect oci-services typing-server
docker network connect oci-services n8n-docker
```

---

## 5) n8n에서 호출할 API URL

```
http://typing-server:5003/api/create-pack-and-redirect
```

---

## ⚠️ 주의

- n8n에서 `https://typing.youwillspeakkorean.com`으로 직접 호출하면 실패할 수 있음
- 반드시 내부 네트워크 주소로 호출

