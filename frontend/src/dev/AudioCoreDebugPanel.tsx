import { useEffect, useRef, useState } from 'react'
import { AudioCore } from '../core/audio/AudioCore'
import { JogBleLink } from '../core/ble/JogBleLink'
import { KnobBleLink, type KnobValues } from '../core/ble/KnobBleLink'
import { SliderBleLink } from '../core/ble/SliderBleLink'
import type { BleLinkConnectionState } from '../core/ble/bleLinkShared'
import { ControlBus } from '../core/input/ControlBus'
import { JogSerialLink, type SerialLinkState } from '../core/serial/JogSerialLink'
import KnobScreenPlaceholder from '../ui/KnobScreenPlaceholder'
import SliderScreenPlaceholder from '../ui/SliderScreenPlaceholder'
import { useControlScreen } from '../ui/useControlScreen'
import DotMatrixVisualizer from '../visualizer/DotMatrixVisualizer'

const SERIAL_STATE_LABEL: Record<SerialLinkState, string> = {
  disconnected: '미연결',
  connecting: '연결 중...',
  connected: '연결됨',
  error: '에러',
}

const BLE_STATE_LABEL: Record<BleLinkConnectionState, string> = {
  disconnected: '미연결',
  connecting: '연결 중...',
  'connected-gatt': '연결됨 (GATT)',
  'connected-advertising': '연결됨 (advertising)',
  error: '에러',
}

/**
 * 하드웨어(BLE/Serial) 연동 전, AudioCore를 브라우저에서 바로 눌러볼 수 있는 개발용 패널.
 * 최종 UI가 아니며, 실제 조그휠/슬라이더/노브 입력이 준비되면 들어내거나 교체한다.
 */
