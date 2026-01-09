# Cloudflare Tunnel 설정 - 타이핑 게임

타이핑 게임 서버(Flask, 포트 5003)를 Cloudflare Tunnel로 외부에 공개하는 설정 가이드입니다.

---

## ✅ 목표

`typing.youwillspeakkorean.com` → `http://localhost:5003`

---

## 1) Cloudflare Zero Trust에서 터널 선택

이미 `oci-services` 터널을 사용 중이라면 **같은 터널에 Public Hostname 추가**가 가장 간단합니다.

- Tunnel: `oci-services`
- Public Hostname 추가
  - Subdomain: `typing`
  - Domain: `youwillspeakkorean.com`
  - Service: `http://localhost:5003`

---

## 2) DNS 확인

Cloudflare DNS에 다음 레코드가 자동 생성됩니다:

```
typing.youwillspeakkorean.com  CNAME  <tunnel-id>.cfargotunnel.com  Proxied
```

---

## 3) 로컬 포트 노출 금지

OCI Security List에서 **포트 5003은 열지 않습니다.**
Cloudflare Tunnel만 통해 접근하도록 유지합니다.

---

## 4) 점검 방법

```bash
curl http://localhost:5003/health
curl https://typing.youwillspeakkorean.com/health
```

정상 응답 예시:
```json
{"status":"healthy","service":"typing-game"}
```

