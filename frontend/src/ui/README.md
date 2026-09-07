# ui

슬라이더/노브 값에 따라 태블릿 화면이 전환되는 로직 + 그 화면의 자리를 채우는
placeholder 컴포넌트. 오디오/BLE/Serial 실시간 처리와 달리 이쪽은 일반 React
state를 쓰지만, ControlBus에서 오는 연속값을 그대로 넣지 않고 `controlScreens.ts`의
매핑 함수로 구간(screen id)을 계산한 뒤 그 값이 바뀔 때만 리렌더한다.

- `controlScreens.ts` — normalized(0.0~1.0) → screen id 매핑 순수 함수
- `useControlScreen.ts` — ControlBus 구독 + change-detection 리렌더 훅
- `SliderScreenPlaceholder.tsx`, `KnobScreenPlaceholder.tsx` — 화면 자리 placeholder.
  최종 그래픽 영상이 오면 이 두 컴포넌트 내부만 교체될 예정.
