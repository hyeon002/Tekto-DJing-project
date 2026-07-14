// 공용 타입 정의. audio/ble/visualizer/screens가 공유하는 도메인 타입만 여기에 둔다.
// 지금은 뼈대만 — 실제 필드는 audio/ble 모듈 작성 시 채운다.

/** 물리 모듈 종류 (노브 / 슬라이더 / 조그휠) */
export type ModuleType = 'knob' | 'slider' | 'jogwheel'

/** BLE로 연결된 개별 모듈을 식별하는 ID */
export type ModuleId = string

/** 모듈 위의 개별 조작 요소(노브 1개, 슬라이더 1개 등)를 식별하는 ID */
export type ControlId = string

/** 모듈에서 들어오는 원시 입력 이벤트 */
export interface ControlInputEvent {
  moduleId: ModuleId
  controlId: ControlId
  value: number
  timestamp: number
}
