# core/input

입력 소스(지금은 dev/AudioCoreDebugPanel의 Mock, 나중에는 core/ble·core/serial)와
소비 측(core/audio의 AudioCore, ui/ 화면 전환 로직, visualizer/의 도트매트릭스)을
분리하는 pub/sub 버스. React에 의존하지 않는 순수 TypeScript 모듈.

값을 "뿌리는" 지점을 하나로 통일해서, 소비하는 쪽이 각자 방식에 맞게 값을 받아가게
한다 — AudioCore는 즉시 오디오 파라미터에 반영하고, React UI는 구간(bucket)이 바뀔
때만 리렌더하고, Canvas 비주얼라이저는 ref로 최신값만 저장해 매 프레임 직접 읽는다.

## 현재 상태

`ControlBus.ts`에 구현 완료. `pushJogTouch` / `pushSlider` / `pushKnob`으로 값을
넣고, `subscribe`로 리스너를 등록한다. push 시점에 raw와 normalized(0.0~1.0)를
함께 계산해 리스너에 전달한다.

`pushKnob(treble, bass, volume)`은 물리 노브 모듈이 포텐셔미터 3개를 갖고 있어서
값 3개를 한 번에 받는다 — `KnobEvent`도 `treble`/`bass`/`volume`과 각각의
`*Normalized` 필드를 갖는다. `ui/useControlScreen.ts`, `visualizer/DotMatrixVisualizer.tsx`처럼
화면 하나로만 표현해야 하는 소비자는 우선 `volumeNormalized`를 기준으로 쓰고 있다
(placeholder 단계의 임시 선택).
