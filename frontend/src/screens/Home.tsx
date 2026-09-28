import { useState } from 'react'
import HomeMixingCard from './HomeMixingCard'
import './Home.css'

const asset = (name: string) => `/images/home/${name}`

// Supply the final video URL here via props when the video is ready.
export default function Home({ videoSrc }: { videoSrc?: string }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <main className="home" aria-label="Tekto Home">
      <div className="home-media" aria-hidden="true">
        {videoSrc ? <video src={videoSrc} poster={asset('controller-background.png')} autoPlay muted loop playsInline /> : <img src={asset('controller-background.png')} alt="" />}
      </div>
      <section className="home-dashboard">
        <header className="home-header">
          <span className="home-avatar"><img className="home-avatar-base" src={asset('profile.png')} alt="" /><img className="home-avatar-portrait" src={asset('martin-profile.png')} alt="Martin 프로필" /></span>
          <div className="home-profile"><p>Pioneer of the Waves ໒</p><h1>Martin</h1></div>
          <div className="home-notifications">
            <button className="home-notification-button" aria-label="알림" aria-expanded={notificationsOpen} aria-controls="home-notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <img src={asset('notification.svg')} alt="" />
            </button>
            {notificationsOpen && <div id="home-notifications" className="home-notification-popover" role="status">새로운 알림이 없어요.</div>}
          </div>
        </header>
        <div className="home-cards">
          <HomeMixingCard />
          <a className="home-card home-setting" href="/settings" aria-label="Setting — 기기 연결 및 음원 설정">
            <span className="home-card-heading"><span className="home-setting-icon"><img src={asset('setting-icon.svg')} alt="" /></span>Setting</span>
            <span className="home-device"><span>TB-01</span><span>Battery</span></span>
            <span className="home-battery"><img src={asset('battery-92.png')} alt="배터리 92%" /></span>
          </a>
          <a className="home-card home-playlist" href="/playlist" aria-label="Playlist — 믹스셋 목록">
            <span className="home-card-heading"><img src={asset('headphones.svg')} alt="" />Playlist</span>
            <span className="home-albums" aria-hidden="true">
              {['left', 'left', 'center', 'right', 'right'].map((side, index) => <img key={index} className={`home-album home-album-${index}`} src={asset(`album-${side}.png`)} alt="" />)}
            </span>
            <span className="home-recent"><span>recent</span><span>drop dead - Olivia Rodrigo</span></span>
          </a>
          <a className="home-card home-top-ten" href="/music-search" aria-label="Today’s TOP 10 — 인기 음악 둘러보기">
            <span className="home-card-heading"><span className="home-note-icon"><img src={asset('top-ten-note.svg')} alt="" /></span><span>Today’s<br />TOP 10</span></span>
            <img className="home-top-ten-disc" src={asset('top-ten-disc.svg')} alt="" />
          </a>
        </div>
      </section>
    </main>
  )
}
