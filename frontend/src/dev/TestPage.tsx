import AudioCoreDebugPanel from './AudioCoreDebugPanel'

export default function TestPage() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', colorScheme: 'light' }}>
      <nav style={{ display: 'flex', gap: 24 }} aria-label="개발 테스트 메뉴">
        <a href="/">← Home</a>
        <a href="/test/ble.html">독립 BLE 연결 테스트</a>
      </nav>
      <h1>TEKTO STUDIO · 연결 테스트</h1>
      <AudioCoreDebugPanel />
    </main>
  )
}
