import AlbumCover from '../components/AlbumCover'
import { useEffect, useRef, useState } from 'react'
import { formatTime, selectionUrl, type Deck, type Track } from './musicSelection'
import './TrackPreview.css'
export default function TrackPreview({track,deck}:{track:Track;deck:Deck}) {
 const audio = useRef<HTMLAudioElement>(null)
 const [playing,setPlaying] = useState(false)
 const [position,setPosition] = useState(0)
 const [duration,setDuration] = useState(0)
 const [error,setError] = useState('')
 useEffect(() => {
  const element = audio.current
  let active = true
  if(element && track.audioSrc) void element.play().catch(() => {if(active) setError('재생 버튼을 눌러주세요.')})
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
   <AlbumCover className={`track-preview-cover${track.id === 5 ? ' album-cover-trim' : ''}`} src={track.cover} alt="" />
   <div className="track-preview-title"><strong>{track.title}</strong><span>{track.artist}</span></div>
   <button className="track-preview-toggle" disabled={!track.audioSrc} onClick={toggle} aria-label={playing?'일시정지':'재생'}>{playing?<img src="/images/player/pause.svg" alt="" />:<span aria-hidden="true">▶</span>}</button>
   <div className="track-preview-wave"><img src="/images/player/wave.svg" alt="" /><input type="range" aria-label="재생 위치" min="0" max={duration||1} step="0.1" value={position} disabled={!duration||!track.audioSrc} onChange={event=>{if(audio.current){audio.current.currentTime=Number(event.target.value);setPosition(Number(event.target.value))}}} /></div>
   <time>{formatTime(duration||track.duration)}</time>
  </div><a className="track-preview-add" href={selectionUrl('/music-select',deck,track.id)} aria-label={`${track.title} ${deck==='left'?'왼쪽':'오른쪽'} 덱에 추가`}><img src="/images/player/plus.svg" alt="" /></a></div>
  {(!track.audioSrc||error)&&<p className="track-preview-status" role="status">{!track.audioSrc?'음원 연결 대기 중':error}</p>}
  <audio ref={audio} src={track.audioSrc} preload="metadata" onPlay={()=>{setPlaying(true);setError('')}} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onTimeUpdate={event=>setPosition(event.currentTarget.currentTime)} onLoadedMetadata={event=>setDuration(Number.isFinite(event.currentTarget.duration)?event.currentTarget.duration:0)} onError={()=>{setPlaying(false);setError('음원을 불러올 수 없어요.')}} />
 </aside>
}
