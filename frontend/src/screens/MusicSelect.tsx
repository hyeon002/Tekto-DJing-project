import AlbumCover from '../components/AlbumCover'
import './MusicSelect.css'
import { selectedTrack, selectionUrl, formatTime } from './musicSelection'

const asset = (name: string) => `/images/music-select/${name}`

export default function MusicSelect() {
  return (
    <main className="music-select" aria-labelledby="music-select-title">
      <div className="music-select-discs" aria-hidden="true">
        <img className="music-select-disc music-select-disc-left" src={asset('disc-left.svg')} alt="" />
        <img className="music-select-disc music-select-disc-right" src={asset('disc-right.svg')} alt="" />
      </div>
      <header className="music-select-header">
        <a className="music-select-back" href="/" aria-label="Home으로 돌아가기">
          <img src={asset('back.svg')} alt="" />
        </a>
        <h1 id="music-select-title">Select Music</h1>
      </header>
      <section className="music-select-decks" aria-label="믹싱할 음악 두 곡 선택">
        {(['left', 'right'] as const).map((deck) => (
          <a key={deck} className={`music-select-add ${selectedTrack(deck) ? 'has-track' : ''}`} href={selectionUrl('/music-search', deck)}
            aria-label={`${deck === 'left' ? '왼쪽' : '오른쪽'} 음악 추가`}>
            {selectedTrack(deck) ? <><AlbumCover className={`selected-track-cover${selectedTrack(deck)!.id === 5 ? ' album-cover-trim' : ''}`} src={selectedTrack(deck)!.cover} alt="" /><span className="selected-track-info"><strong>{selectedTrack(deck)!.title}</strong><span>{selectedTrack(deck)!.artist}</span><time>{formatTime(selectedTrack(deck)!.duration)}</time></span></> : <span className="music-select-add-icon" aria-hidden="true">
              <img className="music-select-add-circle" src={asset('add-circle.svg')} alt="" />
              <img className="music-select-add-plus" src={asset('add.svg')} alt="" />
            </span>}
          </a>
        ))}
      </section>
      <footer className="music-select-footer">
        {selectedTrack('left') || selectedTrack('right') ? <a className="music-select-start" style={{ textDecoration: 'none' }} href={selectionUrl('/mixing')}>Let’s start</a> : <button className="music-select-start" type="button" disabled title="음악을 먼저 선택해주세요">Let’s start</button>}
      </footer>
    </main>
  )
}
