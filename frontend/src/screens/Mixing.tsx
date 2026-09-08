import AlbumCover from '../components/AlbumCover'
import { useEffect, useRef, useState } from 'react'
import { selectedTrack, selectionUrl, formatTime, type Track } from './musicSelection'
import './Mixing.css'
import MixingMotion from './MixingMotion'
import timelineBackground from '../assets/mixing-timeline.svg'

const asset = (name: string) => `/images/mixing/${name}`
export default function Mixing() {
 const queue = [selectedTrack('left'), selectedTrack('right')].filter((track): track is Track => Boolean(track))
 const [index, setIndex] = useState(0)
 const track = queue[index]
 if (!track) return <main className="mixing-empty"><h1>음악을 먼저 선택해주세요.</h1><a href="/music-select">음악 선택으로 이동</a></main>
 return <MixingPlayer key={`${index}-${track.id}`} track={track} count={queue.length} onChange={step => setIndex(current => (current + step + queue.length) % queue.length)} />
}
function MixingPlayer({track,count,onChange}:{track:Track;count:number;onChange:(step:number)=>void}) {
 const audio = useRef<HTMLAudioElement>(null)
 const [playing,setPlaying] = useState(!track.audioSrc)
 const [position,setPosition] = useState(0)
 const [duration,setDuration] = useState(0)
 const [repeat,setRepeat] = useState(false)
 const [error,setError] = useState('')
 const totalDuration = duration || track.duration || 188
 useEffect(() => {
  if(track.audioSrc || !playing) return
  const timer = window.setInterval(() => setPosition(current => {
   if(current >= totalDuration) { if(repeat) return 0; return totalDuration }
   return Math.min(totalDuration,current+.1)
  }),100)
  return () => window.clearInterval(timer)
 },[track.audioSrc,playing,totalDuration,repeat])
 useEffect(() => { if(!track.audioSrc && position >= totalDuration && !repeat) setPlaying(false) },[position,totalDuration,track.audioSrc,repeat])
 useEffect(() => {
  const element = audio.current
  let active = true
  if(track.audioSrc && element) void element.play().catch(() => {if(active) setError('재생 버튼을 눌러주세요.')})
  return () => {active=false;element?.pause()}
 },[track.audioSrc])
 async function toggle() {
  const element = audio.current
  if(!track.audioSrc) { if(position >= totalDuration) setPosition(0); setPlaying(!playing); return }
  if(!element) return
  if(!element.paused) element.pause()
  else {try {await element.play();setError('')} catch {setError('음원을 재생할 수 없어요.')}}
 }
 return <main className="mixing" aria-label="Mixing">
  <header className="mixing-header">
   <a className="mixing-back" href={selectionUrl('/music-select')} aria-label="음악 선택으로 돌아가기"><img src="/images/music-select/back.svg" alt="" /></a>
   <div className="mixing-track"><AlbumCover className={track.id === 5 ? 'album-cover-trim' : undefined} src={track.cover} alt="" /><div><strong>{track.title}</strong><span>{track.artist}</span></div><time>{formatTime(duration || track.duration)}</time></div>
   <a className="mixing-finish" href="/" onClick={()=>audio.current?.pause()}>Finish</a>
  </header>
  <section className="mixing-panels" aria-label="EQ, 템포, 조그 시각화">
   <div className="mixing-panel mixing-eq"><MixingMotion kind="eq" playing={playing} /></div>
   <div className="mixing-panel mixing-tempo"><MixingMotion kind="tempo" playing={playing} /></div>
   <div className="mixing-panel mixing-jog"><MixingMotion kind="jog" playing={playing} /></div>
  </section>
  <div className="mixing-timeline">
   <img src={timelineBackground} alt="" />
   <span className="mixing-playhead" aria-hidden="true" style={{left: `clamp(3px, ${Math.min(100, Math.max(0, position / totalDuration * 100))}%, calc(100% - 3px))`}} />
   <input type="range" aria-label={track.audioSrc ? '재생 위치' : '모션 미리보기 위치'} aria-valuetext={`${formatTime(position)} / ${formatTime(totalDuration)}`} min="0" max={totalDuration} step="0.1" value={position} onChange={event=>{if(audio.current && track.audioSrc && duration) audio.current.currentTime=Number(event.target.value);setPosition(Number(event.target.value))}} />
  </div>
  <nav className="mixing-transport" aria-label="재생 컨트롤">
   <button aria-label="반복 재생" aria-pressed={repeat} onClick={()=>setRepeat(!repeat)}><img src={asset('repeat.svg')} alt="" /></button>
   <button aria-label="이전 곡" disabled={count<2} onClick={()=>onChange(-1)}><span className="mixing-skip"><img className="mixing-skip-bar" src={asset('bar.svg')} alt="" /><img src={asset('previous.svg')} alt="" /></span></button>
   <button className="mixing-play" aria-label={playing?'일시정지':'재생'} onClick={toggle}>{playing?<img src={asset('pause.svg')} alt="" />:<span aria-hidden="true">▶</span>}</button>
   <button aria-label="다음 곡" disabled={count<2} onClick={()=>onChange(1)}><span className="mixing-skip mixing-skip-next"><img className="mixing-skip-bar" src={asset('bar.svg')} alt="" /><img src={asset('next.svg')} alt="" /></span></button>
   <button aria-label="다른 선택 곡으로 전환" disabled={count<2} onClick={()=>onChange(1)}><img src={asset('shuffle.svg')} alt="" /></button>
  </nav>
  {error&&<p className="mixing-status" role="status">{error}</p>}
  <audio ref={audio} src={track.audioSrc} loop={repeat} preload="metadata" onPlay={()=>{setPlaying(true);setError('')}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);if(count>1)onChange(1)}} onTimeUpdate={event=>setPosition(event.currentTarget.currentTime)} onLoadedMetadata={event=>setDuration(Number.isFinite(event.currentTarget.duration)?event.currentTarget.duration:0)} onError={()=>{setPlaying(false);setError('음원을 불러올 수 없어요.')}} />
 </main>
}
