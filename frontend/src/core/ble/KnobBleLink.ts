import { FirmwareGattLink } from './FirmwareGattLink'

export interface KnobValues { treble: number; bass: number; volume: number }
export const KNOB_SERVICE_UUID = 'a1b2c301-1234-5678-9abc-def012345678'
export const KNOB_CHARACTERISTIC_UUID = 'a1b2c302-1234-5678-9abc-def012345678'

// Firmware sends exactly [T, B, V], each 0..100. No K tag or MIDI header.
export function parseKnobPacket(raw: Uint8Array): KnobValues | null {
 if (raw.length !== 3 || raw.some(value => value > 100)) return null
 return {treble:raw[0], bass:raw[1], volume:raw[2]}
}
export class KnobBleLink extends FirmwareGattLink<KnobValues> {
 constructor() {
  super({namePrefix:'BLEMIDI_2', serviceUuid:KNOB_SERVICE_UUID,
   characteristicUuid:KNOB_CHARACTERISTIC_UUID, parse:parseKnobPacket})
 }
}
