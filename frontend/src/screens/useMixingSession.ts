import { createContext, useContext } from 'react'
import type { useMixingHardware } from './useMixingHardware'
export type AudioKind = 'master' | 'bass' | 'scratch'
export type AudioAsset = { url: string; name: string }
export type Session = {
 hardware: ReturnType<typeof useMixingHardware>
 assets: Partial<Record<AudioKind, AudioAsset>>
 setAsset: (kind: AudioKind, asset: AudioAsset) => void
}
export const Context = createContext<Session | null>(null)

export function useMixingSession() {
 const session = useContext(Context)
 if(!session) throw new Error('MixingSession is required')
 return session
}
