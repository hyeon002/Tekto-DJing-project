# frontend

TEKTO STUDIO 웹앱. Vite + React + TypeScript.

- `src/core/audio/`, `src/core/ble/`, `src/visualizer/` — React에 의존하지 않는 순수
  TypeScript 모듈. React는 이 모듈들을 시작/정지시키고 화면을 그리는 역할만 한다.
- `src/screens/`, `src/components/` — 화면/UI를 담당하는 React 컴포넌트.
- `tools/` — React와 무관하게 단독으로 여는 개발용 검증 HTML.

각 하위 폴더의 상세 용도는 폴더 안 README.md 참고.

## 실행

```
npm install
npm run dev
```

전체 실행 방법과 프로젝트 제약은 [루트 README](../README.md) 참고.
