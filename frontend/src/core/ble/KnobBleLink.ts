import { BleLinkBase } from './bleLinkShared'

// 노브(Treble/Bass/Volume 3-포텐셔미터) 모듈의 BLE 광고 이름.
const NAME_PREFIX = 'BLEMIDI_2'

export interface KnobValues {
  treble: number
  bass: number
  volume: number
}

// 노브 펌웨어(ESP32-C3, non-connectable 광고 전용)가 실어 보내는 manufacturerData
// 포맷: Company ID(0xFFFF, 테스트용)는 Web Bluetooth가 이미 벗겨내고 넘겨주므로, 여기
// raw는 ['K', Treble, Bass, Volume] 4바이트다. 각 값은 0~100.
const DEVICE_TAG = 0x4b // 'K'

function extractKnobValue(raw: Uint8Array): KnobValues | null {
  if (raw.length < 4 || raw[0] !== DEVICE_TAG) return null
  return { treble: raw[1], bass: raw[2], volume: raw[3] }
}

export class KnobBleLink extends BleLinkBase<KnobValues> {
  constructor() {
    super({ namePrefix: NAME_PREFIX, extractValue: extractKnobValue })
  }
}
