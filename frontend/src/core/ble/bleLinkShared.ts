// SliderBleLink / KnobBleLink이 공유하는 BLE 연결 상태관리 + "GATT 우선 시도, 실패 시
// advertising 폴백" 로직. React나 ControlBus를 직접 참조하지 않고 콜백만 노출한다 —
// 실제 배선(ControlBus.pushSlider 등)은 사용하는 쪽(dev/AudioCoreDebugPanel)에서 한다.
//
// 아래 UUID와 optionalServices 추측 목록은 frontend/tools/test-ble.html(하드웨어 검증
// 도구)에서 이미 검증해본 값을 그대로 재사용한 것이다. 기기 이름이 BLEMIDI_*인 걸 보면
// 표준 BLE-MIDI 프로파일을 쓸 가능성이 있어 우선 후보로 삼았다.
//
// 과거(구버전 펌웨어) 진단 로그 기준으로는 GATT 연결 자체가 계속 실패하고 advertising의
// manufacturerData도 비어 있었다 — 즉 그 시점 펌웨어는 GATT 미지원으로 추정됐다. 하지만
// 펌웨어가 최근 업데이트됐을 수 있으므로, 그 결과를 가정하지 않고 GATT부터 다시 시도한
// 뒤 실패할 때만 advertising으로 넘어가는 구조로 만들어뒀다.

export const BLE_MIDI_SERVICE_UUID = '03b80e5a-ede8-4b33-a751-6ce34ec4c700'
export const BLE_MIDI_CHARACTERISTIC_UUID = '7772e5db-3868-4112-a1a9-f2669d106bf3'

// ⚠️ requestDevice()의 optionalServices에 명시하지 않은 서비스는 연결 후에도 절대
// getPrimaryService*()로 접근할 수 없다 (Web Bluetooth 보안 정책). 지금은 BLE-MIDI 표준
// UUID를 우선 후보로 넣어뒀지만, 실기기 테스트 결과 커스텀 서비스로 밝혀지면 그 UUID를
// 이 배열에 반드시 추가해야 GATT 경로가 동작한다.
export const OPTIONAL_SERVICES: (string | number)[] = [
  BLE_MIDI_SERVICE_UUID,
  'generic_access',
  'generic_attribute',
  'device_information',
  'battery_service',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service — ESP32 예제에서 흔히 쓰임
]

export type BleLinkConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected-gatt'
  | 'connected-advertising'
  | 'error'

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
}

export interface BleLinkOptions<TValue> {
  /** navigator.bluetooth.requestDevice() 필터용 광고 이름 prefix. 예: 'BLEMIDI_2' */
  namePrefix: string
  /**
   * raw 바이트 -> 실제 값(기기마다 모양이 다름 — 슬라이더는 number 1개, 노브는
   * {treble,bass,volume} 객체 등) 변환 함수. 값이 확정되지 않은 동안은 null을 반환해야
   * 하며, 그동안 onValue는 절대 호출되지 않는다.
   */
  extractValue: (raw: Uint8Array) => TValue | null
}

export class BleLinkBase<TValue = number> {
  private readonly namePrefix: string
  private readonly extractValue: (raw: Uint8Array) => TValue | null

  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private state: BleLinkConnectionState = 'disconnected'

  onConnectionStateChange: ((state: BleLinkConnectionState) => void) | null = null
  onRawPacket: ((hex: string, source: 'gatt' | 'advertising') => void) | null = null
  onValue: ((value: TValue) => void) | null = null

  constructor(options: BleLinkOptions<TValue>) {
    this.namePrefix = options.namePrefix
    this.extractValue = options.extractValue
  }

  static isSupported(): boolean {
    return 'bluetooth' in navigator
  }

  getState(): BleLinkConnectionState {
    return this.state
  }

