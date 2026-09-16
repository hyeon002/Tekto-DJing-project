import { lazy, Suspense, useEffect, useState } from 'react'
import Home from './screens/Home'
import MusicSelect from './screens/MusicSelect'
import MusicSearch from './screens/MusicSearch'
import Playlist from './screens/Playlist'
import Mixing from './screens/Mixing'
import Settings from './screens/Settings'
import { MixingSession } from './screens/MixingSession'

const TestPage = lazy(() => import('./dev/TestPage'))

function App() {
  return <MixingSession><Routes /></MixingSession>
}
function Routes() {
  const [, setLocation] = useState(window.location.href)
  useEffect(() => {
    const update = () => setLocation(window.location.href)
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin || !['/', '/settings', '/music-select', '/music-search', '/mixing', '/playlist'].includes(url.pathname)) return
      event.preventDefault()
      window.history.pushState(null, '', url)
      update()
      window.scrollTo(0, 0)
    }
    document.addEventListener('click', navigate)
    window.addEventListener('popstate', update)
    return () => { document.removeEventListener('click', navigate); window.removeEventListener('popstate', update) }
  }, [])
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/test') {
    return <Suspense fallback={<p>테스트 도구를 불러오는 중…</p>}><TestPage /></Suspense>
  }
  if (path === '/music-select') return <MusicSelect />
  if (path === '/playlist' || (path === '/music-search' && new URLSearchParams(window.location.search).get('from') === 'playlist')) return <Playlist />
  if (path === '/music-search') return <MusicSearch />
  if (path === '/settings') return <Settings />
  if (path === '/mixing') return <Mixing />
  if (path !== '/') return <main className="not-found"><h1>페이지를 찾을 수 없어요.</h1><a href="/">Home으로 돌아가기</a></main>
  return <Home />
}

export default App
