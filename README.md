# TEKTO STUDIO

물리 디제잉 모듈(노브/슬라이더/조그휠, 각각 ESP32-C3 탑재)이 BLE로 값을 보내면,
Chrome 웹앱이 Web Bluetooth로 받아 Web Audio API로 실시간 사운드 처리(템포/EQ/
크로스페이더)를 하고, Canvas 기반 도트 비주얼라이저가 오디오와 조작에 반응하는
산업디자인 전시 데모용 웹앱.

## 실행 방법

### frontend

```
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 Figma 기반 Home 화면을 확인합니다.

- `/test`: 기존 오디오, BLE, Serial, 컨트롤 입력 및 비주얼라이저 디버그 패널
- `/test/ble.html`: 독립 BLE 수신 검증 페이지 (프로덕션 빌드에도 포함)

Home의 Let’s Start Mixing은 `/music-select`로 이동하며 뒤로 가기로 Home으로 돌아옵니다.
음악 선택 화면의 +는 `/music-search?deck=left` 또는 `deck=right`로 이동합니다.
음악 검색 화면은 Figma 참조 앨범 목록에서 앨범명과 아티스트명으로 검색할 수 있습니다.
앨범 상세와 다른 분류는 후속 디자인/데이터 연결 전이며, 시작 버튼과 Home의 Setting, Playlist도 아직 비활성 상태입니다.
배터리는 실제 연결 값을 표시할 수 있을 때까지 `--%`로 표시합니다.
영상은 `frontend/src/screens/Home.tsx`의 `videoSrc` prop으로 연결할 수 있고,
지정하지 않으면 Figma 원본 이미지를 표시합니다. Figma 이미지·아이콘은
`frontend/public/images/home`에 저장되어 임시 Figma URL에 의존하지 않습니다.
Pretendard가 설치되어 있지 않으면 시스템 폰트를 사용합니다.
배포 서버에서는 `/test` 직접 접속 시 SPA의 `index.html`을 반환하도록 설정해야 합니다.

### backend (선택)

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

전시 데모는 프론트 단독으로 완전히 동작한다. 백엔드는 믹싱 로그, 플레이리스트 저장
등 선택적 부가 기능 전용이며, 꺼져 있어도 앱은 정상 동작해야 한다.

## 중요 제약

- **Web Bluetooth는 HTTPS 또는 localhost에서만 동작한다.** 일반 HTTP로 배포된
  페이지에서는 BLE 연결이 불가능하다.
- **iOS/iPadOS 브라우저는 Web Bluetooth를 지원하지 않는다.** 전시 기기는 Windows,
  Mac, Android Chrome을 사용한다.
- **BLE 연결은 반드시 사용자 클릭 등 사용자 제스처 내에서만 시작할 수 있다.**
  페이지 로드 시 자동으로 연결을 시도할 수 없다.
