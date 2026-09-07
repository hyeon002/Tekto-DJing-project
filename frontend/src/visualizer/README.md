# visualizer

Canvas 기반 도트 비주얼라이저. `requestAnimationFrame` 루프로 오디오 분석 데이터와
조작 값에 반응해 그린다. core/audio, core/input과 마찬가지로 React 렌더 사이클과
분리된 순수 루프로 동작하고, React는 캔버스 마운트와 시작/정지만 담당한다 —
컴포넌트 자체는 React이지만 매 프레임 state를 갱신하지 않고 ref로만 그린다.

## 현재 상태

`DotMatrixVisualizer.tsx`에 프로토타입 구현 완료. 32x16 그리드(상수로 분리,
`GRID_COLS`/`GRID_ROWS`). AudioCore.getAnalyserData()로 주파수 데이터를 열(column)
밝기에, ControlBus 구독(ref 저장, React state 아님)으로 슬라이더는 하이라이트
행 위치, 노브는 색조/채도, 조그휠 터치는 보색 플래시에 매핑했다. 이 매핑은
프로토타입 단계의 자유 연출이며 최종 비주얼 디자인은 나중에 조정된다.

ui/의 화면 전환 placeholder(SliderScreenPlaceholder 등)와는 다른 기능이다 —
이쪽은 메인 믹싱 화면에 항상 떠 있는 배경 비주얼.
