import { useEffect, useRef, useState } from 'react'
import { JogBleLink } from '../core/ble/JogBleLink'
import { KnobBleLink } from '../core/ble/KnobBleLink'
import type { EqValues } from '../core/audio/MixingAudio'
import { JogSerialLink } from '../core/serial/JogSerialLink'

export function useMixingHardware() {
 const links = useRef({ jog: new JogBleLink(), knob: new KnobBleLink(), usb: new JogSerialLink() })
 const [states, setStates] = useState<Record<string,string>>({jog:'disconnected',knob:'disconnected',usb:'disconnected'})
 const [knobs, setKnobs] = useState<EqValues>({high:50,mid:50,low:50})
 const [touches, setTouches] = useState({jog:false,usb:false,screen:false})
 const [received, setReceived] = useState({jog:false,knob:false,usb:false})
 useEffect(() => {
  const current = links.current
  for (const key of ['jog','knob','usb'] as const) {
   const change = (state: string) => {
    setStates(old => ({...old,[key]:state}))
    if (!state.startsWith('connected')) {
     setReceived(old => ({...old,[key]:false}))
     if(key !== 'knob') setTouches(old => ({...old,[key]:false}))
    }
   }
   if(key === 'usb') current.usb.onStateChange = change
   else current[key].onConnectionStateChange = change
  }
  // Preserve existing wire fields; packet channels 1/2/3 now mean High/Mid/Low.
  current.knob.onValue = value => {setKnobs({high:value.treble,mid:value.bass,low:value.volume});setReceived(old=>({...old,knob:true}))}
  current.jog.onValue = value => {setTouches(old=>({...old,jog:value}));setReceived(old=>({...old,jog:true}))}
  current.usb.onTouchChange = value => {setTouches(old=>({...old,usb:value}));setReceived(old=>({...old,usb:true}))}
  return () => {
   current.jog.onValue = null; current.knob.onValue = null; current.usb.onTouchChange = null
   current.jog.onConnectionStateChange = null; current.knob.onConnectionStateChange = null; current.usb.onStateChange = null
   void current.jog.disconnect(); void current.knob.disconnect(); void current.usb.disconnect()
  }
 },[])
 return {links:links.current,states,received,knobs,setKnobs,touching:touches.jog||touches.usb||touches.screen,setScreenTouch:(screen:boolean)=>setTouches(old=>({...old,screen}))}
}
