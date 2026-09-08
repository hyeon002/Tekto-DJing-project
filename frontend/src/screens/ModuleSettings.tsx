import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { BleConnectionStatus, GattNotifyConnection } from '../core/ble/gattNotifyConnection'
import { JogWheelBleConnection, type JogWheelValues } from '../core/ble/jogwheel'
import { KnobBleConnection, type KnobValues } from '../core/ble/knob'
import { SliderBleConnection, type SliderValues } from '../core/ble/slider'

const STATUS_LABEL: Record<BleConnectionStatus, string> = {
  disconnected: '연결 안 됨',
  connecting: '연결 중… (처음이면 기기 선택 창에서 선택 필요)',
  connected: '연결됨 — 실시간 수신 중',
}

function ValueGauge({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span>{percent}</span>
      </div>
      <div style={{ background: '#23262f', borderRadius: 4, height: 10, overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: '#7aa2ff',
            transition: 'width 80ms linear',
          }}
        />
      </div>
    </div>
  )
}

function TouchIndicator({ touched }: { touched: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: touched ? '#4ade80' : '#333744',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 13 }}>{touched ? '터치 감지됨 (ON)' : '터치 없음 (OFF)'}</span>
    </div>
  )
}

function useBleConnection<T>(createConnection: () => GattNotifyConnection<T>, zeroValues: T) {
  const connectionRef = useRef<GattNotifyConnection<T> | null>(null)
  const [status, setStatus] = useState<BleConnectionStatus>('disconnected')
  const [values, setValues] = useState<T>(zeroValues)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const connection = createConnection()
    connectionRef.current = connection

    const offStatus = connection.onStatus(setStatus)
    const offValues = connection.onValues(setValues)

    return () => {
      offStatus()
      offValues()
      connection.disconnect()
    }
    // 마운트 시 한 번만 연결 인스턴스를 만든다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnectClick() {
    setError(null)
    setValues(zeroValues) // 재연결 시 이전 세션의 마지막 값이 남아있지 않도록 초기화
    try {
      await connectionRef.current?.connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return { status, values, error, handleConnectClick }
}

function ModuleConnectionPanel({
  title,
  connectLabel,
  status,
  error,
  onConnectClick,
  children,
}: {
  title: string
  connectLabel: string
  status: BleConnectionStatus
  error: string | null
  onConnectClick: () => void
  children: ReactNode
}) {
  const isBusy = status === 'connecting'

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>{title}</h2>

      <button onClick={onConnectClick} disabled={isBusy}>
        {status === 'disconnected' ? connectLabel : '다시 연결'}
      </button>
      <p style={{ fontSize: 13, color: '#9099ab' }}>{STATUS_LABEL[status]}</p>
      {error && <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>}

      <div style={{ marginTop: 16 }}>{children}</div>
    </div>
  )
}

const KNOB_ZERO: KnobValues = { treble: 0, bass: 0, volume: 0 }
const SLIDER_ZERO: SliderValues = { speed: 0 }
const JOGWHEEL_ZERO: JogWheelValues = { touched: false }

function ModuleSettings() {
  const knob = useBleConnection(() => new KnobBleConnection(), KNOB_ZERO)
  const slider = useBleConnection(() => new SliderBleConnection(), SLIDER_ZERO)
  const jogwheel = useBleConnection(() => new JogWheelBleConnection(), JOGWHEEL_ZERO)

  return (
    <div style={{ padding: 24, maxWidth: 360 }}>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>모듈 연결 설정</h1>

      <ModuleConnectionPanel
        title="노브 (BLEMIDI_2)"
        connectLabel="노브 연결"
        status={knob.status}
        error={knob.error}
        onConnectClick={knob.handleConnectClick}
      >
        <ValueGauge label="Treble" value={knob.values.treble} />
        <ValueGauge label="Bass" value={knob.values.bass} />
        <ValueGauge label="Volume" value={knob.values.volume} />
      </ModuleConnectionPanel>

      <ModuleConnectionPanel
        title="슬라이더 (BLEMIDI_3)"
        connectLabel="슬라이더 연결"
        status={slider.status}
        error={slider.error}
        onConnectClick={slider.handleConnectClick}
      >
        <ValueGauge label="속도" value={slider.values.speed} />
      </ModuleConnectionPanel>

      <ModuleConnectionPanel
        title="조그휠 (BLEMIDI_1)"
        connectLabel="조그휠 연결"
        status={jogwheel.status}
        error={jogwheel.error}
        onConnectClick={jogwheel.handleConnectClick}
      >
        <TouchIndicator touched={jogwheel.values.touched} />
      </ModuleConnectionPanel>
    </div>
  )
}

export default ModuleSettings
