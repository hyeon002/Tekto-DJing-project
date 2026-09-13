import { useState } from 'react'
import { useMixingSession, type AudioKind } from './useMixingSession'
import './Settings.css'

export default function Settings() {
 const {hardware,assets,setAsset} = useMixingSession()
 const [loading,setLoading] = useState(false)
 const [error,setError] = useState('')
 async function upload(kind:AudioKind,file?:File) {
  if(!file)return
  setLoading(true);setError('')
  const context = new AudioContext()
  try {
   await context.decodeAudioData(await file.arrayBuffer())
   setAsset(kind,{url:URL.createObjectURL(file),name:file.name})
  } catch {setError('지원되는 오디오 파일을 선택해주세요. 기존 음원은 유지됩니다.')}
  finally {void context.close();setLoading(false)}
 }
 return <main className="settings" aria-label="Setting">
  <header className="settings-header"><a href="/" aria-label="홈으로 돌아가기">← Home</a><h1>Setting</h1></header>
  <div className="settings-grid">
   <section><p className="settings-eyebrow">DEVICES</p><h2>기기 연결</h2>
    {(['jog','knob'] as const).map(key=>{
     const state=hardware.states[key], connected=state.startsWith('connected')
     const supported='bluetooth' in navigator
     return <div className="settings-row" key={key}><div><h3>{key==='jog'?'조그휠':'노브'}</h3><span role="status">{!supported?'이 브라우저에서 지원하지 않음':state==='error'?'연결 실패 · 다시 시도해주세요':state==='connecting'?'연결 중…':connected?(hardware.received[key]?'입력 수신됨':'연결됨 · 입력 대기'):'미연결'}</span></div><button disabled={!supported||state==='connecting'} onClick={()=>{void (connected?hardware.links[key].disconnect():hardware.links[key].connect())}}>{connected?'연결 해제':'연결'}</button></div>
    })}
    <p className="settings-note">슬라이더는 믹싱 화면에서 조작할 수 있어요.</p>
   </section>
   <section><p className="settings-eyebrow">AUDIO</p><h2>음원 설정</h2>
    {(['master','scratch'] as const).map(kind=><div className="settings-row" key={kind}><div><h3>{kind==='master'?'기본 음원':'스크래치 음원'}</h3><span>{assets[kind]?.name||'미등록'}</span></div><label className="settings-file">{assets[kind]?'변경':'파일 선택'}<input aria-label={kind==='master'?'기본 음원 변경':'스크래치 음원 선택'} type="file" accept="audio/*" disabled={loading} onChange={event=>{void upload(kind,event.target.files?.[0]);event.target.value=''}}/></label></div>)}
    <p className="settings-note">스크래치 음원은 조그휠을 누르는 동안 재생됩니다.</p>
    <p role="status">{loading?'음원 확인 중…':error}</p>
   </section>
  </div>
 </main>
}
