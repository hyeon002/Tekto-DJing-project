# core/audio

Web Audio API 기반 사운드 엔진. React에 의존하지 않는 순수 TypeScript 모듈.

BLE로 들어오는 값(초당 수십 회)을 받아 템포/EQ/크로스페이더 등 오디오 파라미터를
직접 갱신한다. React state를 거치지 않고 이 모듈 안에서 오디오 그래프를 직접 조작해
불필요한 리렌더를 피한다. React 쪽에서는 이 모듈의 시작/정지만 호출한다.

## 현재 상태

`AudioCore.ts`에 프로토타입 구현 완료. public 인터페이스는 `setJogTouch` /
`setSliderValue` / `setKnobValues` 세 개뿐이며, 지금은 실제 BLE 파서(`core/ble`)와
`dev/AudioCoreDebugPanel`의 Mock 슬라이더가 둘 다 `ControlBus`를 거쳐 이 메서드들을
호출한다.

- 조그휠: master+bass 일시정지 ↔ 스크래치 샘플, GainNode 크로스페이드(120ms)
- 슬라이더: raw 0~1000(BPM) → 0.9~1.1x, master/bass playbackRate 동시 적용
- 노브: 포텐셔미터 3개(각 raw 0~100)를 한 번에 받는다 —
  Treble → musicBus 끝단 BiquadFilterNode(highshelf, ±12dB) gain,
  Bass → bass 트랙 GainNode 볼륨, Volume → masterOutputGain(전체 출력, analyser도
  이 값 반영된 소리를 봄)
- `public/audio/*.mp3` 로드 실패 시 OscillatorNode 대신 합성 톤 버퍼로 자동 폴백
