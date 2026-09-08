// 입력 소스(Mock 버튼, BLE, Serial)와 소비 측(AudioCore, UI 화면 전환, 비주얼라이저)을
// 분리하는 단일 pub/sub 버스. React에 의존하지 않는 순수 TypeScript 클래스.
//
// 나중에 하드웨어 값이 초당 수십 회씩 push되어도 ControlBus 자체는 아무것도 들고 있지
// 않고 그대로 구독자에게 흘려보내기만 한다 — 그 값을 React state로 받을지, ref로 받고
// requestAnimationFrame에서 읽을지는 구독자(소비 측)가 각자 결정한다.

const SLIDER_RAW_MAX = 1000
const KNOB_RAW_MAX = 100

export interface JogTouchEvent {
  isTouching: boolean
}

export interface SliderEvent {
  raw: number
  normalized: number
}

export interface KnobEvent {
  treble: number
  trebleNormalized: number
  bass: number
  bassNormalized: number
  volume: number
  volumeNormalized: number
}

export interface ControlBusListener {
  onJogTouch?(event: JogTouchEvent): void
  onSlider?(event: SliderEvent): void
  onKnob?(event: KnobEvent): void
}

export class ControlBus {
  private listeners = new Set<ControlBusListener>()

  /** 반환된 함수를 호출하면 구독이 해제된다. */
  subscribe(listener: ControlBusListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  pushJogTouch(isTouching: boolean): void {
    const event: JogTouchEvent = { isTouching }
    for (const listener of this.listeners) listener.onJogTouch?.(event)
  }

  /** raw 0~1000 (BPM) */
  pushSlider(raw: number): void {
    const event: SliderEvent = { raw, normalized: raw / SLIDER_RAW_MAX }
    for (const listener of this.listeners) listener.onSlider?.(event)
  }

  /** 노브 모듈의 포텐셔미터 3개(treble/bass/volume), 각 raw 0~100. 한 패킷으로 동시에 온다. */
  pushKnob(treble: number, bass: number, volume: number): void {
    const event: KnobEvent = {
      treble,
      trebleNormalized: treble / KNOB_RAW_MAX,
      bass,
      bassNormalized: bass / KNOB_RAW_MAX,
      volume,
      volumeNormalized: volume / KNOB_RAW_MAX,
    }
    for (const listener of this.listeners) listener.onKnob?.(event)
  }
}
