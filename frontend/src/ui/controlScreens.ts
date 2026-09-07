// 슬라이더/노브의 정규화 값(0.0~1.0)을 UI 화면 id로 매핑하는 순수 함수.
// React/상태와 무관 — useControlScreen 훅이 이 함수들을 호출해 화면 전환 여부를 판단한다.
//
// TODO: 실제로 몇 개의 화면으로 나뉘는지는 명세서에 확정되어 있지 않다. 지금은 임시로
// 5구간으로 나눴다 — 실제 그래픽 세트가 정해지면 아래 두 상수만 조정하면 된다.
export const SLIDER_SCREEN_COUNT = 5
export const KNOB_SCREEN_COUNT = 5

function mapNormalizedToScreen(normalized: number, screenCount: number): number {
  const clamped = Math.min(1, Math.max(0, normalized))
  // normalized === 1.0인 경우 Math.floor(screenCount)가 되어 범위를 벗어나므로 clamp.
  return Math.min(screenCount - 1, Math.floor(clamped * screenCount))
}

export function mapSliderToScreen(normalized: number): number {
  return mapNormalizedToScreen(normalized, SLIDER_SCREEN_COUNT)
}

export function mapKnobToScreen(normalized: number): number {
  return mapNormalizedToScreen(normalized, KNOB_SCREEN_COUNT)
}
