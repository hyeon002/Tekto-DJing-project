import { BleLinkBase } from './bleLinkShared'

// 슬라이더 모듈의 BLE 광고 이름 (아두맨 확인 사항).
const NAME_PREFIX = 'BLEMIDI_3'

// 슬라이더 펌웨어(ESP32-C3, non-connectable 광고 전용)가 실어 보내는 manufacturerData
// 포맷: Company ID(0xFFFF, 테스트용)는 Web Bluetooth가 이미 벗겨내고 넘겨주므로, 여기 raw는
// ['P', BPM LSB, BPM MSB] 3바이트다. 값은 BPM 0~1000, 리틀엔디안 2바이트.
const DEVICE_TAG = 0x50 // 'P'

function extractSliderValue(raw: Uint8Array): number | null {
  if (raw.length < 3 || raw[0] !== DEVICE_TAG) return null
  return raw[1] | (raw[2] << 8)
}

export class SliderBleLink extends BleLinkBase<number> {
  constructor() {
    super({ namePrefix: NAME_PREFIX, extractValue: extractSliderValue })
  }
}
