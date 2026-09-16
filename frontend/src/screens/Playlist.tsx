import { useState } from 'react'
import AlbumCover from '../components/AlbumCover'
import './Playlist.css'

const asset = (name: string) => `/images/playlist/${name}`
// Design sample mixsets; recorded mixes and audio files are not connected yet.
const sampleDates = ['2026-07-25', '2026-07-27', '2026-07-28', '2026-07-30', '2026-07-31', '2026-08-04', '2026-08-09', '2026-08-15', '2026-08-20', '2026-08-26', '2026-08-31']
const samples = sampleDates.map((date, index) => ({
  id: index,
  date,
  dateLabel: `${date.replaceAll('-', '/')} ${new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}`,
  title: index === 4 ? 'My Mixset 2026 July' : `My Mixset ${String(index + 1).padStart(2, '0')}`,
  covers: index === 4 ? ['selected-left.png', 'selected-right.png'] : [`cover-${index % 10 + 1}.png`, `cover-${(index + 1) % 10 + 1}.png`],
  duration: index === 4 ? '3:15' : `${3 + index % 3}:${String(12 + index * 3).padStart(2, '0')}`,
}))
const surrounding = [
  { offset: -3, x: 9.272, y: 97.143, angle: -80, cover: 'cover-3.png' },
  { offset: -2, x: 14.184, y: 75.549, angle: -60, cover: 'cover-4.png' },
  { offset: -1, x: 23.417, y: 57.944, angle: -40, cover: 'cover-5.png' },
  { offset: 1, x: 76.583, y: 57.944, angle: 40, cover: 'cover-6.png' },
  { offset: 2, x: 85.818, y: 75.549, angle: 60, cover: 'cover-7.png' },
  { offset: 3, x: 90.728, y: 97.143, angle: 80, cover: 'cover-8.png' },
]

export default function Playlist() {
  const [items, setItems] = useState(samples)
  const [selectedId, setSelectedId] = useState(4)
  const [favorites, setFavorites] = useState<number[]>([])
  const [removed, setRemoved] = useState<typeof samples[number]>()
  const [message, setMessage] = useState('')
  const selected = items.find(item => item.id === selectedId) ?? items[0]
  const index = items.findIndex(item => item.id === selected?.id)
  function move(step: number) {
    if (items.length) setSelectedId(items[(index + step + items.length) % items.length].id)
  }
  function remove() {
    if (!selected) return
    setRemoved(selected)
    setItems(items.filter(item => item.id !== selected.id))
    setMessage('믹스셋을 목록에서 삭제했어요.')
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/playlist`)
      setMessage('플레이리스트 링크를 복사했어요.')
    } catch { setMessage('링크를 복사할 수 없어요. 주소창의 링크를 복사해주세요.') }
  }
  return <main className="playlist" aria-labelledby="playlist-title">
    <div className="playlist-stage" onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        move(event.key === 'ArrowLeft' ? -1 : 1)
      }
    }}>
      <header className="playlist-header">
        <a className="playlist-back" href="/" aria-label="Home으로 돌아가기"><img src="/images/music-select/back.svg" alt="" /></a>
        <h1 id="playlist-title">Mixing List</h1>
      </header>
      {selected ? <>
        <div className="playlist-orbit" aria-label="다른 믹스셋">
          {items.length > 1 && surrounding.map(slot => {
            const item = items[((index + slot.offset) % items.length + items.length) % items.length]
            return <button key={slot.offset} className="playlist-orbit-item" style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: `translate(-50%, -50%) rotate(${slot.angle}deg)` }} aria-label={`${item.title} 선택`} onClick={() => setSelectedId(item.id)}>
              <AlbumCover src={asset(selected.id === 4 ? slot.cover : item.covers[0])} alt="" />
            </button>
          })}
        </div>
        <section className="playlist-selection" aria-label="선택한 믹스셋">
          <article className="playlist-card">
            <div className="playlist-covers">{selected.covers.map(cover => <AlbumCover key={cover} src={asset(cover)} alt={`${selected.title} 앨범 커버`} />)}</div>
            <div className="playlist-details">
              <div><h2>{selected.title}</h2><p><time>{selected.duration}</time><span aria-hidden="true">·</span><time dateTime={selected.date}>{selected.dateLabel}</time></p></div>
              <button className="playlist-play" disabled aria-label="믹스셋 재생 — 음원 준비 중" title="믹스셋 음원 준비 중"><img src={asset('play.svg')} alt="" /></button>
            </div>
          </article>
          <div className="playlist-actions">
            <button onClick={remove} aria-label="선택한 믹스셋 삭제"><img src={asset('delete.svg')} alt="" /></button>
            <button aria-label="즐겨찾기" aria-pressed={favorites.includes(selected.id)} onClick={() => setFavorites(favorites.includes(selected.id) ? favorites.filter(id => id !== selected.id) : [...favorites, selected.id])}><img src={asset('favorite.svg')} alt="" /></button>
            <button onClick={share} aria-label="플레이리스트 링크 복사"><img src={asset('share.svg')} alt="" /></button>
          </div>
        </section>
        <nav className="playlist-pagination" aria-label="믹스셋 선택">{items.map(item => <button key={item.id} aria-label={`${item.title} 선택`} aria-current={selected.id === item.id ? 'true' : undefined} onClick={() => setSelectedId(item.id)}><span /></button>)}</nav>
      </> : <div className="playlist-empty"><p>믹스셋이 없어요.</p><a href="/music-select">새 믹싱 시작하기</a></div>}
      {message && <div className="playlist-message" role="status">{message}{removed && <button onClick={() => {setItems([...items, removed].sort((a,b) => a.id-b.id));setSelectedId(removed.id);setRemoved(undefined);setMessage('')}}>삭제 취소</button>}</div>}
    </div>
  </main>
}
