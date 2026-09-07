# screens

화면 단위 React 컴포넌트. 라우팅, 레이아웃, 카드/리스트, 설정 UI 등 화면을 그리는
역할만 담당하며, 오디오/BLE 실시간 처리 로직은 core/audio, core/ble 모듈에 위임한다.

- Home — 시작 화면
- MusicSelect — 데모 음원 선택 화면
- Mixing — 믹싱 메인 화면 (비주얼라이저 포함)
- ModuleSettings — 물리 모듈 연결/설정 화면

Home(`/`)과 MusicSelect(`/music-select`)는 Figma 기반으로 구현되어 있습니다.
MusicSelect의 두 + 링크는 `/music-search?deck=left` 또는 `deck=right`로 이동합니다.
MusicSearch는 Figma 참조 앨범 목록과 이름 검색을 제공하며, 상세 화면과 실제 음원은 아직 연결되지 않았습니다.
Mixing과 ModuleSettings는 후속 디자인 구현 전의 자리표시자입니다.

음악 미리듣기: 검색 카드 선택 시 하단 플레이어가 열립니다. 플레이어 +는 진입한 덱에 곡을 확정하며 URL의 left/right 값으로 선택을 보존합니다.
실제 음원은 아직 없습니다. src/screens/musicSelection.ts의 각 트랙 audioSrc에 실제 재생 URL을 설정하면 미리듣기 재생/일시정지/탐색이 연결됩니다. 현재는 음원 연결 대기를 표시합니다.
The Chase 외 항목은 앨범 참조 데이터를 사용하며 실제 트랙 목록과 길이는 추가 제공이 필요합니다. 파형은 Figma 참조 이미지이고 실제 오디오 분석 파형은 아닙니다.

Mixing(`/mixing?left=...&right=...`)은 한 곡 이상 선택하면 진입할 수 있습니다. 선택 곡 표시, 이전/다음 선택 곡 전환, 반복 재생, 진행 위치 탐색, Finish(Home 복귀)를 제공합니다. 실제 재생에는 musicSelection.ts의 audioSrc가 필요합니다. 중앙 도트 패널은 Figma 원본 정지 이미지이며 기존 AudioCore/BLE/Serial 및 실시간 시각화 연동은 아직 하지 않았습니다. 연결 테스트는 /test에 그대로 유지합니다.

영상 참고 모션 업데이트: MixingMotion.tsx에서 EQ 맥동, 템포 상하 이동, 조그 회전을 Canvas로 렌더링합니다. 실제 음원이 없을 때는 ‘모션 미리보기’로 표시하고 재생/일시정지 및 진행 바를 제공합니다. 이는 실제 하드웨어/음원 분석 반응이 아닙니다. OS의 모션 감소 설정에서는 도트 움직임을 정지합니다. Finish는 Mixing List 디자인 확인 전까지 기존 Home 복귀를 유지합니다.
