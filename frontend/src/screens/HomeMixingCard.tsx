import { useEffect, useRef, useState } from 'react'

const waveformPoster = '/images/home/mixing-eq-clean.png'

export default function HomeMixingCard() {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const active = hovered || focused

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 0.75
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePlayback = () => {
      if (active && !reducedMotion.matches) {
        // A blocked play request leaves the Figma poster visible.
        void video.play().catch(() => {})
      } else {
        video.pause()
        video.currentTime = 0
      }
    }
    updatePlayback()
    reducedMotion.addEventListener('change', updatePlayback)
    return () => {
      reducedMotion.removeEventListener('change', updatePlayback)
      video.pause()
    }
  }, [active])

  return (
    <a
      className="home-card home-mixing"
      href="/music-select"
      aria-label="Let’s Start Mixing — 음악 선택"
      data-active={active}
      onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true) }}
      onPointerLeave={() => setHovered(false)}
      onPointerCancel={() => setHovered(false)}
      onFocus={event => setFocused(event.currentTarget.matches(':focus-visible'))}
      onBlur={() => setFocused(false)}
    >
      <span className="home-mixing-title">Let’s Start<br />Mixing</span>
      <span className="home-mixing-eq" aria-hidden="true">
        <img src={waveformPoster} alt="" />
        <video ref={videoRef} src="/images/home/mixing-eq-clean.mp4" poster={waveformPoster} muted loop playsInline preload="none" />
      </span>
    </a>
  )
}
