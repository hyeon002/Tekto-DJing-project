// GATT connect + notify 구독 공용 로직.
// 노브/슬라이더/조그휠 등 개별 모듈은 서비스·특성 UUID와 값 파싱 방식만 다르고
// 연결 수립/끊김 감지/재연결 로직은 동일해서 여기로 모았다.

const RECONNECT_BASE_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 15000

export type BleConnectionStatus = 'disconnected' | 'connecting' | 'connected'

type ValuesListener<T> = (values: T) => void
type StatusListener = (status: BleConnectionStatus) => void

export interface GattNotifyConnectionOptions<T> {
  deviceNamePrefix: string
  serviceUuid: BluetoothServiceUUID
  characteristicUuid: BluetoothCharacteristicUUID
  parseValue: (data: DataView) => T | null
}

export class GattNotifyConnection<T> {
  private readonly options: GattNotifyConnectionOptions<T>
  private device: BluetoothDevice | null = null
  private status: BleConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manualDisconnect = false
  private readonly valueListeners = new Set<ValuesListener<T>>()
  private readonly statusListeners = new Set<StatusListener>()

  constructor(options: GattNotifyConnectionOptions<T>) {
    this.options = options
  }

  getStatus(): BleConnectionStatus {
    return this.status
  }

  onValues(listener: ValuesListener<T>): () => void {
    this.valueListeners.add(listener)
    return () => this.valueListeners.delete(listener)
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /** 브라우저 보안 정책상 반드시 버튼 클릭 등 사용자 제스처 안에서 호출해야 한다. */
  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('이 브라우저는 Web Bluetooth를 지원하지 않습니다.')
    }

    this.manualDisconnect = false
    this.setStatus('connecting')
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: this.options.deviceNamePrefix, services: [this.options.serviceUuid] }],
        optionalServices: [this.options.serviceUuid],
      })

      this.device = device
      device.addEventListener('gattserverdisconnected', this.handleDisconnected)

      await this.connectGatt(device)
    } catch (err) {
      this.setStatus('disconnected')
      throw err
    }
  }

  disconnect(): void {
    this.manualDisconnect = true
    this.clearReconnectTimer()
    this.device?.removeEventListener('gattserverdisconnected', this.handleDisconnected)
    if (this.device?.gatt?.connected) this.device.gatt.disconnect()
    this.device = null
    this.setStatus('disconnected')
  }

  private async connectGatt(device: BluetoothDevice): Promise<void> {
    if (!device.gatt) throw new Error('이 기기는 GATT 연결을 지원하지 않습니다.')

    const server = await device.gatt.connect()
    const service = await server.getPrimaryService(this.options.serviceUuid)
    const characteristic = await service.getCharacteristic(this.options.characteristicUuid)

    await characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', this.handleValueChanged)

    this.reconnectAttempts = 0
    this.setStatus('connected')
  }

  private handleValueChanged = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    const data = characteristic.value
    if (!data) return

    const values = this.options.parseValue(data)
    if (!values) return

    this.valueListeners.forEach((listener) => listener(values))
  }

  private handleDisconnected = (): void => {
    if (this.manualDisconnect) return
    this.setStatus('connecting')
    this.attemptReconnect()
  }

  private attemptReconnect(): void {
    const device = this.device
    if (!device) return

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** Math.min(this.reconnectAttempts, 4),
      RECONNECT_MAX_DELAY_MS,
    )
    this.reconnectAttempts += 1

    this.reconnectTimer = setTimeout(() => {
      this.connectGatt(device).catch(() => this.attemptReconnect())
    }, delay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private setStatus(status: BleConnectionStatus): void {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }
}
