import AlbumCover from '../components/AlbumCover'
import { prepareAudio } from '../core/audio/MixingAudio'
import { useEffect, useRef, useState } from 'react'
import { formatTime, selectionUrl, type Deck, type Track } from './musicSelection'
import './TrackPreview.css'
export default function TrackPreview({track,deck,addHref,addLabel,previewCover,waveSrc='/images/player/wave.svg'}:{track:Track;deck:Deck;addHref?:string;addLabel?:string;previewCover?:string;waveSrc?:string}) {
 const audio = useRef<HTMLAudioElement>(null)
 const [playing,setPlaying] = useState(false)
 const [position,setPosition] = useState(0)
 const [duration,setDuration] = useState(0)
 const [error,setError] = useState('')
 const progress = duration > 0 ? Math.min(100, Math.max(0, position / duration * 100)) : 0
 useEffect(() => {
  if(!playing) return
  let frame = 0
  const update = () => {
   if(audio.current) setPosition(audio.current.currentTime)
   frame = requestAnimationFrame(update)
  }
  frame = requestAnimationFrame(update)
  return () => cancelAnimationFrame(frame)
 },[playing])
 useEffect(() => {
  const element = audio.current
  let active = true
  element?.pause()
  if(element) element.currentTime = 0
  setPlaying(false)
  setPosition(0)
  setDuration(0)
  setError('')
  if(element && track.audioSrc) {
   // Prepare the EQ player's decoded audio while the selected preview plays.
   void prepareAudio(track.audioSrc).catch(() => {})
   void element.play().catch(() => {
    if(active) setError('재생 버튼을 눌러주세요.')
   })
  }
  return () => {active=false; element?.pause()}
 },[track.audioSrc])
 async function toggle() {
  const element=audio.current
  if(!element || !track.audioSrc) return
  if(!element.paused) element.pause()
  else {try {await element.play();setError('')} catch {setError('음원을 재생할 수 없어요.')}}
 }
 return <aside className="track-preview" aria-label={`${track.title} 미리듣기`}>
  <div className="track-preview-row"><div className="track-preview-pill">
   <AlbumCover className={`track-preview-cover${track.id === 5 ? ' album-cover-trim' : ''}`} src={previewCover || track.cover} alt="" />
   <div className="track-preview-title"><strong>{track.title}</strong><span>{track.artist}</span></div>
   <button type="button" className="track-preview-toggle" disabled={!track.audioSrc} onClick={toggle} aria-label={playing?'일시정지':'재생'}><img className={playing ? 'track-preview-pause-icon' : 'track-preview-play-icon'} src={playing ? '/images/player/pause.svg' : '/images/player/play.svg'} alt="" /></button>
   <div className="track-preview-wave">
    <span className="track-preview-wave-shape" aria-hidden="true" style={{maskImage:`url("${waveSrc}")`,WebkitMaskImage:`url("${waveSrc}")`}}>
     <span className="track-preview-wave-progress" style={{clipPath:`inset(0 ${100-progress}% 0 0)`}} />
    </span>
    {track.audioSrc && <input type="range" aria-label="재생 위치" aria-valuetext={`${formatTime(position)} / ${formatTime(duration)}`} min="0" max={duration||1} step="0.1" value={position} disabled={!duration} onChange={event=>{if(audio.current){audio.current.currentTime=Number(event.target.value);setPosition(Number(event.target.value))}}} />}
   </div>
   <time title="현재 재생 시간">{formatTime(position).padStart(5, '0')}</time>
  </div><a className="track-preview-add" href={addHref || selectionUrl('/music-select',deck,track.id)} aria-label={addLabel || `${track.title} ${deck==='left'?'왼쪽':'오른쪽'} 덱에 추가`}><img src="/images/player/plus.svg" alt="" /></a></div>
  {track.audioSrc && error && <p className="track-preview-status" role="status">{error}</p>}
  <audio ref={audio} src={track.audioSrc} preload="metadata" onPlay={()=>{setPlaying(true);setError('')}} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onTimeUpdate={event=>setPosition(event.currentTarget.currentTime)} onLoadedMetadata={event=>setDuration(Number.isFinite(event.currentTarget.duration)?event.currentTarget.duration:0)} onError={()=>{setPlaying(false);setError('음원을 불러올 수 없어요.')}} />
 </aside>
}
