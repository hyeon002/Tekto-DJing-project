import { BleLinkBase } from './bleLinkShared'

// 조그휠 터치 센서 모듈의 BLE 광고 이름.
const NAME_PREFIX = 'BLEMIDI_1'

// 조그휠 펌웨어(ESP32-C3, non-connectable 광고 전용, 스텝모터+터치센서)가 실어 보내는
// manufacturerData 포맷: Company ID(0xFFFF, 테스트용)는 Web Bluetooth가 이미 벗겨내고
// 넘겨주므로, 여기 raw는 ['T', 0|1] 2바이트다. 1=터치 On, 0=터치 Off.
const DEVICE_TAG = 0x54 // 'T'

function extractTouchValue(raw: Uint8Array): boolean | null {
  if (raw.length < 2 || raw[0] !== DEVICE_TAG) return null
  return raw[1] === 1
}

export class JogBleLink extends BleLinkBase<boolean> {
  constructor() {
    super({ namePrefix: NAME_PREFIX, extractValue: extractTouchValue })
  }
}
