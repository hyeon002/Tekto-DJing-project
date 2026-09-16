import { useEffect, useRef } from 'react'
import type { AudioMotion } from '../core/audio/MixingAudio'

type Props = { kind: 'eq' | 'tempo' | 'jog'; playing: boolean; knobs?: {high:number;mid:number;low:number}; tempo?:number; readMotion?: () => AudioMotion | undefined }
// Procedural dot fields reproduce the reference motion without stretching bitmap frames.
export default function MixingMotion({ kind, playing, knobs, tempo = .5, readMotion }: Props) {
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const phase = useRef(0)
 const response = useRef({level:0,bass:0,mid:0,high:0})
 useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  let frame = 0
  let last = 0
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  // Keep every band visible even when a stale or incomplete value reaches the view.
  const pulses = [knobs?.high, knobs?.mid, knobs?.low].map(value =>
   typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) / 100 : .5)
  function draw(now: number) {
   if (!canvas || !ctx) return
   const dt = last ? Math.min((now-last)/1000, .05) : 1/60
   const reactive = kind === 'jog' && Boolean(readMotion) && !reduced.matches
   const signal = reactive && playing ? readMotion?.() : undefined
   const levels = response.current
   if (reactive) {
    for (const key of ['level','bass','mid','high'] as const) {
     const target = signal?.[key] ?? 0
     const smoothing = 1-Math.exp(-dt/(target > levels[key] ? .055 : .24))
     levels[key] += (target-levels[key])*smoothing
    }
   }
   // Exaggerate the visual speed range so slider changes are easy to see;
   // audio playback retains its existing 0.9–1.1x range.
   const visualRate = .4+Math.max(0,Math.min(1,tempo))*1.2
   if ((last || reactive) && playing && !reduced.matches) phase.current += dt * (reactive ? visualRate*(.8+levels.level*.6) : 1)
   last = now
   const t = phase.current
   const w = kind === 'jog' ? 500 : 150
   const h = 500
   ctx.clearRect(0,0,w,h)
   const angle = t * .72
   for(let y=7;y<h;y+=9) for(let x=7;x<w;x+=9) {
    let strength=0
    if(kind==='jog') {
     const dx=x-250, dy=y-250
     const rx=dx*Math.cos(angle)-dy*Math.sin(angle)
     const ry=dx*Math.sin(angle)+dy*Math.cos(angle)
     const spread=42+8*Math.sin(t*1.7)
     if (reactive) {
      const radius = Math.hypot(dx,dy)
      const bassPulse = levels.bass**3
      const lobeDistance = 72+pulses[2]*48+bassPulse*42
      const width = 48+pulses[1]*60+levels.mid*22
      const breathing = 26+pulses[2]*24+bassPulse*42
      const waveAmount = 5+pulses[0]*24+levels.high*30
      const ripple = Math.sin(radius*.042-t*4)*waveAmount
      const lobes = Math.exp(-((rx/width)**2+((ry-lobeDistance-ripple)/breathing)**2)/2)+Math.exp(-((rx/width)**2+((ry+lobeDistance+ripple)/breathing)**2)/2)
      const ring = Math.exp(-(((radius-(120+pulses[2]*30+bassPulse*34))/12)**2)/2)*(pulses[0]*.25+levels.high*.5)
      strength = lobes*(.4+levels.level*1.15)+ring
     } else {
      strength=Math.exp(-((rx/85)**2+((ry-110)/spread)**2)/2)+Math.exp(-((rx/85)**2+((ry+110)/spread)**2)/2)
     }
    } else if(kind==='tempo') {
     const center=415-330*tempo
     strength=Math.exp(-(((x-75)/24)**2+((y-center)/58)**2)/2)
    } else {
     for(let i=0;i<3;i++) {
      const dx=x-75,dy=y-(95+i*155)
      const distance=Math.hypot(dx,dy)
      const pulse=pulses[i]
      const ring=12+17*pulse
      strength=Math.max(strength,Math.exp(-(((distance-ring)/7)**2)/2)*pulse+Math.exp(-((distance/15)**2)/2)*(1-pulse))
     }
    }
    if(strength<.018) continue
    ctx.beginPath()
    ctx.arc(x,y,Math.min(reactive ? 3.8 : 3.1,.6+strength*(reactive ? 3 : 2.5)),0,Math.PI*2)
    ctx.fillStyle=reactive ? `rgba(91,137,250,${Math.min(.95,strength*.9)})` : `rgba(111,157,255,${Math.min(.78,strength*.7)})`
    ctx.fill()
   }
   if(!reduced.matches && (playing || (reactive && Object.values(levels).some(value => value > .001)))) frame=requestAnimationFrame(draw)
  }
  // Draw before scheduling so rapid input updates cannot cancel the initial paint.
  draw(performance.now())
  return ()=>cancelAnimationFrame(frame)
 },[kind,playing,knobs,tempo,readMotion])
 return <canvas ref={canvasRef} width={kind==='jog'?500:150} height={500} role="img" aria-label={`${kind} 도트 애니메이션`} style={{width:'100%',height:'100%',objectFit:'contain'}} />
}

