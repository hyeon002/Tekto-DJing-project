import AlbumCover from '../components/AlbumCover'
import { useEffect, useRef, useState } from 'react'
import { selectedTrack, selectionUrl, formatTime, type Track } from './musicSelection'
import './Mixing.css'
import MixingMotion from './MixingMotion'
import { MixingAudio } from '../core/audio/MixingAudio'
import { useMixingSession, type AudioKind } from './useMixingSession'
import timelineBackground from '../assets/mixing-timeline.svg'

const asset = (name: string) => `/images/mixing/${name}`
export default function Mixing() {
 const {hardware} = useMixingSession()
 const queue = [selectedTrack('left'), selectedTrack('right')].filter((track): track is Track => Boolean(track))
 const [index, setIndex] = useState(0)
 const track = queue[index]
 if (!track) return <main className="mixing-empty"><h1>음악을 먼저 선택해주세요.</h1><a href="/music-select">음악 선택으로 이동</a></main>
 return <MixingPlayer hardware={hardware} key={`${index}-${track.id}`} track={track} count={queue.length} onChange={step => setIndex(current => (current + step + queue.length) % queue.length)} />
}
function MixingPlayer({track,count,onChange,hardware}:{track:Track;count:number;onChange:(step:number)=>void;hardware:ReturnType<typeof useMixingSession>['hardware']}) {
 const {assets} = useMixingSession()
 const engine = useRef<MixingAudio | null>(null)
 const [playing,setPlaying] = useState(false)
 const [position,setPosition] = useState(0)
 const [duration,setDuration] = useState(0)
 const [repeat,setRepeat] = useState(false)
 const [error,setError] = useState('')
 const [tempo,setTempo] = useState(.5)
 const files = assets
 const [loading,setLoading] = useState(false)
 const totalDuration = duration || track.duration || 188
 useEffect(() => {
  const player = new MixingAudio()
  engine.current = player
  let active = true
  setLoading(true)
  const entries = Object.entries(assets) as [AudioKind, {url:string;name:string}][]
  void Promise.all(entries.map(([kind,asset])=>player.load(kind,asset.url))).then(()=>{if(active)setDuration(player.duration)}).catch(()=>{if(active)setError('음원을 불러올 수 없어요. Setting에서 파일을 확인해주세요.')}).finally(()=>{if(active)setLoading(false)})
  return () => {active=false;player.dispose();engine.current=null}
 },[assets])
 useEffect(()=>{engine.current?.setKnobs(hardware.knobs)},[hardware.knobs])
 useEffect(()=>{engine.current?.setTouch(hardware.touching)},[hardware.touching,files.scratch,loading])
 useEffect(()=>{engine.current?.setRate(tempo)},[tempo])
 useEffect(()=>{
  const timer=window.setInterval(()=>{
   const player=engine.current
   if(!player) return
   setPosition(player.position)
   if(player.playing && player.position>=player.duration){
    if(repeat) player.seek(0)
    else {player.pause();setPlaying(false);if(count>1)onChange(1)}
   }
  },100)
  return ()=>window.clearInterval(timer)
 },[repeat,count,onChange])
 async function toggle() {
  const player=engine.current
  if(!player)return
  if(player.playing){player.pause();setPlaying(false)}
  else {try{await player.play();setPlaying(player.playing);setError('')}catch(err){setError(err instanceof Error?err.message:'재생에 실패했어요.')}}
 }
 return <main className="mixing" aria-label="Mixing">
  <header className="mixing-header">
   <a className="mixing-back" href={selectionUrl('/music-select')} aria-label="음악 선택으로 돌아가기"><img src="/images/music-select/back.svg" alt="" /></a>
   <div className="mixing-track"><AlbumCover className={track.id === 5 ? 'album-cover-trim' : undefined} src={track.cover} alt="" /><div><strong>{track.title}</strong><span>{track.artist}</span></div><time>{formatTime(duration || track.duration)}</time></div>
   <a className="mixing-finish" href="/" onClick={()=>engine.current?.pause()}>Finish</a>
  </header>
  <div className="mixing-visual-area">
  <section className="mixing-panels" aria-label="EQ, 템포, 조그 시각화">
   <div className="mixing-panel mixing-eq"><MixingMotion kind="eq" playing={playing} knobs={hardware.knobs} />
    <div className="mixing-knob-inputs">{(['treble','bass','volume'] as const).map(key=><input key={key} type="range" aria-label={key} title={`${key}: ${hardware.knobs[key]}%`} min="0" max="100" value={hardware.knobs[key]} onChange={event=>hardware.setKnobs(old=>({...old,[key]:Number(event.target.value)}))}/>)}</div></div>
   <div className="mixing-panel mixing-tempo"><MixingMotion kind="tempo" playing={playing} tempo={tempo} /><input className="mixing-tempo-input" type="range" aria-label="재생 속도" aria-valuetext={`${(.9+tempo*.2).toFixed(2)}배`} min="0" max="1" step=".01" value={tempo} onChange={event=>setTempo(Number(event.target.value))}/></div>
   <div className="mixing-panel mixing-jog"><MixingMotion kind="jog" playing={playing} /><button className="mixing-jog-touch" aria-label="조그휠 터치 · 누르는 동안 샘플 재생" aria-pressed={hardware.touching} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);hardware.setScreenTouch(true)}} onPointerUp={()=>hardware.setScreenTouch(false)} onPointerCancel={()=>hardware.setScreenTouch(false)} onLostPointerCapture={()=>hardware.setScreenTouch(false)} onKeyDown={event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();hardware.setScreenTouch(true)}}} onKeyUp={()=>hardware.setScreenTouch(false)} onBlur={()=>hardware.setScreenTouch(false)}/></div>
  </section>
  </div>
  <div className="mixing-timeline">
   <img src={timelineBackground} alt="" />
   <span className="mixing-playhead" aria-hidden="true" style={{left: `clamp(3px, ${Math.min(100, Math.max(0, position / totalDuration * 100))}%, calc(100% - 3px))`}} />
   <input type="range" aria-label={'재생 위치'} aria-valuetext={`${formatTime(position)} / ${formatTime(totalDuration)}`} min="0" max={totalDuration} step="0.1" value={position} onChange={event=>{engine.current?.seek(Number(event.target.value));setPosition(Number(event.target.value))}} />
  </div>
  <nav className="mixing-transport" aria-label="재생 컨트롤">
   <button aria-label="반복 재생" aria-pressed={repeat} onClick={()=>setRepeat(!repeat)}><img src={asset('repeat.svg')} alt="" /></button>
   <button aria-label="이전 곡" disabled={count<2} onClick={()=>onChange(-1)}><span className="mixing-skip"><img className="mixing-skip-bar" src={asset('bar.svg')} alt="" /><img src={asset('previous.svg')} alt="" /></span></button>
   <button className="mixing-play" disabled={loading} aria-label={playing?'일시정지':'재생'} onClick={toggle}>{playing?<img src={asset('pause.svg')} alt="" />:<span aria-hidden="true">▶</span>}</button>
   <button aria-label="다음 곡" disabled={count<2} onClick={()=>onChange(1)}><span className="mixing-skip mixing-skip-next"><img className="mixing-skip-bar" src={asset('bar.svg')} alt="" /><img src={asset('next.svg')} alt="" /></span></button>
   <button aria-label="다른 선택 곡으로 전환" disabled={count<2} onClick={()=>onChange(1)}><img src={asset('shuffle.svg')} alt="" /></button>
  </nav>
  {error&&<p className="mixing-status" role="status">{error}</p>}
  {(loading || !files.master || (hardware.touching && !files.scratch)) && <p className="mixing-status" role="status">{loading?'음원 준비 중…':!files.master?'Setting에서 기본 음원을 등록해주세요.':'스크래치 음원을 등록하면 터치로 음원을 전환할 수 있어요.'}</p>}
 </main>
}
