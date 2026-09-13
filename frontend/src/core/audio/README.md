# core/audio

## 현재 믹싱 화면

`MixingAudio.ts`는 기본 음원과 스크래치 음원을 재생하는 Web Audio 엔진입니다.

- 노브: 원곡에 High·Mid·Low 3밴드 EQ를 직접 적용합니다. 각 값 0~100은 -12~+12dB에 대응하며 중앙 50은 0dB입니다.
- EQ: Low 250Hz lowshelf → Mid 1kHz peaking(Q 0.7) → High 4kHz highshelf. 값은 부드럽게 반영하고 최종 출력에 컴프레서를 적용합니다.
- 조그휠: 터치 중 스크래치 음원으로 전환하고, 해제하면 기본 음원을 멈춘 위치부터 이어 재생합니다. 크로스페이드는 120ms이며 스크래치 음원은 EQ를 우회합니다.
- 슬라이더: 기본 음원 재생 속도를 0.9~1.1배로 조절합니다.
- 지원 음원 종류는 `master`와 `scratch`입니다. 기본 파일은 `public/audio/videoplayback.mp3`이며 Setting에서 변경할 수 있습니다.
- 파일 로드 실패를 오류로 알리고 테스트 톤으로 자동 대체하지 않습니다.

## 이전 진단 엔진

`AudioCore.ts`는 `/test`에서 사용하는 이전 프로토타입입니다. 현재 Setting과 믹싱 화면의 동작은 `MixingAudio.ts`를 기준으로 확인합니다.

## 검증

`frontend`에서 `node --test tests/mixing-audio.test.mjs`를 실행합니다.
