import { lazy, Suspense } from 'react'
import Home from './screens/Home'
import MusicSelect from './screens/MusicSelect'
import MusicSearch from './screens/MusicSearch'
import Mixing from './screens/Mixing'

const TestPage = lazy(() => import('./dev/TestPage'))

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/test') {
    return <Suspense fallback={<p>테스트 도구를 불러오는 중…</p>}><TestPage /></Suspense>
  }
  if (path === '/music-select') return <MusicSelect />
  if (path === '/music-search') return <MusicSearch />
  if (path === '/mixing') return <Mixing />
  if (path !== '/') return <main className="not-found"><h1>페이지를 찾을 수 없어요.</h1><a href="/">Home으로 돌아가기</a></main>
  return <Home />
}

export default App
