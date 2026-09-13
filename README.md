# TEKTO STUDIO

물리 조그휠·노브 입력을 받아 음악을 제어하고 도트 UI를 표시하는 디제잉 전시 데모입니다.
React + TypeScript + Vite로 구성되어 있으며, 별도 백엔드 없이 실행됩니다.

## 실행

```sh
cd frontend
npm install
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다. 기본 주소는 `http://localhost:5173`입니다.

## 화면 구성

| 경로 | 기능 |
| --- | --- |
| `/` | Home. 음악 선택, Setting, Playlist 진입 |
| `/settings` | 조그휠·노브 연결과 기본/스크래치 음원 설정 |
| `/music-select` | 좌우 앨범 선택 및 믹싱 진입 |
| `/music-search` | 앨범·아티스트 검색과 선택 |
| `/mixing?left=4` | 선택한 앨범 정보를 표시하는 믹싱 화면 |
| `/test` | 오디오·BLE·USB Serial 개발용 진단 도구 |
| `/test/ble.html` | 독립 BLE 수신 검증 도구 |

Home의 Setting에서 장치를 연결한 뒤 Home으로 돌아와 음악을 선택합니다.
Setting에는 조그휠과 노브 연결 버튼만 표시하며, USB 연결과 믹싱 시작 버튼은 없습니다.
USB Serial 진단 기능은 `/test`에 남아 있습니다.

## 음원

- 제공된 `frontend/public/audio/videoplayback.mp3`를 기본 믹싱 음원으로 사용합니다.
- Setting에서 기본 음원을 변경하거나 스크래치 음원을 선택할 수 있습니다.
- 믹싱 화면의 제목·아티스트·커버는 선택한 앨범 정보입니다. 실제 재생 파일은 Setting의 기본 음원이며, 현재 앨범별로 다른 음악을 재생하지는 않습니다.
- High·Mid·Low 노브는 별도 파일 없이 기본 음원의 고음·중음·저음을 직접 조절합니다. 중앙 50은 0dB, 범위는 -12~+12dB입니다.
- 스크래치 음원은 재생 중 조그휠을 누르는 동안 대신 재생됩니다. 손을 떼면 기본 음원을 멈춘 위치부터 이어 재생합니다.
- 스크래치 음원은 기본 제공되지 않습니다. 스크래치 음원이 없으면 터치해도 기본 음악을 유지합니다.
- 파일은 서버로 업로드하지 않습니다. 같은 탭의 앱 화면 이동 시 선택 파일과 장치 연결을 유지하며, 새로고침하면 기본 설정으로 돌아가고 재연결이 필요합니다.

## 기기 입력과 UI의 현재 상태

| 입력 | 도트 UI | 오디오 |
| --- | --- | --- |
| 노브 3채널 | 세 값에 따라 왼쪽 도트가 각각 변화 | High/Mid/Low 3밴드 EQ |
| 조그휠 터치 | 터치·회전값에 따른 도트 움직임은 미연동. 재생 중 자동 회전 | 기본 음원 ↔ 스크래치 음원 전환 |
| 화면 슬라이더 | 가운데 도트가 위아래로 이동 | 0.9~1.1배 재생 속도 |

노브는 위부터 High·Mid·Low입니다. Low는 250Hz lowshelf, Mid는 1kHz peaking(Q 0.7), High는 4kHz highshelf입니다. 값은 20ms 시정수로 부드럽게 반영하며 최종 출력에는 과도한 레벨을 줄이는 컴프레서를 사용합니다. EQ는 음역별 증감이며 음정 자동 보정은 아닙니다. 스크래치 음원은 EQ를 우회합니다.
기존 BLE 파서의 필드명은 펌웨어 호환을 위해 유지하지만, 사용자가 확인한 물리 배선에 맞춰 패킷의 첫째/둘째/셋째 값(T/B/V)을 Mid/Low/High로 해석합니다. UI와 오디오 EQ의 High/Mid/Low에는 각각 V/T/B를 전달합니다.
조그휠 파서는 터치 On/Off만 처리합니다. 실제 회전 방향·각도를 따라가는 UI는 구현하지 않았습니다.
슬라이더는 현재 실제 기기를 연결하지 않고 화면에서 조작합니다.

## 연결 확인과 제약

- Setting에서 연결 상태와 유효 입력 수신 여부를 별도로 표시합니다. `연결됨 · 입력 대기`는 아직 유효한 값이 들어오지 않은 상태입니다.
- 현재 BLE 파서는 제공된 커스텀 GATT 펌웨어에 맞춰 조그휠 `BLEMIDI_1`의 1바이트 `0/1`, 노브 `BLEMIDI_2`의 3바이트 `T/B/V(각 0~100)`를 읽습니다. 태그 바이트는 없습니다. notify 구독 후 초기 값을 READ합니다. [UUID와 수신 방식](frontend/src/core/ble/README.md)을 참고합니다. 실제 기기 수신 검증은 별도로 필요합니다.
- 연결은 사용자가 버튼을 눌러 시작합니다. 브라우저의 Web Bluetooth 지원 및 보안 컨텍스트(HTTPS/localhost)가 필요합니다.
- Home 배터리 92%, 앨범 참조 정보, 타임라인 배경은 디자인 데이터입니다. 실제 배터리 수신이나 오디오 분석 파형이 아닙니다.
- 배포 시 화면 경로로 직접 접속해도 `index.html`을 반환하도록 SPA fallback을 설정해야 합니다.

## 검증

`frontend` 디렉터리에서 실행합니다. 아래 테스트는 Node 24 기준입니다.

```sh
npm run build
npm run lint
node --test tests/ble-input.test.cjs tests/mixing-audio.test.mjs
```

상세 구조는 [프론트엔드 README](frontend/README.md), 화면별 설명은 [screens README](frontend/src/screens/README.md)를 참고합니다.
