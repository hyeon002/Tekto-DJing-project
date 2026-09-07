import { useEffect, useRef } from 'react'

type Props = { kind: 'eq' | 'tempo' | 'jog'; playing: boolean }
// Procedural dot fields reproduce the reference motion without stretching bitmap frames.
export default function MixingMotion({ kind, playing }: Props) {
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const phase = useRef(0)
 useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  let frame = 0
  let last = 0
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  function draw(now: number) {
   if (!canvas || !ctx) return
   if (last && playing && !reduced.matches) phase.current += Math.min((now-last)/1000, .05)
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
     strength=Math.exp(-((rx/85)**2+((ry-110)/spread)**2)/2)+Math.exp(-((rx/85)**2+((ry+110)/spread)**2)/2)
    } else if(kind==='tempo') {
     const center=250-165*Math.cos(t*.64)
     strength=Math.exp(-(((x-75)/24)**2+((y-center)/58)**2)/2)
    } else {
     for(let i=0;i<3;i++) {
      const dx=x-75,dy=y-(95+i*155)
      const distance=Math.hypot(dx,dy)
      const pulse=(Math.sin(t*1.3+i*2)+1)/2
      const ring=12+17*pulse
      strength=Math.max(strength,Math.exp(-(((distance-ring)/7)**2)/2)*pulse+Math.exp(-((distance/15)**2)/2)*(1-pulse))
     }
    }
    if(strength<.018) continue
    ctx.beginPath()
    ctx.arc(x,y,Math.min(3.1,.6+strength*2.5),0,Math.PI*2)
    ctx.fillStyle=`rgba(111,157,255,${Math.min(.78,strength*.7)})`
    ctx.fill()
   }
   if(playing && !reduced.matches) frame=requestAnimationFrame(draw)
  }
  frame=requestAnimationFrame(draw)
  return ()=>cancelAnimationFrame(frame)
 },[kind,playing])
 return <canvas ref={canvasRef} width={kind==='jog'?500:150} height={500} role="img" aria-label={`${kind} 도트 애니메이션`} style={{width:'100%',height:'100%',objectFit:'contain'}} />
}

