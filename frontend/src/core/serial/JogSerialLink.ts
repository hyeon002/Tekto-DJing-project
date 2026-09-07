// 조그휠(ESP32-C3, 터치센서+스테퍼모터) 전용 USB Serial 연동.
// 다른 3개 모듈(노브/슬라이더, 그리고 조그휠 자체의 회전값)은 BLE(core/ble)를 쓰지만,
// 이 조그휠의 터치 On/Off 신호만 USB Serial(9600bps)로 들어온다 — 하드웨어 팀 확인 사항.
//
// React에 의존하지 않는 순수 TypeScript 클래스. AudioCore를 직접 참조하지 않고
// onTouchChange 콜백만 노출한다 — 실제 AudioCore 연결은 사용하는 쪽(디버그 패널 등)에서
// `link.onTouchChange = (touching) => audioCore.setJogTouch(touching)` 형태로 배선한다.
//
// 실제 시리얼 출력 문자열이 100% 확정되지 않았다. 아래 두 패턴만 실기 로그를 보고
// 조정하면 된다 — onLine 콜백과 콘솔 로그로 원본 라인을 그대로 확인할 수 있다.
export const TOUCH_ON_PATTERN = /touch detected/i
export const TOUCH_OFF_PATTERN = /(touch released|motor resum|ramp.?up)/i

const BAUD_RATE = 9600

export type SerialLinkState = 'disconnected' | 'connecting' | 'connected' | 'error'

export class JogSerialLink {
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<string> | null = null
  private readableStreamClosed: Promise<void> | null = null
  private state: SerialLinkState = 'disconnected'
  private lineBuffer = ''

  onStateChange: ((state: SerialLinkState) => void) | null = null
  onLine: ((line: string) => void) | null = null
  onTouchChange: ((isTouching: boolean) => void) | null = null

  static isSupported(): boolean {
    return 'serial' in navigator
  }

  getState(): SerialLinkState {
    return this.state
  }

  /** navigator.serial.requestPort()는 반드시 버튼 클릭 등 사용자 제스처 안에서 호출해야 한다. */
  async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'connected') return
    this.setState('connecting')
    try {
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: BAUD_RATE })
      this.port = port
      port.addEventListener('disconnect', this.handlePortDisconnect)
      this.setState('connected')
      void this.readLoop(port)
    } catch (err) {
      console.error('[JogSerialLink] 연결 실패', err)
      this.port = null
      this.setState('error')
    }
  }

  async disconnect(): Promise<void> {
    const port = this.port
    if (!port) return

    try {
      await this.reader?.cancel()
    } catch {
      // 이미 끊긴 포트 등 — 무시
    }
    try {
      await this.readableStreamClosed
    } catch {
      // pipeTo 쪽 에러도 정리 과정의 일부이므로 무시
    }
    try {
      await port.close()
    } catch (err) {
      console.error('[JogSerialLink] 포트 닫기 실패', err)
    }

    this.cleanupPort()
    this.setState('disconnected')
  }

  private handlePortDisconnect = (): void => {
    console.warn('[JogSerialLink] 시리얼 포트 연결 끊김 (케이블 분리 등)')
    this.cleanupPort()
    this.setState('disconnected')
  }

  private async readLoop(port: SerialPort): Promise<void> {
    if (!port.readable) {
      this.setState('error')
      return
    }

    const textDecoder = new TextDecoderStream()
    // TextDecoderStream.writable은 lib.dom.d.ts상 WritableStream<BufferSource>로 선언되어 있어
    // SerialPort.readable(ReadableStream<Uint8Array>)과 제네릭이 정확히 맞지 않는다. 런타임에는
    // Uint8Array가 BufferSource를 만족하므로 안전한 캐스팅.
    this.readableStreamClosed = port.readable.pipeTo(textDecoder.writable as WritableStream<Uint8Array>).catch(() => {})
    this.reader = textDecoder.readable.getReader()

    try {
      while (true) {
        const { value, done } = await this.reader.read()
        if (done) break
        if (value) this.handleChunk(value)
      }
    } catch (err) {
      console.error('[JogSerialLink] 읽기 오류', err)
      if (this.state === 'connected') this.setState('error')
    } finally {
      this.reader?.releaseLock()
      this.reader = null
    }
  }

  /** 청크가 줄 중간에서 끊길 수 있으므로, 완전한 한 줄이 모일 때까지 버퍼링한다. */
  private handleChunk(chunk: string): void {
    this.lineBuffer += chunk
    const lines = this.lineBuffer.split(/\r\n|\n/)
    this.lineBuffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (line.length === 0) continue
      console.log(`[JogSerialLink] raw: ${line}`)
      this.onLine?.(line)
      this.matchTouch(line)
    }
  }

  private matchTouch(line: string): void {
    if (TOUCH_ON_PATTERN.test(line)) {
      this.onTouchChange?.(true)
    } else if (TOUCH_OFF_PATTERN.test(line)) {
      this.onTouchChange?.(false)
    }
  }

  private setState(state: SerialLinkState): void {
    this.state = state
    this.onStateChange?.(state)
  }

  private cleanupPort(): void {
    this.port?.removeEventListener('disconnect', this.handlePortDisconnect)
    this.port = null
    this.reader = null
    this.lineBuffer = ''
  }
}
