import { useState } from 'react'
import './Home.css'

const asset = (name: string) => `/images/home/${name}`

// Supply the final video URL here via props when the video is ready.
export default function Home({ videoSrc }: { videoSrc?: string }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  return (
    <main className="home" aria-label="Tekto Home">
      <section className="home-dashboard">
        <header className="home-header">
          <img className="home-avatar" src={asset('profile.png')} alt="Martin 프로필" />
          <div className="home-profile"><p>Pioneer of the Waves ໒</p><h1>Martin</h1></div>
          <div className="home-notifications">
            <button className="home-notification-button" aria-label="알림" aria-expanded={notificationsOpen} aria-controls="home-notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <img src={asset('notification.svg')} alt="" />
            </button>
            {notificationsOpen && <div id="home-notifications" className="home-notification-popover" role="status">새로운 알림이 없어요.</div>}
          </div>
        </header>
        <div className="home-cards">
          <a className="home-card home-mixing" href="/music-select" aria-label="Let’s Start Mixing — 음악 선택">
            <img className="home-mixing-art" src={asset('mixing.svg')} alt="" />
            <span>Let’s Start<br />Mixing</span>
          </a>
          <button className="home-card home-setting" disabled title="Setting 화면 준비 중" aria-label="Setting — 화면 준비 중">
            <span className="home-card-heading"><img src={asset('setting.svg')} alt="" />Setting</span>
            <span className="home-device"><span>TB-01</span><span>Battery</span></span>
            <span className="home-battery" aria-label="배터리 미연결">--%</span>
          </button>
          <a className="home-card home-playlist" href="/music-search?from=playlist" aria-label="Playlist — 앨범 검색">
            <span className="home-card-heading"><img src={asset('headphones.svg')} alt="" />Playlist</span>
            <span className="home-albums" aria-hidden="true">
              {['left', 'left', 'center', 'right', 'right'].map((side, index) => <img key={index} className={`home-album home-album-${index}`} src={asset(`album-${side}.png`)} alt="" />)}
            </span>
            <span className="home-recent"><span>recent</span><span>drop dead - Olivia Rodrigo</span></span>
          </a>
        </div>
      </section>
      <section className="home-media" aria-label="Tekto 소개 영상">
        {videoSrc ? <video src={videoSrc} poster={asset('hero-overlay.png')} autoPlay muted loop playsInline controls /> : <img src={asset('hero-overlay.png')} alt="DJ 컨트롤러를 연주하는 모습" />}
      </section>
    </main>
  )
}
