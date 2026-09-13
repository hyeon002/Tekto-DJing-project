import { FirmwareGattLink } from './FirmwareGattLink'

export const JOG_SERVICE_UUID = 'a1b2c101-1234-5678-9abc-def012345678'
export const JOG_CHARACTERISTIC_UUID = 'a1b2c102-1234-5678-9abc-def012345678'

// Firmware sends touch only: [0] released or [1] touched. No angle or motor speed.
export function parseJogPacket(raw: Uint8Array): boolean | null {
 if (raw.length !== 1 || raw[0] > 1) return null
 return raw[0] === 1
}
export class JogBleLink extends FirmwareGattLink<boolean> {
 constructor() {
  super({namePrefix:'BLEMIDI_1', serviceUuid:JOG_SERVICE_UUID,
   characteristicUuid:JOG_CHARACTERISTIC_UUID, parse:parseJogPacket})
 }
}
