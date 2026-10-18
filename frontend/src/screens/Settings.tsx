import { useMixingSession } from './useMixingSession'
import './Settings.css'

export default function Settings() {
 const {hardware} = useMixingSession()
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
  </div>
 </main>
}
