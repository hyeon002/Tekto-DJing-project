// 슬라이더 모듈(ESP32-C3)과의 BLE 연결. GATT connect + notify 구독 방식 (slider.ino와 짝).
// 마스터 음악 속도 매핑용 값(0~1000)을 0~1로 정규화한다.
// 연결/재연결 공용 로직은 gattNotifyConnection.ts 참고.

import { GattNotifyConnection, type BleConnectionStatus } from './gattNotifyConnection'

const DEVICE_NAME_PREFIX = 'BLEMIDI'
const SLIDER_SERVICE_UUID = 'a1b2c201-1234-5678-9abc-def012345678'
const SLIDER_CHARACTERISTIC_UUID = 'a1b2c202-1234-5678-9abc-def012345678'

const RAW_MAX = 1000

export type SliderConnectionStatus = BleConnectionStatus

export interface SliderValues {
  speed: number // 0..1 (슬라이더 최하단 0, 최상단 1 — 마스터 음악 속도 매핑용)
}

// 특성 값 포맷 (slider.ino): [P LSB, P MSB] — uint16 리틀엔디안, 0~1000
export function parseSliderCharacteristicValue(data: DataView): SliderValues | null {
  if (data.byteLength < 2) return null

  const raw = data.getUint16(0, true)
  return { speed: Math.min(RAW_MAX, Math.max(0, raw)) / RAW_MAX }
}

export class SliderBleConnection extends GattNotifyConnection<SliderValues> {
  constructor() {
    super({
      deviceNamePrefix: DEVICE_NAME_PREFIX,
      serviceUuid: SLIDER_SERVICE_UUID,
      characteristicUuid: SLIDER_CHARACTERISTIC_UUID,
      parseValue: parseSliderCharacteristicValue,
    })
  }
}
