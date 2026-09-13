# frontend

TEKTO STUDIO 웹앱. Vite + React + TypeScript.

## 실행 및 검증

```sh
npm install
npm run dev
npm run build
npm run lint
node --test tests/ble-input.test.cjs tests/mixing-audio.test.mjs
```

테스트 실행 환경은 Node 24입니다. 실제 기기 연결 테스트와 모의 입력 테스트는 구분합니다.

## 주요 코드

- `src/App.tsx`: 화면 라우팅. 앱 내부 링크 이동 시 페이지 전체를 새로 로드하지 않습니다.
- `src/screens/MixingSession.tsx`, `useMixingSession.ts`: 앱 전체에서 장치와 선택 음원 상태 공유.
- `src/screens/useMixingHardware.ts`: BLE 입력을 React 상태로 전달.
- `src/screens/Settings.tsx`: 기기 연결 및 음원 파일 설정.
- `src/screens/Mixing.tsx`: 선택 앨범 표시, 재생 컨트롤, 입력과 오디오·도트 UI 연결.
- `src/screens/MixingMotion.tsx`: Canvas 도트 렌더링. 노브·슬라이더 값 반영 및 조그 장식 회전.
- `src/core/audio/MixingAudio.ts`: 믹싱 화면용 Web Audio 엔진. 원곡에 적용하는 High/Mid/Low EQ와 스크래치 전환.
- `src/core/audio/AudioCore.ts`: 기존 `/test` 진단용 오디오 엔진. 믹싱 화면용 엔진과 별개입니다.
- `src/core/ble/`: BLE 연결과 패킷 해석. React에 의존하지 않습니다.
- `src/core/serial/`, `src/dev/`, `tools/`: 기존 USB Serial 및 개발 진단 도구.
- `src/visualizer/`: 기존 진단용 React 비주얼라이저. 믹싱 화면은 `MixingMotion.tsx`를 사용합니다.
- `public/audio/videoplayback.mp3`: 기본 믹싱 음원.
- `tests/`: 모의 BLE 입력·연결 해제, 오디오 전환, EQ 매핑 테스트.

실행 흐름과 구현 제약은 [루트 README](../README.md), 화면 설명은 [screens README](src/screens/README.md)를 참고합니다.
