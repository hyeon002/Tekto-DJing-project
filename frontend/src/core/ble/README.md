# core/ble

Web Bluetooth 기반 연결/수신 모듈. React에 의존하지 않는 순수 TypeScript 모듈.

물리 디제잉 모듈(노브/슬라이더/조그휠, 각 ESP32-C3 탑재)과의 BLE 연결 수립, GATT
notify 구독, 수신 값을 core/audio 모듈에 전달하는 역할을 담당한다.

Web Bluetooth 제약:
- HTTPS 또는 localhost에서만 동작
- iOS/iPadOS 브라우저 미지원
- 연결은 사용자 제스처(클릭) 안에서만 시작 가능 — `navigator.bluetooth.requestDevice()`
  호출은 반드시 버튼 클릭 핸들러 등 사용자 액션 내부에서 이루어져야 함

아직 구현 없음 — 추후 작업에서 작성 예정.
