const SCREEN_COLORS = ['#1f2937', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']

interface Props {
  screen: number
  normalized: number
}

/**
 * 슬라이더 구간(screen)에 대응하는 화면 자리. 최종 그래픽 영상이 아직 전달되지
 * 않아 색상 블록 + 큰 숫자로만 표시한다 — 나중에 실제 그래픽으로 이 컴포넌트
 * 내부만 교체하면 되고, 호출부(props: screen, normalized)는 그대로 유지될 것.
 */
function SliderScreenPlaceholder({ screen, normalized }: Props) {
  const color = SCREEN_COLORS[screen % SCREEN_COLORS.length]
  return (
    <div
      style={{
        background: color,
        color: '#fff',
        padding: 20,
        borderRadius: 8,
        textAlign: 'center',
        minWidth: 160,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.8 }}>SLIDER SCREEN (placeholder)</div>
      <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.2 }}>{screen}</div>
      <div style={{ fontSize: 11, opacity: 0.8 }}>normalized {normalized.toFixed(2)}</div>
    </div>
  )
}

export default SliderScreenPlaceholder
