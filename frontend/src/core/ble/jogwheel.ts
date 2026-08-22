// 조그휠 모듈(ESP32-C3, 터치+스텝모터)과의 BLE 연결. GATT connect + notify 구독 방식
// (step.ino와 짝). 터치 On/Off 값만 받는다 — 기능 명세서 3-1 기준으로 UI에는 반영하지
// 않고 오디오 트랙 전환 트리거로만 쓰이지만, 여기서는 실기기 연결 확인용으로 값을 그대로
// 노출한다.

import { GattNotifyConnection, type BleConnectionStatus } from './gattNotifyConnection'

const DEVICE_NAME_PREFIX = 'BLEMIDI'
const JOGWHEEL_SERVICE_UUID = 'a1b2c101-1234-5678-9abc-def012345678'
const JOGWHEEL_CHARACTERISTIC_UUID = 'a1b2c102-1234-5678-9abc-def012345678'

export type JogWheelConnectionStatus = BleConnectionStatus

export interface JogWheelValues {
  touched: boolean
}

// 특성 값 포맷 (step.ino): [터치상태(0=OFF, 1=ON)] — 1바이트
export function parseJogWheelCharacteristicValue(data: DataView): JogWheelValues | null {
  if (data.byteLength < 1) return null
  return { touched: data.getUint8(0) === 1 }
}

export class JogWheelBleConnection extends GattNotifyConnection<JogWheelValues> {
  constructor() {
    super({
      deviceNamePrefix: DEVICE_NAME_PREFIX,
      serviceUuid: JOGWHEEL_SERVICE_UUID,
      characteristicUuid: JOGWHEEL_CHARACTERISTIC_UUID,
      parseValue: parseJogWheelCharacteristicValue,
    })
  }
}
