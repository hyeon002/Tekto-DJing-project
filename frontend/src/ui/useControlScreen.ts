import { useEffect, useRef, useState } from 'react'
import type { ControlBus } from '../core/input/ControlBus'
import { mapKnobToScreen, mapSliderToScreen } from './controlScreens'

export interface ControlScreenState {
  sliderScreen: number
  sliderNormalized: number
  knobScreen: number
  knobNormalized: number
}

const INITIAL_STATE: ControlScreenState = {
  sliderScreen: 0,
  sliderNormalized: 0,
  knobScreen: 0,
  knobNormalized: 0,
}

/**
 * ControlBus를 구독해 슬라이더/노브의 화면 id(구간)를 반환한다.
 * 연속값이 들어올 때마다 리렌더하지 않고, 매핑된 screen id가 실제로 달라질 때만
 * setState한다 (시간 기반 throttle이 아니라 change-detection 방식) — 초당 수십 번
 * push되어도 화면이 바뀌는 순간에만 리렌더된다.
 */
export function useControlScreen(controlBus: ControlBus): ControlScreenState {
  const [state, setState] = useState<ControlScreenState>(INITIAL_STATE)
  const latestRef = useRef(state)
  latestRef.current = state

  useEffect(() => {
    const unsubscribe = controlBus.subscribe({
      onSlider: ({ normalized }) => {
        const sliderScreen = mapSliderToScreen(normalized)
        if (sliderScreen !== latestRef.current.sliderScreen) {
          setState((prev) => ({ ...prev, sliderScreen, sliderNormalized: normalized }))
        }
      },
      // 노브 모듈은 Treble/Bass/Volume 3개 값을 갖지만 화면(placeholder)은 하나뿐이라
      // 우선 Volume 기준으로 구간을 전환한다 — 최종 그래픽 사양이 나오면 재검토.
      onKnob: ({ volumeNormalized }) => {
        const knobScreen = mapKnobToScreen(volumeNormalized)
        if (knobScreen !== latestRef.current.knobScreen) {
          setState((prev) => ({ ...prev, knobScreen, knobNormalized: volumeNormalized }))
        }
      },
    })
    return unsubscribe
  }, [controlBus])

  return state
}
