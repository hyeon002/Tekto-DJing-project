import { toHex, type BleLinkConnectionState } from './bleLinkShared'

type Options<T> = {
 namePrefix: string
 serviceUuid: string
 characteristicUuid: string
 parse: (raw: Uint8Array) => T | null
}

// Matches the READ + NOTIFY characteristics in the supplied ESP32 firmware.
// Do not fall back to advertising: these firmware versions publish no input there.
export class FirmwareGattLink<T> {
 private options: Options<T>
 private device: BluetoothDevice | null = null
 private characteristic: BluetoothRemoteGATTCharacteristic | null = null
 private state: BleLinkConnectionState = 'disconnected'
 private generation = 0
 private notifications = 0
 onConnectionStateChange: ((state: BleLinkConnectionState) => void) | null = null
 onRawPacket: ((hex: string, source: 'gatt' | 'advertising') => void) | null = null
 onValue: ((value: T) => void) | null = null
 constructor(options: Options<T>) { this.options = options }
 static isSupported() { return 'bluetooth' in navigator }
 getState() { return this.state }
 async connect() {
  if (this.state === 'connecting' || this.state === 'connected-gatt') return
  const generation = ++this.generation
  this.setState('connecting')
  try {
   const device = await navigator.bluetooth.requestDevice({
    filters: [{namePrefix:this.options.namePrefix, services:[this.options.serviceUuid]}],
    optionalServices: [this.options.serviceUuid],
   })
   if (generation !== this.generation) return
   this.device = device
   device.addEventListener('gattserverdisconnected', this.disconnected)
   if (!device.gatt) throw new Error('GATT is unavailable')
   const server = await device.gatt.connect()
   if (generation !== this.generation) { device.gatt.disconnect(); return }
   const service = await server.getPrimaryService(this.options.serviceUuid)
   if (generation !== this.generation) return
   const characteristic = await service.getCharacteristic(this.options.characteristicUuid)
   if (generation !== this.generation) return
   this.characteristic = characteristic
   this.notifications = 0
   characteristic.addEventListener('characteristicvaluechanged', this.changed)
   await characteristic.startNotifications()
   if (generation !== this.generation) return
   this.setState('connected-gatt')
   // Firmware sends on change and once at GATT connect, possibly before CCCD subscription.
   // READ recovers the latest value without requiring the user to move a control first.
   const notifications = this.notifications
   try {
    const current = await characteristic.readValue()
    if (generation === this.generation && this.notifications === notifications) this.emit(current)
   } catch (error) {
    if (generation === this.generation) console.warn('초기 값 읽기 실패. 다음 notify 입력을 기다립니다.', error)
   }
  } catch (error) {
   if (generation !== this.generation) return
   this.detach()
   this.setState('error')
   console.error(`[${this.options.namePrefix}] GATT 연결 실패`, error)
  }
 }
 async disconnect() {
  ++this.generation
  this.detach()
  this.setState('disconnected')
 }
 private detach() {
  this.characteristic?.removeEventListener('characteristicvaluechanged', this.changed)
  this.characteristic = null
  this.device?.removeEventListener('gattserverdisconnected', this.disconnected)
  if (this.device?.gatt?.connected) this.device.gatt.disconnect()
  this.device = null
 }
 private disconnected = () => {
  ++this.generation
  this.detach()
  this.setState('disconnected')
 }
 private changed = (event: Event) => {
  if (event.target !== this.characteristic || !this.characteristic?.value) return
  ++this.notifications
  this.emit(this.characteristic.value)
 }
 private emit(data: DataView) {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  this.onRawPacket?.(toHex(bytes), 'gatt')
  const value = this.options.parse(bytes)
  if (value !== null) this.onValue?.(value)
 }
 private setState(state: BleLinkConnectionState) { this.state = state; this.onConnectionStateChange?.(state) }
}
