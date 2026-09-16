# screens

## 화면과 이동

- `Home.tsx` (`/`): 음악 선택, Setting, Playlist로 이동합니다.
- `Settings.tsx` (`/settings`): 조그휠·노브 연결, 기본 음원·스크래치 음원 선택. USB 및 믹싱 시작 버튼은 없습니다.
- `MusicSelect.tsx` (`/music-select`): 좌우 앨범 선택. + 링크는 `/music-search?deck=left` 또는 `deck=right`로 이동합니다.
- `MusicSearch.tsx` (`/music-search`): 앨범·아티스트 검색. 카드 선택 후 하단 플레이어의 +로 앨범을 확정합니다.
- `Playlist.tsx` (`/playlist`): Figma Mixing List 예시 목록. 주변 앨범/하단 표시/방향키로 선택하며 즐겨찾기, 삭제·취소, 페이지 링크 복사를 제공합니다. 변경은 화면 내 임시 상태이며 실제 믹스셋 저장·녹음 파일 재생은 미연결입니다. 기존 `/music-search?from=playlist` 링크도 이 화면을 표시합니다.
- `Mixing.tsx` (`/mixing?left=...&right=...`): 선택한 앨범이 하나 이상이면 진입합니다. 제목·아티스트·커버는 선택 앨범과 동일합니다.
- `ModuleSettings.tsx`: 이전 모듈 진단 컴포넌트로, 현재 `/settings`에 사용하지 않습니다.

앱 내부 링크는 `App.tsx`에서 처리하고, `MixingSession`이 연결·노브·음원 상태를 유지합니다.
브라우저 새로고침은 새 세션을 시작합니다. 로컬 선택 파일은 서버에 업로드하지 않습니다.

## 재생 파일과 앨범 표시

믹싱 재생에는 Setting의 기본 음원을 사용하며 초기값은 `/audio/videoplayback.mp3`입니다.
앨범 표시와 실제 파일은 별개입니다. 선택 앨범을 바꿔도 현재는 같은 기본 음원이 재생됩니다.

검색 화면 미리듣기는 별도 경로입니다. `musicSelection.ts`의 `Track.audioSrc`가 있어야 재생되며, Setting의 기본 음원은 검색 미리듣기에 자동 적용되지 않습니다.
현재 앨범 목록의 `audioSrc`는 미등록 상태입니다.

## 입력과 도트 UI

- 노브: `BLEMIDI_2`의 `커스텀 GATT 3바이트 T/B/V(각 0~100)`을 실제 배선에 맞춰 High=V, Mid=T, Low=B로 변환하여 왼쪽 도트 3개에 각각 반영합니다. 한 모듈의 세 채널을 가정합니다. 화면의 각 도트 영역을 가로로 조작하거나 키보드로 값을 바꿀 수도 있습니다.
- 조그휠: `BLEMIDI_1`의 `커스텀 GATT 1바이트 0/1` 터치 신호를 오디오 전환에 사용합니다. 오른쪽 도트의 자동 회전은 실제 회전 센서값과 무관하며, 터치에 따른 도트 정지도 연결하지 않았습니다.
- 슬라이더: 가운데 패널을 세로로 조작하면 도트 위치와 재생 속도(0.9~1.1배)가 변합니다. 실제 슬라이더 기기는 연결하지 않습니다.
- 노브는 중앙 50에서 0dB, 최소 -12dB, 최대 +12dB입니다. 초기값은 세 채널 모두 50입니다. 기존 파서의 treble/bass/volume 필드는 호환을 위해 유지하며 믹싱 진입점에서 high/mid/low로 변환합니다.

## 오디오

`MixingAudio`는 원곡을 Low(250Hz lowshelf) → Mid(1kHz peaking, Q 0.7) → High(4kHz highshelf) 순으로 처리합니다. 별도 베이스 파일이나 전체 음량 노브는 사용하지 않습니다.
EQ는 값 변경을 부드럽게 반영하며, 최종 출력에는 과도한 레벨을 줄이는 컴프레서가 있습니다.
스크래치 음원을 등록하면 재생 중 터치 On에서 120ms 크로스페이드로 전환하고, Off에서 기본 음원을 멈춘 위치부터 재개합니다. 스크래치 음원은 EQ를 우회하며, 미등록 시 기본 음악을 유지합니다.

재생/일시정지, 탐색, 반복, 선택 앨범 전환을 제공합니다. Finish는 재생을 멈추고 Playlist(`/playlist`)로 이동합니다.
믹싱 화면에서 속도·Bass 수치 표시는 제거했으며, 로딩·오류·음원 미등록 안내만 필요할 때 표시합니다.
타임라인 배경은 실제 음원을 분석한 파형이 아닙니다.

## 검증 방법


`frontend` 디렉터리에서:

```sh
npm run build
npm run lint
node --test tests/ble-input.test.cjs tests/mixing-audio.test.mjs
```
