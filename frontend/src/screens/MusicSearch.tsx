import { useState } from 'react'
import './MusicSearch.css'
import TrackPreview from './TrackPreview'
import { tracks, selectionUrl, type Track } from './musicSelection'

// Design reference data only; no streaming catalogue or playable audio is connected yet.
const albums = [
  { id: 1, title: 'Immunity', artist: 'Clairo', kind: 'Album', tracks: 11, minutes: 40 },
  { id: 2, title: 'This is How Tomorrow Moves', artist: 'beabadobee', kind: 'Album', tracks: 14, minutes: 41 },
  { id: 3, title: 'Beatopia', artist: 'beabadobee', kind: 'Album', tracks: 14, minutes: 45 },
  { id: 4, title: 'The Chase', artist: 'Hearts2Hearts', kind: 'Single', tracks: 1, minutes: 3 },
  { id: 5, title: 'Electric Shock -The 2nd Mini Album', artist: 'f(x)', kind: 'Album', tracks: 11, minutes: 40 },
  { id: 6, title: 'Training Day', artist: 'LNGSHOT', kind: 'EP', tracks: 5, minutes: 13 },
  { id: 7, title: 'you seem pretty sad for a girl so in love', artist: 'Olivia Rodrigo', kind: 'Album', tracks: 13, minutes: 51 },
  { id: 8, title: 'you seem pretty sad for a girl so in love', artist: 'Olivia Rodrigo', kind: 'Album', tracks: 13, minutes: 51 },
]
const categories = ['Popular', 'Trending', 'Rising', 'Emerging', 'Notable', 'Recommended', 'Upcoming']

export default function MusicSearch() {
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<Track>()
  const fromPlaylist = new URLSearchParams(window.location.search).get('from') === 'playlist'
  const deck = new URLSearchParams(window.location.search).get('deck') === 'right' ? 'right' : 'left'
  const normalized = query.trim().toLocaleLowerCase()
  const results = albums.filter(album => `${album.title} ${album.artist}`.toLocaleLowerCase().includes(normalized))
  return (
    <main className="music-search" aria-label={fromPlaylist ? 'Playlist 앨범 검색' : `${deck === 'left' ? '왼쪽' : '오른쪽'} 음악 검색`}>
      <header className="music-search-header">
        <a className="music-search-back" href={fromPlaylist ? '/' : selectionUrl('/music-select')} aria-label={fromPlaylist ? 'Home으로 돌아가기' : '음악 선택으로 돌아가기'}><img src="/images/music-select/back.svg" alt="" /></a>
        <label className="music-search-field">
          <img src="/images/music-search/search.svg" alt="" />
          <input type="search" placeholder="Search Anything" aria-label="앨범 또는 아티스트 검색" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
      </header>
      <div className="music-search-tabs" aria-label="검색 유형">
        <h1>Albums</h1>
        <button disabled title="Tracks 화면 준비 중">Tracks</button>
        <button disabled title="Artists 화면 준비 중">Artists</button>
      </div>
      <div className="music-search-categories" aria-label="앨범 분류">
        {categories.map((category, index) => <button key={category} className={index === 0 ? 'is-active' : ''} disabled title={index === 0 ? '현재 Popular 앨범 목록' : '분류별 목록 준비 중'}>{category}</button>)}
      </div>
      {results.length ? <section className="music-search-results" aria-label="앨범 검색 결과" tabIndex={0}>
        <div className="music-search-grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(results.length / 2)}, var(--album-width))` }}>
          {results.map(album => <button type="button" key={album.id} className="music-search-album" aria-label={`${album.id === 4 ? 'The Chase' : album.title} 미리듣기`} aria-pressed={preview?.id === album.id} onClick={() => setPreview(tracks.find(track => track.id === album.id))}>
            <img className="music-search-cover" src={`/images/music-search/${album.id}.png`} alt={`${album.title} 앨범 커버`} />
            <div className="music-search-album-info">
              <h2>{album.title}</h2><p>{album.kind} | {album.artist}</p>
              <span className="music-search-duration">{album.tracks}tracks {album.minutes}min</span>
            </div>
          </button>)}
        </div>
      </section> : <p className="music-search-empty" role="status">“{query}” 검색 결과가 없어요.</p>}
      {preview && <TrackPreview key={preview.id} track={preview} deck={deck} />}
    </main>
  )
}