  /** navigator.bluetooth.requestDevice()는 반드시 버튼 클릭 등 사용자 제스처 안에서 호출해야 한다. */
  async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'connected-gatt' || this.state === 'connected-advertising') return
    this.setState('connecting')

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: this.namePrefix }],
        optionalServices: OPTIONAL_SERVICES,
      })
      this.device = device
      device.addEventListener('gattserverdisconnected', this.handleGattDisconnected)

      const connectedViaGatt = await this.tryConnectGatt(device)
      if (!connectedViaGatt) {
        await this.tryWatchAdvertisements(device)
      }
    } catch (err) {
      console.error(`[BleLink:${this.namePrefix}] 연결 실패`, err)
      this.setState('error')
    }
  }

  async disconnect(): Promise<void> {
    const device = this.device
    if (this.characteristic) {
      try {
        await this.characteristic.stopNotifications()
      } catch {
        // 이미 끊긴 연결 등 — 무시
      }
      this.characteristic = null
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    device?.removeEventListener('gattserverdisconnected', this.handleGattDisconnected)
    device?.removeEventListener('advertisementreceived', this.handleAdvertisement)
    this.device = null
    this.setState('disconnected')
  }

  /** 1순위: GATT 연결 → BLE-MIDI 서비스/특성 탐색 → notify 구독. 실패하면 false를 반환해 advertising 폴백을 유도한다. */
  private async tryConnectGatt(device: BluetoothDevice): Promise<boolean> {
    const gatt = device.gatt
    if (!gatt) return false

    try {
      const server = await gatt.connect()
      const service = await server.getPrimaryService(BLE_MIDI_SERVICE_UUID)
      const characteristic = await service.getCharacteristic(BLE_MIDI_CHARACTERISTIC_UUID)
      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', this.handleGattValue)
      this.characteristic = characteristic
      this.setState('connected-gatt')
      console.log(`[BleLink:${this.namePrefix}] GATT 연결 성공 (service=${BLE_MIDI_SERVICE_UUID})`)
      return true
    } catch (err) {
      console.warn(`[BleLink:${this.namePrefix}] GATT 연결/서비스 탐색 실패 — advertising 경로로 폴백한다`, err)
      return false
    }
  }

  /** 2순위(폴백): GATT가 없는(광고 전용) 기기 대응. manufacturerData를 그대로 raw 패킷으로 흘려보낸다. */
  private async tryWatchAdvertisements(device: BluetoothDevice): Promise<void> {
    if (!('watchAdvertisements' in device)) {
      console.error(`[BleLink:${this.namePrefix}] GATT 실패 + watchAdvertisements 미지원 — 이 브라우저에서는 더 시도할 방법이 없다.`)
      this.setState('error')
      return
    }
    try {
      device.addEventListener('advertisementreceived', this.handleAdvertisement)
      await device.watchAdvertisements()
      this.setState('connected-advertising')
      console.log(`[BleLink:${this.namePrefix}] advertising 폴백 구독 시작`)
    } catch (err) {
      console.error(`[BleLink:${this.namePrefix}] advertising 폴백도 실패`, err)
      this.setState('error')
    }
  }

  private handleGattValue = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    const dataView = characteristic.value
    if (!dataView) return
    const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
    this.emitPacket(bytes, 'gatt')
  }

  private handleAdvertisement = (event: Event): void => {
    const advertisement = event as BluetoothAdvertisingEvent
    if (advertisement.manufacturerData.size === 0) {
      console.log(`[BleLink:${this.namePrefix}] 광고 수신 (manufacturerData 없음, rssi=${advertisement.rssi})`)
      return
    }
    advertisement.manufacturerData.forEach((dataView) => {
      const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
      this.emitPacket(bytes, 'advertising')
    })
  }

  private emitPacket(bytes: Uint8Array, source: 'gatt' | 'advertising'): void {
    const hex = toHex(bytes)
    console.log(`[BleLink:${this.namePrefix}] raw(${source}): ${hex}`)
    this.onRawPacket?.(hex, source)

    const value = this.extractValue(bytes)
    if (value !== null) this.onValue?.(value)
  }

  private handleGattDisconnected = (): void => {
    console.warn(`[BleLink:${this.namePrefix}] GATT 연결 끊김`)
    this.characteristic = null
    this.setState('disconnected')
  }

  private setState(state: BleLinkConnectionState): void {
    this.state = state
    this.onConnectionStateChange?.(state)
  }
}