function AudioCoreDebugPanel() {
  const engineRef = useRef<AudioCore | null>(null)
  if (engineRef.current === null) {
    engineRef.current = new AudioCore()
  }
  const serialLinkRef = useRef<JogSerialLink | null>(null)
  if (serialLinkRef.current === null) {
    serialLinkRef.current = new JogSerialLink()
  }
  const controlBusRef = useRef<ControlBus | null>(null)
  if (controlBusRef.current === null) {
    controlBusRef.current = new ControlBus()
  }
  const jogBleRef = useRef<JogBleLink | null>(null)
  if (jogBleRef.current === null) {
    jogBleRef.current = new JogBleLink()
  }
  const sliderBleRef = useRef<SliderBleLink | null>(null)
  if (sliderBleRef.current === null) {
    sliderBleRef.current = new SliderBleLink()
  }
  const knobBleRef = useRef<KnobBleLink | null>(null)
  if (knobBleRef.current === null) {
    knobBleRef.current = new KnobBleLink()
  }

  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const [jogPressed, setJogPressed] = useState(false)
  const [sliderValue, setSliderValue] = useState(500)
  const [knobTreble, setKnobTreble] = useState(50)
  const [knobBass, setKnobBass] = useState(100)
  const [knobVolume, setKnobVolume] = useState(100)

  const [serialState, setSerialState] = useState<SerialLinkState>('disconnected')
  const [lastRawLine, setLastRawLine] = useState('')
  const [serialJogTouching, setSerialJogTouching] = useState(false)

  const [jogBleState, setJogBleState] = useState<BleLinkConnectionState>('disconnected')
  const [jogBleRawHex, setJogBleRawHex] = useState('')
  const [jogBleTouching, setJogBleTouching] = useState(false)

  const [sliderBleState, setSliderBleState] = useState<BleLinkConnectionState>('disconnected')
  const [sliderBleRawHex, setSliderBleRawHex] = useState('')
  const [sliderBleValue, setSliderBleValue] = useState<number | null>(null)

  const [knobBleState, setKnobBleState] = useState<BleLinkConnectionState>('disconnected')
  const [knobBleRawHex, setKnobBleRawHex] = useState('')
  const [knobBleValue, setKnobBleValue] = useState<KnobValues | null>(null)

  const { sliderScreen, sliderNormalized, knobScreen, knobNormalized } = useControlScreen(controlBusRef.current!)

  useEffect(() => {
    const engine = engineRef.current
    const serialLink = serialLinkRef.current
    const controlBus = controlBusRef.current

    // ControlBus가 유일한 입구다 — AudioCore는 여기서만 값을 받고, Mock 버튼/시리얼은
    // 모두 controlBus.push*()를 호출할 뿐 AudioCore를 직접 부르지 않는다.
    const unsubscribe = controlBus?.subscribe({
      onJogTouch: ({ isTouching }) => engine?.setJogTouch(isTouching),
      onSlider: ({ raw }) => engine?.setSliderValue(raw),
      onKnob: ({ treble, bass, volume }) => engine?.setKnobValues({ treble, bass, volume }),
    })

    if (serialLink) {
      serialLink.onStateChange = setSerialState
      serialLink.onLine = setLastRawLine
      serialLink.onTouchChange = (isTouching) => {
        setSerialJogTouching(isTouching)
        controlBus?.pushJogTouch(isTouching)
      }
    }

    const jogBle = jogBleRef.current
    if (jogBle) {
      jogBle.onConnectionStateChange = setJogBleState
      jogBle.onRawPacket = (hex) => setJogBleRawHex(hex)
      jogBle.onValue = (isTouching) => {
        setJogBleTouching(isTouching)
        controlBus?.pushJogTouch(isTouching)
      }
    }

    const sliderBle = sliderBleRef.current
    if (sliderBle) {
      sliderBle.onConnectionStateChange = setSliderBleState
      sliderBle.onRawPacket = (hex) => setSliderBleRawHex(hex)
      // extractSliderValue가 아직 null만 반환하므로 지금은 절대 호출되지 않는다 —
      // 실기기 파싱 로직이 채워지면 이 콜백을 통해 자동으로 ControlBus에 연결된다.
      sliderBle.onValue = (value) => {
        setSliderBleValue(value)
        controlBus?.pushSlider(value)
      }
    }

    const knobBle = knobBleRef.current
    if (knobBle) {
      knobBle.onConnectionStateChange = setKnobBleState
      knobBle.onRawPacket = (hex) => setKnobBleRawHex(hex)
      knobBle.onValue = (value) => {
        setKnobBleValue(value)
        controlBus?.pushKnob(value.treble, value.bass, value.volume)
      }
    }

    return () => {
      unsubscribe?.()
      engine?.dispose()
      void serialLink?.disconnect()
      void jogBle?.disconnect()
      void sliderBle?.disconnect()
      void knobBle?.disconnect()
    }
  }, [])

  const handleStart = async () => {
    if (ready || starting) return
    setStarting(true)
    await engineRef.current?.initialize()
    setStarting(false)
    setReady(true)
  }

  const handleJogDown = () => {
    setJogPressed(true)
    controlBusRef.current?.pushJogTouch(true)
  }

  const handleJogUp = () => {
    setJogPressed(false)
    controlBusRef.current?.pushJogTouch(false)
  }

  const handleSerialConnect = async () => {
    await serialLinkRef.current?.connect()
  }

  const handleSerialDisconnect = async () => {
    await serialLinkRef.current?.disconnect()
  }

  const handleJogBleConnect = async () => {
    await jogBleRef.current?.connect()
  }

  const handleJogBleDisconnect = async () => {
    await jogBleRef.current?.disconnect()
  }

  const handleSliderBleConnect = async () => {
    await sliderBleRef.current?.connect()
  }

  const handleSliderBleDisconnect = async () => {
    await sliderBleRef.current?.disconnect()
  }

  const handleKnobBleConnect = async () => {
    await knobBleRef.current?.connect()
  }

  const handleKnobBleDisconnect = async () => {
    await knobBleRef.current?.disconnect()
  }

  return (
    <div style={{ border: '1px dashed #888', borderRadius: 8, padding: 16, maxWidth: 360, fontFamily: 'monospace' }}>
      <p style={{ margin: '0 0 12px', fontSize: 12, opacity: 0.7 }}>
        AudioCore 개발용 디버그 패널 — 최종 UI 아님, 하드웨어 연동 전 임시 입력
      </p>

      <button onClick={handleStart} disabled={ready || starting}>
        {ready ? '오디오 실행 중' : starting ? '로딩 중...' : '오디오 시작'}
      </button>

      <div style={{ marginTop: 16 }}>
        <label>조그휠 Mock (누르고 있는 동안 On)</label>
        <br />
        <button
          disabled={!ready}
          onMouseDown={handleJogDown}
          onMouseUp={handleJogUp}
          onMouseLeave={() => jogPressed && handleJogUp()}
        >
          {jogPressed ? '스크래치 중...' : '누르고 있기'}
        </button>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12 }}>
        <label>조그휠 실제 하드웨어 (USB Serial, 9600bps)</label>
        <br />
        {!JogSerialLink.isSupported() && (
          <p style={{ fontSize: 12, color: '#c55' }}>
            이 브라우저는 Web Serial을 지원하지 않습니다 (Chrome/Edge 권장).
          </p>
        )}
        {serialState === 'connected' ? (
          <button onClick={handleSerialDisconnect}>시리얼 연결 해제</button>
        ) : (
          <button onClick={handleSerialConnect} disabled={!JogSerialLink.isSupported() || serialState === 'connecting'}>
            시리얼 연결
          </button>
        )}
        <p style={{ fontSize: 12, margin: '8px 0 0' }}>
          상태: {SERIAL_STATE_LABEL[serialState]} · 조그휠(Serial): {serialJogTouching ? '터치 중' : '아님'}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7, wordBreak: 'break-all' }}>
          마지막 raw line: {lastRawLine || '(없음)'}
        </p>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12 }}>
        <label>조그휠 실제 하드웨어 (BLE, BLEMIDI_1)</label>
        <br />
        {!JogBleLink.isSupported() && (
          <p style={{ fontSize: 12, color: '#c55' }}>
            이 브라우저는 Web Bluetooth를 지원하지 않습니다 (Chrome/Edge 권장).
          </p>
        )}
        {jogBleState === 'connected-gatt' || jogBleState === 'connected-advertising' ? (
          <button onClick={handleJogBleDisconnect}>조그휠 BLE 연결 해제</button>
        ) : (
          <button onClick={handleJogBleConnect} disabled={!JogBleLink.isSupported() || jogBleState === 'connecting'}>
            조그휠 BLE 연결
          </button>
        )}
        <p style={{ fontSize: 12, margin: '8px 0 0' }}>
          상태: {BLE_STATE_LABEL[jogBleState]} · 조그휠(BLE): {jogBleTouching ? '터치 중' : '아님'}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7, wordBreak: 'break-all' }}>
          마지막 raw hex: {jogBleRawHex || '(없음)'}
        </p>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12 }}>
        <label>슬라이더 실제 하드웨어 (BLE, BLEMIDI_3)</label>
        <br />
        {!SliderBleLink.isSupported() && (
          <p style={{ fontSize: 12, color: '#c55' }}>
            이 브라우저는 Web Bluetooth를 지원하지 않습니다 (Chrome/Edge 권장).
          </p>
        )}
        {sliderBleState === 'connected-gatt' || sliderBleState === 'connected-advertising' ? (
          <button onClick={handleSliderBleDisconnect}>슬라이더 BLE 연결 해제</button>
        ) : (
          <button onClick={handleSliderBleConnect} disabled={!SliderBleLink.isSupported() || sliderBleState === 'connecting'}>
            슬라이더 BLE 연결
          </button>
        )}
        <p style={{ fontSize: 12, margin: '8px 0 0' }}>
          상태: {BLE_STATE_LABEL[sliderBleState]} · 값: {sliderBleValue === null ? '파싱 대기 중' : sliderBleValue}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7, wordBreak: 'break-all' }}>
          마지막 raw hex: {sliderBleRawHex || '(없음)'}
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>슬라이더 — 배속 (raw {sliderValue} BPM)</label>
        <br />
        <input
          type="range"
          min={0}
          max={1000}
          value={sliderValue}
          disabled={!ready}
          onChange={(e) => {
            const v = Number(e.target.value)
            setSliderValue(v)
            controlBusRef.current?.pushSlider(v)
          }}
        />
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12 }}>
        <label>노브 실제 하드웨어 (BLE, BLEMIDI_2)</label>
        <br />
        {!KnobBleLink.isSupported() && (
          <p style={{ fontSize: 12, color: '#c55' }}>
            이 브라우저는 Web Bluetooth를 지원하지 않습니다 (Chrome/Edge 권장).
          </p>
        )}
        {knobBleState === 'connected-gatt' || knobBleState === 'connected-advertising' ? (
          <button onClick={handleKnobBleDisconnect}>노브 BLE 연결 해제</button>
        ) : (
          <button onClick={handleKnobBleConnect} disabled={!KnobBleLink.isSupported() || knobBleState === 'connecting'}>
            노브 BLE 연결
          </button>
        )}
        <p style={{ fontSize: 12, margin: '8px 0 0' }}>
          상태: {BLE_STATE_LABEL[knobBleState]} · 값:{' '}
          {knobBleValue === null
            ? '파싱 대기 중'
            : `T${knobBleValue.treble} B${knobBleValue.bass} V${knobBleValue.volume}`}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7, wordBreak: 'break-all' }}>
          마지막 raw hex: {knobBleRawHex || '(없음)'}
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>노브 Mock — Treble (raw {knobTreble})</label>
        <br />
        <input
          type="range"
          min={0}
          max={100}
          value={knobTreble}
          disabled={!ready}
          onChange={(e) => {
            const v = Number(e.target.value)
            setKnobTreble(v)
            controlBusRef.current?.pushKnob(v, knobBass, knobVolume)
          }}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>노브 Mock — Bass (raw {knobBass})</label>
        <br />
        <input
          type="range"
          min={0}
          max={100}
          value={knobBass}
          disabled={!ready}
          onChange={(e) => {
            const v = Number(e.target.value)
            setKnobBass(v)
            controlBusRef.current?.pushKnob(knobTreble, v, knobVolume)
          }}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>노브 Mock — Volume (raw {knobVolume})</label>
        <br />
        <input
          type="range"
          min={0}
          max={100}
          value={knobVolume}
          disabled={!ready}
          onChange={(e) => {
            const v = Number(e.target.value)
            setKnobVolume(v)
            controlBusRef.current?.pushKnob(knobTreble, knobBass, v)
          }}
        />
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12, display: 'flex', gap: 12 }}>
        <SliderScreenPlaceholder screen={sliderScreen} normalized={sliderNormalized} />
        <KnobScreenPlaceholder screen={knobScreen} normalized={knobNormalized} />
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid #444', paddingTop: 12 }}>
        <label>도트매트릭스 비주얼라이저 (프로토타입)</label>
        <DotMatrixVisualizer audioCore={engineRef.current!} controlBus={controlBusRef.current!} />
      </div>
    </div>
  )
}

export default AudioCoreDebugPanel