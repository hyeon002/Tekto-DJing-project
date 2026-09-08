// Web Bluetooth API 최소 타입 선언.
// TypeScript 표준 DOM lib에는 아직 포함되어 있지 않다 (W3C 커뮤니티그룹 초안 단계).
// 참고: https://webbluetoothcg.github.io/web-bluetooth/
// import/export가 없는 순수 전역 선언 파일이어야 lib.dom.d.ts의 Navigator와 병합된다.
// (core/serial/web-serial.d.ts와 동일한 패턴 — 외부 @types 패키지 없이 자체 선언)

interface BluetoothLEScanFilterInit {
  services?: (string | number)[]
  name?: string
  namePrefix?: string
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilterInit[]
  optionalServices?: (string | number)[]
  acceptAllDevices?: boolean
}

interface BluetoothCharacteristicProperties {
  readonly broadcast: boolean
  readonly read: boolean
  readonly writeWithoutResponse: boolean
  readonly write: boolean
  readonly notify: boolean
  readonly indicate: boolean
  readonly authenticatedSignedWrites: boolean
  readonly reliableWrite: boolean
  readonly writableAuxiliaries: boolean
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly uuid: string
  readonly properties: BluetoothCharacteristicProperties
  readonly value: DataView | null
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTService extends EventTarget {
  readonly uuid: string
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  readonly device: BluetoothDevice
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
}

// 광고 패킷의 manufacturerData/serviceData는 companyId(number) 또는 UUID(string) -> DataView 맵으로 온다.
type BluetoothManufacturerDataMap = Map<number, DataView>
type BluetoothServiceDataMap = Map<string, DataView>

interface BluetoothAdvertisingEvent extends Event {
  readonly device: BluetoothDevice
  readonly rssi: number | null
  readonly txPower: number | null
  readonly name: string | undefined
  readonly uuids: string[]
  readonly manufacturerData: BluetoothManufacturerDataMap
  readonly serviceData: BluetoothServiceDataMap
}

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name: string | undefined
  readonly gatt: BluetoothRemoteGATTServer | undefined
  watchAdvertisements(): Promise<void>
}

interface Bluetooth extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
}

interface Navigator {
  readonly bluetooth: Bluetooth
}
