# core/serial

Web Serial 기반 연결/수신 모듈. React에 의존하지 않는 순수 TypeScript 모듈.

**현재는 미사용.** 원래 조그휠의 터치 On/Off 신호만 USB Serial로 들어올 것으로
가정하고 만들어졌으나(하드웨어 팀 확인 전 추정), 실제 조그휠 펌웨어 확인 결과
조그휠도 슬라이더/노브와 동일하게 **BLE**(`core/ble/JogBleLink.ts`, `BLEMIDI_1`)로
터치 상태를 보낸다는 게 확정됐다. 그래서 지금은 이 모듈로 아무 데이터도 안 들어옴
— 나중에 Serial 경로가 다시 필요해질 가능성을 대비해 코드는 남겨뒀다.

Web Serial 제약:
- HTTPS 또는 localhost에서만 동작 (BLE와 동일)
- 연결은 사용자 제스처(클릭) 안에서만 시작 가능 — `navigator.serial.requestPort()`
  호출은 반드시 버튼 클릭 핸들러 등 사용자 액션 내부에서 이루어져야 함
- 표준 TS DOM lib에 타입이 없어 `web-serial.d.ts`에 최소 앰비언트 선언을 직접 둠

## 현재 상태

`JogSerialLink.ts`에 프로토타입 구현 완료. 터치 시작/해제를 판별하는 정규식
(`TOUCH_ON_PATTERN`, `TOUCH_OFF_PATTERN`)은 파일 상단에 상수로 분리되어 있으며,
실제 하드웨어의 시리얼 출력 문자열이 확정되면 이 두 줄만 수정하면 된다. 수신되는
모든 원본 라인은 콘솔에 그대로 로그되고, 디버그 패널 UI에도 표시된다.
