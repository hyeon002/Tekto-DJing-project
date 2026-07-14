# backend

TEKTO STUDIO 백엔드 — FastAPI 최소 뼈대.

**중요:** 전시 데모는 프론트 단독으로 동작하며, 백엔드는 선택적 부가 기능(예: 믹싱
로그, 플레이리스트 저장) 전용이다. 백엔드가 꺼져 있어도 앱은 완전히 동작해야 한다.

## 실행 방법

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 엔드포인트

- `GET /health` — 헬스체크. 나머지 엔드포인트는 추후 추가.
