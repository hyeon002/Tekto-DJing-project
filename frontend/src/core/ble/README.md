# core/ble

Web Bluetooth 기반 연결/수신 모듈. React에 의존하지 않는 순수 TypeScript 모듈.

물리 디제잉 모듈(조그휠/슬라이더/노브, 각 ESP32-C3 탑재) 3개 전부와의 BLE 연결
수립, 값 수신을 담당한다. React나 ControlBus를 직접 참조하지 않고 콜백
(`onConnectionStateChange` / `onRawPacket` / `onValue`)만 노출한다 — 실제 배선은
사용하는 쪽(dev/AudioCoreDebugPanel)에서 한다.

Web Bluetooth 제약:
- HTTPS 또는 localhost에서만 동작
- iOS/iPadOS 브라우저 미지원
- 연결은 사용자 제스처(클릭) 안에서만 시작 가능 — `navigator.bluetooth.requestDevice()`
  호출은 반드시 버튼 클릭 핸들러 등 사용자 액션 내부에서 이루어져야 함

## 현재 상태

3개 모듈 전부 파싱 구현 완료. 세 펌웨어 모두
`pAdvertising->setAdvertisementType(ADV_TYPE_NONCONN_IND)`로 non-connectable
광고 전용이라 GATT는 항상 실패하고 advertising 폴백만 쓰인다 — 이건 버그가 아니라
펌웨어 설계이며, `BleLinkBase`의 "GATT 우선 → advertising 폴백" 구조가 결과적으로
맞게 동작한다.

- `bleLinkShared.ts` — 공유 베이스 `BleLinkBase<TValue>`(제네릭). GATT 우선 시도 →
  실패 시 advertising 폴백 로직, BLE-MIDI 서비스/특성 UUID(GATT 경로용),
  `optionalServices` 추측 목록을 담고 있다. `TValue`가 기기마다 다르다 — 슬라이더는
  `number` 1개, 조그휠은 `boolean`, 노브는 `{treble,bass,volume}` 객체.
- `web-bluetooth.d.ts` — Web Bluetooth 최소 앰비언트 타입 선언.

세 기기 모두 manufacturerData 포맷이 동일한 패턴이다: Company ID(0xFFFF, 테스트용)는
Web Bluetooth가 이미 벗겨내고 넘겨주므로, `extractValue`가 받는 raw는
`[장치태그 1바이트, 값...]` 형태다.

- `JogBleLink.ts` (`BLEMIDI_1`) — raw `['T', 0|1]`. `extractTouchValue`가
  1=터치 On/0=터치 Off로 파싱해 `onValue(boolean)`. 원래 조그휠 터치는
  USB Serial(`core/serial`)로 들어온다고 가정했었으나, 실제 펌웨어 확인 결과 BLE로
  확정됨 — `core/serial`은 이제 미사용.
- `SliderBleLink.ts` (`BLEMIDI_3`) — raw `['P', BPM LSB, BPM MSB]` 3바이트.
  `extractSliderValue`가 BPM 0~1000 값으로 파싱한다 — `ControlBus`/`AudioCore`도
  이 0~1000 BPM 스케일에 맞춰져 있다 (구 0~1023 가정에서 변경됨).
- `KnobBleLink.ts` (`BLEMIDI_2`) — 물리 노브 모듈은 포텐셔미터 3개(Treble/Bass/
  Volume)를 갖는다. raw `['K', Treble, Bass, Volume]` 4바이트, 각 0~100.
  `extractKnobValue`가 `{ treble, bass, volume }` 객체로 파싱한다. 단, 기능
  명세서 기준으로는 노브는 Bass EQ 전용이고 3개 중 물리적으로 구현된 건 1개뿐이라,
  Treble/Volume 값은 아직 배선 안 된 ADC 핀의 뜬값(노이즈)일 수 있다.
