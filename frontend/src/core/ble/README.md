# core/ble

Web Bluetooth 기반 연결/수신 모듈. React에 의존하지 않는 순수 TypeScript 모듈.

물리 디제잉 모듈(노브/슬라이더/조그휠, 각 ESP32-C3 탑재)과의 BLE 연결 수립, GATT
notify 구독, 수신 값을 core/audio 모듈에 전달하는 역할을 담당한다.

Web Bluetooth 제약:
- HTTPS 또는 localhost에서만 동작
- iOS/iPadOS 브라우저 미지원
- 연결은 사용자 제스처(클릭) 안에서만 시작 가능 — `navigator.bluetooth.requestDevice()`
  호출은 반드시 버튼 클릭 핸들러 등 사용자 액션 내부에서 이루어져야 함

## gattNotifyConnection.ts

GATT connect + notify 구독 공용 로직 (`GattNotifyConnection<T>`). 서비스/특성 UUID와
값 파싱 함수를 옵션으로 받아 연결 수립, 끊김 감지, 지수 백오프 자동 재연결을 처리한다.
knob.ts/slider.ts가 이 클래스를 상속해서 각자의 UUID·파싱 로직만 채운다.

- 초기에는 모듈별로 non-connectable 광고(manufacturer data)의
  `watchAdvertisements()`를 각자 구현했었으나, 실기기 테스트 중 연결 직후엔 되다가
  시간이 지나면 값이 끊기는 문제가 재현되어 GATT notify로 전환함. 광고를 반복
  stop/start하며 값을 실어보내던 펌웨어 쪽 패턴이 ESP32 BLE 스택 메모리 단편화로
  방송을 조용히 멈추는 게 원인으로 추정. notify는 연결 후 광고 재시작이 없어 이
  문제가 구조적으로 없다.

## knob.ts / slider.ts

노브·슬라이더 연결 담당 (각각 knob.ino/slider.ino와 서비스·특성 UUID가 반드시 일치해야
함). 값은 기기에서 이미 정규화되어 오므로(노브 0~100, 슬라이더 0~1000) 여기서 0~1로
변환만 한다.

조그휠은 아직 물리 구현이 없어 미작성 (UI 반영이 없는 모듈이라 값 표시용 화면도 필요
없음 — 나중에 오디오 트랙 전환 트리거로만 core/audio에 연결하면 됨).
