# TEKTO STUDIO

물리 디제잉 모듈(노브/슬라이더/조그휠, 각각 ESP32-C3 탑재)이 BLE로 값을 보내면,
Chrome 웹앱이 Web Bluetooth로 받아 Web Audio API로 실시간 사운드 처리(템포/EQ/
크로스페이더)를 하고, Canvas 기반 도트 비주얼라이저가 오디오와 조작에 반응하는
산업디자인 전시 데모용 웹앱.

## 실행 방법

### frontend

```
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 확인. `http://localhost:5173/tools/xxx.html` 로 개발용
검증 페이지(React와 무관한 단독 HTML)도 접속 가능.

### backend (선택)

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

전시 데모는 프론트 단독으로 완전히 동작한다. 백엔드는 믹싱 로그, 플레이리스트 저장
등 선택적 부가 기능 전용이며, 꺼져 있어도 앱은 정상 동작해야 한다.

## 중요 제약

- **Web Bluetooth는 HTTPS 또는 localhost에서만 동작한다.** 일반 HTTP로 배포된
  페이지에서는 BLE 연결이 불가능하다.
- **iOS/iPadOS 브라우저는 Web Bluetooth를 지원하지 않는다.** 전시 기기는 Windows,
  Mac, Android Chrome을 사용한다.
- **BLE 연결은 반드시 사용자 클릭 등 사용자 제스처 내에서만 시작할 수 있다.**
  페이지 로드 시 자동으로 연결을 시도할 수 없다.
