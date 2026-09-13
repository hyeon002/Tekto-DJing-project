import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useMixingHardware } from './useMixingHardware'

import { Context, type AudioKind, type AudioAsset, type Session } from './useMixingSession'

export function MixingSession({children}: {children: ReactNode}) {
 const hardware = useMixingHardware()
 const [assets, setAssets] = useState<Session['assets']>({master:{url:'/audio/videoplayback.mp3',name:'videoplayback.mp3'}})
 const urls = useRef(new Map<AudioKind,string>())
 useEffect(()=>{
  const current = urls.current
  return ()=>{for(const url of current.values()) URL.revokeObjectURL(url);current.clear()}
 },[])
 function setAsset(kind: AudioKind, asset: AudioAsset) {
  const previous = urls.current.get(kind)
  if(previous) URL.revokeObjectURL(previous)
  urls.current.set(kind,asset.url)
  setAssets(old=>({...old,[kind]:asset}))
 }
 return <Context.Provider value={{hardware,assets,setAsset}}>{children}</Context.Provider>
}
