# visualizer

Canvas 기반 도트 비주얼라이저. `requestAnimationFrame` 루프로 오디오 분석 데이터와
BLE 조작 값에 반응해 그린다. core/audio, core/ble과 마찬가지로 React 렌더 사이클과
분리된 순수 TypeScript 루프로 동작하고, React는 캔버스 마운트와 시작/정지만 담당한다.

아직 구현 없음 — 추후 작업에서 작성 예정.
