import { useRef, useState, type CSSProperties } from 'react'
import AlbumCover from '../components/AlbumCover'
import TrackPreview from './TrackPreview'
import { recommendationTracks, type RecommendationTrack } from './recommendationTracks'
import './Recommendations.css'

const covers = recommendationTracks.map(track => ({ cover: track.cover, track }))
const positions = [0, 261.5, 482, 666.5, 829.5]
const sizes = [273, 218, 191, 147, 147]
const cardOffset = (index: number, center: number) => {
  const half = Math.floor(covers.length / 2)
  const normalized = ((center % covers.length) + covers.length) % covers.length
  return ((index - normalized + covers.length + half) % covers.length) - half
}

export default function Recommendations() {
  const [center, setCenter] = useState(4)
  const [selected, setSelected] = useState<RecommendationTrack>()
  const [dragging, setDragging] = useState(false)
  const touchStart = useRef<number | null>(null)
  const mouseTravel = useRef({ x: 0, distance: 0, lastStep: 0, dragged: false })
  const mousePointer = useRef<number | null>(null)

  // Keep a continuous position so crossing the last/first card also animates.
  const move = (step: number) => setCenter(current => current + step)
  // Clicks use the visible copy of a card, preserving its position across the seam.
  const centerCard = (index: number) => setCenter(current => current + cardOffset(index, current))
  return <main className="recommendations" aria-labelledby="recommendations-title">
    <div className="recommendations-canvas">
      <a className="recommendations-back" href="/" aria-label="Home으로 돌아가기"><img src="/images/recommendations/back.svg" alt="" /></a>
      <header className="recommendations-intro">
        <p>Hey, choose your music to mix</p>
        <h1 id="recommendations-title">Today’s <strong>recommendation</strong></h1>
        <a className="recommendations-search" href={selected ? `/music-search?left=${selected.id}&deck=right` : '/music-search?deck=left'} aria-label="음악 검색"><img src="/images/recommendations/search.svg" alt="" />Search Anything</a>
      </header>
      <section className={`recommendations-carousel${dragging ? ' is-dragging' : ''}`} aria-label="추천 앨범 — 클릭한 채 좌우로 드래그하거나 방향키로 이동" aria-roledescription="carousel" tabIndex={0}
        onPointerDown={event => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return
          mousePointer.current = event.pointerId
          mouseTravel.current = { x: event.clientX, distance: 0, lastStep: 0, dragged: false }
          setDragging(true)
        }}
        onPointerMove={event => {
          if (event.pointerId !== mousePointer.current || !(event.buttons & 1)) return
          const travel = mouseTravel.current
          const delta = event.clientX - travel.x
          travel.x = event.clientX
          if (Math.sign(delta) !== Math.sign(travel.distance) && Math.abs(delta) > 1) travel.distance = 0
          travel.distance += delta
          if (Math.abs(travel.distance) > 6 && !travel.dragged) {
            travel.dragged = true
            event.currentTarget.setPointerCapture(event.pointerId)
          }
          const threshold = Math.max(36, event.currentTarget.getBoundingClientRect().width * .06)
          if (Math.abs(travel.distance) < threshold || event.timeStamp - travel.lastStep < 400) return
          move(travel.distance < 0 ? 1 : -1)
          travel.distance = 0
          travel.lastStep = event.timeStamp
        }}
        onPointerUp={() => { mousePointer.current = null; setDragging(false) }}
        onPointerCancel={() => { mousePointer.current = null; setDragging(false) }}
        onLostPointerCapture={() => { mousePointer.current = null; setDragging(false) }}
        onPointerLeave={() => { mouseTravel.current.distance = 0 }}
        onTouchStart={event => { touchStart.current = event.touches[0].clientX }}
        onTouchEnd={event => { const delta = event.changedTouches[0].clientX - (touchStart.current ?? event.changedTouches[0].clientX); if (Math.abs(delta) > 35) { event.preventDefault(); move(delta < 0 ? 1 : -1) } touchStart.current = null }}
        onTouchCancel={() => { touchStart.current = null }}
        onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) } }}>
        {covers.map((item, index) => {
          const offset = cardOffset(index, center)
          const distance = Math.abs(offset)
          // A wrapped edge card re-enters offscreen instead of flying across the row.
          const key = `${item.cover}:${Math.floor((center + offset) / covers.length)}`
          const style = { '--card-size': `${sizes[distance]}px`, '--card-offset': `${Math.sign(offset) * positions[distance]}px`, '--card-opacity': [1, .85, .7, .5, .5][distance] } as CSSProperties
          return <button type="button" key={key} style={style}
            className={`recommendation-card${offset === 0 ? ' is-center' : ''}${selected?.id === item.track.id ? ' is-selected' : ''}`}
            aria-label={`${item.track.title} — ${item.track.artist}`} aria-pressed={selected?.id === item.track.id}
            onFocus={event => { if (event.currentTarget.matches(':focus-visible')) centerCard(index) }}
            onClick={event => {
              if (event.detail > 0 && mouseTravel.current.dragged) { mouseTravel.current.dragged = false; return }
              centerCard(index); setSelected(item.track)
            }}>
            <AlbumCover className="recommendation-cover" src={item.cover} alt="" draggable={false} />
            <span className="recommendation-info"><strong>{item.track.title}</strong><span>{item.track.artist} | {item.track.album}</span></span>
          </button>
        })}
      </section>
    </div>
    {selected && <TrackPreview key={selected.id} track={selected} deck="left" previewCover={selected.previewCover} waveSrc="/images/recommendations/wave.svg"
      addHref={`/music-select?left=${selected.id}`} addLabel={`${selected.title} 선택 후 Select Music으로 이동`} />}
  </main>
}
