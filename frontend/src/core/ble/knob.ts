// 노브 모듈(ESP32-C3)과의 BLE 연결. GATT connect + notify 구독 방식 (knob.ino와 짝).
// 값은 기기에서 이미 0~100으로 정규화되어 오므로 여기서 0~1로 변환만 한다.
// 연결/재연결 공용 로직은 gattNotifyConnection.ts 참고.

import { GattNotifyConnection, type BleConnectionStatus } from './gattNotifyConnection'

const DEVICE_NAME_PREFIX = 'BLEMIDI'
const KNOB_SERVICE_UUID = 'a1b2c301-1234-5678-9abc-def012345678'
const KNOB_CHARACTERISTIC_UUID = 'a1b2c302-1234-5678-9abc-def012345678'

export type KnobConnectionStatus = BleConnectionStatus

export interface KnobValues {
  treble: number // 0..1
  bass: number // 0..1
  volume: number // 0..1
}

function clamp01From100(raw: number): number {
  return Math.min(100, Math.max(0, raw)) / 100
}

// 특성 값 포맷 (knob.ino): [treble, bass, volume] — 3바이트
export function parseKnobCharacteristicValue(data: DataView): KnobValues | null {
  if (data.byteLength < 3) return null

  return {
    treble: clamp01From100(data.getUint8(0)),
    bass: clamp01From100(data.getUint8(1)),
    volume: clamp01From100(data.getUint8(2)),
  }
}

export class KnobBleConnection extends GattNotifyConnection<KnobValues> {
  constructor() {
    super({
      deviceNamePrefix: DEVICE_NAME_PREFIX,
      serviceUuid: KNOB_SERVICE_UUID,
      characteristicUuid: KNOB_CHARACTERISTIC_UUID,
      parseValue: parseKnobCharacteristicValue,
    })
  }
}
