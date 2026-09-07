import { useEffect, useRef } from 'react'
import type { AudioCore } from '../core/audio/AudioCore'
import type { ControlBus } from '../core/input/ControlBus'

// 그리드 크기. GRID_COLS는 AudioCore의 ANALYSER_FFT_SIZE(64 → frequencyBinCount 32)와
// 맞춰뒀다 — 주파수 bin 하나가 그대로 열(column) 하나가 된다.
const GRID_COLS = 32
const GRID_ROWS = 16
const CELL_SIZE = 14
const CELL_GAP = 2

interface Props {
  audioCore: AudioCore
  controlBus: ControlBus
}

/**
 * 태블릿 메인 믹싱 화면에 항상 떠 있는 배경 비주얼(프로토타입). ui/의 화면 전환
 * placeholder와는 별개 기능이다.
 *
 * React state를 매 프레임 갱신하지 않는다 — 오디오 분석 데이터는 AudioCore에서 매
 * requestAnimationFrame마다 직접 읽어오고, 하드웨어/컨트롤 입력은 ControlBus를
 * ref로 구독해 최신값만 저장한다. 캔버스는 이 루프 안에서 직접 그린다.
 *
 * 지금의 색상/연출 매핑(조그휠=플래시, 슬라이더=하이라이트 행, 노브=색조)은 프로토타입
 * 단계의 자유 판단이며, 최종 비주얼 디자인은 나중에 조정될 것이다.
 */
function DotMatrixVisualizer({ audioCore, controlBus }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const jogTouchingRef = useRef(false)
  const sliderNormRef = useRef(0.5)
  const knobNormRef = useRef(1)

  useEffect(() => {
    const unsubscribe = controlBus.subscribe({
      onJogTouch: ({ isTouching }) => {
        jogTouchingRef.current = isTouching
      },
      onSlider: ({ normalized }) => {
        sliderNormRef.current = normalized
      },
      // 노브는 3개 값(Treble/Bass/Volume)을 갖지만 색조/채도는 Volume 기준으로만 반응한다
      // — useControlScreen과 동일한 placeholder 선택.
      onKnob: ({ volumeNormalized }) => {
        knobNormRef.current = volumeNormalized
      },
    })

    const canvas = canvasRef.current
    const ctx2d = canvas?.getContext('2d') ?? null
    let frameId = 0

    const draw = () => {
      frameId = requestAnimationFrame(draw)
      if (!ctx2d || !canvas) return

      const freqData = audioCore.getAnalyserData()
      const isTouching = jogTouchingRef.current
      const sliderNorm = sliderNormRef.current
      const knobNorm = knobNormRef.current

      // 슬라이더: 그리드 위를 오르내리는 하이라이트 행. 노브: 전체 색조/채도.
      const highlightRow = Math.round((1 - sliderNorm) * (GRID_ROWS - 1))
      const hue = 200 - knobNorm * 160
      const saturation = 55 + knobNorm * 40

      ctx2d.fillStyle = '#000'
      ctx2d.fillRect(0, 0, canvas.width, canvas.height)

      for (let col = 0; col < GRID_COLS; col++) {
        const amplitude = (freqData[col] ?? 0) / 255
        for (let row = 0; row < GRID_ROWS; row++) {
          const rowThreshold = 1 - row / GRID_ROWS
          const isLit = amplitude >= rowThreshold * 0.9
          const isHighlightRow = row === highlightRow

          let lightness = isLit ? 30 + amplitude * 45 : 8
          if (isHighlightRow) lightness = Math.min(90, lightness + 30)

          // 조그휠 터치 중에는 보색으로 뒤집어 화면 전체가 확 바뀌는 플래시 효과를 낸다.
          const dotHue = isTouching ? (hue + 180) % 360 : hue

          ctx2d.fillStyle = `hsl(${dotHue}, ${saturation}%, ${lightness}%)`
          ctx2d.fillRect(
            col * CELL_SIZE + CELL_GAP / 2,
            row * CELL_SIZE + CELL_GAP / 2,
            CELL_SIZE - CELL_GAP,
            CELL_SIZE - CELL_GAP,
          )
        }
      }
    }

    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      unsubscribe()
    }
  }, [audioCore, controlBus])

  return (
    <canvas
      ref={canvasRef}
      width={GRID_COLS * CELL_SIZE}
      height={GRID_ROWS * CELL_SIZE}
      style={{ background: '#000', borderRadius: 4, display: 'block' }}
    />
  )
}

export default DotMatrixVisualizer
