import type { ReactNode } from 'react'
import { useMixingHardware } from './useMixingHardware'
import { Context, type Session } from './useMixingSession'

const assets: Session['assets'] = {
 scratch:{url:encodeURI('/audio/Heewon Oh - Dj Turntable - Scratch Vinyl Back and Forth  (1).wav'),name:'Heewon Oh - Dj Turntable - Scratch Vinyl Back and Forth  (1).wav'},
}

export function MixingSession({children}: {children: ReactNode}) {
 const hardware = useMixingHardware()
 return <Context.Provider value={{hardware,assets}}>{children}</Context.Provider>
}
