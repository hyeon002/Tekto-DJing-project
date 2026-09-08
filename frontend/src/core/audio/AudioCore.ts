// Web Audio API 기반 사운드 엔진. React에 의존하지 않는 순수 TypeScript 클래스.
//
// 외부(지금은 core/input의 ControlBus 경유, 나중에는 core/ble)에서는 아래 3개 제어용
// public 메서드로만 이 엔진을 제어한다. BLE 파서가 완성되면 이 메서드 호출부만 실제
// 수신값으로 갈아끼우면 된다 — 이 3개의 시그니처는 앞으로도 바뀌지 않는다.
//   - setJogTouch(isTouching)
//   - setSliderValue(raw)   raw 0~1000 (BPM)
//   - setKnobValues({ treble, bass, volume })   각 raw 0~100 (노브 모듈의 포텐셔미터 3개)
//
// 그 외에 getAnalyserData()는 도트매트릭스 비주얼라이저 등 시각화 전용 조회 메서드로,
// 위 3개의 제어 계약과는 별개로 추가된 것이다.

type ToneType = 'sine' | 'square'

interface TrackAsset {
  url: string
  fallbackFreq: number
  fallbackType: ToneType
}

/** 재생 위치/배속을 추적하기 위한 상태. rate가 바뀌거나 일시정지될 때마다 갱신된다. */
interface Transport {
  offsetAtLastSync: number
  contextTimeAtLastSync: number
  rate: number
}

const CROSSFADE_SEC = 0.12
// 32 = 도트매트릭스 그리드 가로 칸 수와 맞춤 (fftSize/2 = frequencyBinCount).
const ANALYSER_FFT_SIZE = 64

const ASSETS: Record<'master' | 'bass' | 'scratch', TrackAsset> = {
  master: { url: '/audio/master.mp3', fallbackFreq: 220, fallbackType: 'sine' },
  bass: { url: '/audio/bass.mp3', fallbackFreq: 110, fallbackType: 'sine' },
  scratch: { url: '/audio/scratch.mp3', fallbackFreq: 440, fallbackType: 'square' },
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** 슬라이더 raw(0~1000, BPM) -> 재생 배속(0.9~1.1). 0/500/1000 세 기준점 사이 선형 보간. */
function mapSliderToRate(raw: number): number {
  const v = clamp(raw, 0, 1000)
  if (v <= 500) return lerp(0.9, 1.0, v / 500)
  return lerp(1.0, 1.1, (v - 500) / (1000 - 500))
}

/** 노브 Bass raw(0~100) -> 베이스 트랙 gain(0~1). */
function mapBassToGain(raw: number): number {
  return clamp(raw, 0, 100) / 100
}

/** 노브 Treble raw(0~100) -> highshelf 필터 gain(dB). 50=0dB(중립), 0=-12dB, 100=+12dB. */
function mapTrebleToDb(raw: number): number {
  return lerp(-12, 12, clamp(raw, 0, 100) / 100)
}

/** 노브 Volume raw(0~100) -> 마스터 출력 gain(0~1). */
function mapVolumeToGain(raw: number): number {
  return clamp(raw, 0, 100) / 100
}

export class AudioCore {
  private ctx: AudioContext
  private initialized = false

  // 버스: master+bass는 musicBus로, scratch는 scratchBus로 모여 크로스페이드된다.
  // musicBus는 masterOutput으로 가기 전에 trebleFilter(노브 Treble)를 거친다.
  private masterTrackGain: GainNode
  private bassKnobGain: GainNode
  private musicBusGain: GainNode
  private trebleFilter: BiquadFilterNode
  private scratchGain: GainNode
  private scratchBusGain: GainNode
  private masterOutputGain: GainNode
  private analyser: AnalyserNode
  private analyserData: Uint8Array<ArrayBuffer>

  private masterBuffer: AudioBuffer | null = null
  private bassBuffer: AudioBuffer | null = null
  private scratchBuffer: AudioBuffer | null = null

  private masterSource: AudioBufferSourceNode | null = null
  private bassSource: AudioBufferSourceNode | null = null
  private scratchSource: AudioBufferSourceNode | null = null

  private jogTouching = false
  private transport: Transport = { offsetAtLastSync: 0, contextTimeAtLastSync: 0, rate: 1.0 }

  constructor() {
    this.ctx = new AudioContext()

    this.masterTrackGain = this.ctx.createGain()
    this.masterTrackGain.gain.value = 0.9
    this.bassKnobGain = this.ctx.createGain()
    this.bassKnobGain.gain.value = 1.0
    this.musicBusGain = this.ctx.createGain()
    this.musicBusGain.gain.value = 1.0

    // 노브 Treble이 musicBus(master+bass)에만 적용되고 scratch에는 영향 없도록
    // musicBus -> masterOutput 사이에 끼워 넣는다.
    this.trebleFilter = this.ctx.createBiquadFilter()
    this.trebleFilter.type = 'highshelf'
    this.trebleFilter.frequency.value = 3000
    this.trebleFilter.gain.value = 0

    this.scratchGain = this.ctx.createGain()
    this.scratchGain.gain.value = 0.9
    this.scratchBusGain = this.ctx.createGain()
    this.scratchBusGain.gain.value = 0.0

    // music/scratch 두 버스가 여기서 합쳐진 뒤 destination과 analyser로 각각 나간다 —
    // analyser는 "실제로 들리는 최종 믹스"를 그대로 봐야 하므로 이 지점에 붙인다.
    // 노브 Volume은 이 masterOutputGain을 직접 제어하므로 analyser/destination 모두
    // 볼륨이 반영된 소리를 그대로 본다.
    this.masterOutputGain = this.ctx.createGain()
    this.masterOutputGain.gain.value = 1.0

    this.masterTrackGain.connect(this.musicBusGain)
    this.bassKnobGain.connect(this.musicBusGain)
    this.musicBusGain.connect(this.trebleFilter)
    this.trebleFilter.connect(this.masterOutputGain)

    this.scratchGain.connect(this.scratchBusGain)
    this.scratchBusGain.connect(this.masterOutputGain)

    this.masterOutputGain.connect(this.ctx.destination)

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = ANALYSER_FFT_SIZE
    this.masterOutputGain.connect(this.analyser)
    this.analyserData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
  }

  get isInitialized(): boolean {
    return this.initialized
  }

  /** 사용자 제스처(버튼 클릭) 안에서 호출해야 한다 — AudioContext.resume()의 브라우저 제약. */
  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    await this.ctx.resume()

    const [masterBuf, bassBuf, scratchBuf] = await Promise.all([
      this.loadBuffer(ASSETS.master),
      this.loadBuffer(ASSETS.bass),
      this.loadBuffer(ASSETS.scratch),
    ])
    this.masterBuffer = masterBuf
    this.bassBuffer = bassBuf
    this.scratchBuffer = scratchBuf

    this.masterSource = this.startSource(this.masterBuffer, this.masterTrackGain, 0)
    this.bassSource = this.startSource(this.bassBuffer, this.bassKnobGain, 0)
    this.transport.offsetAtLastSync = 0
    this.transport.contextTimeAtLastSync = this.ctx.currentTime
  }

  /** 조그휠 터치 On/Off. On = 마스터+베이스 일시정지 후 스크래치 샘플 재생, Off = 정지 지점부터 재개. */
  setJogTouch(isTouching: boolean): void {
    if (!this.initialized || isTouching === this.jogTouching) return
    const now = this.ctx.currentTime

    if (isTouching) {
      this.transport.offsetAtLastSync = this.getCurrentOffset()
      this.transport.contextTimeAtLastSync = now
      this.jogTouching = true

      // 소스는 크로스페이드가 끝나는 시점에 정지시켜, 즉시 끊기며 나는 클릭음을 피한다.
      this.masterSource?.stop(now + CROSSFADE_SEC)
      this.bassSource?.stop(now + CROSSFADE_SEC)
      this.masterSource = null
      this.bassSource = null
      this.rampGain(this.musicBusGain.gain, 0, now)

      this.scratchSource = this.startSource(this.scratchBuffer, this.scratchGain, 0)
      this.rampGain(this.scratchBusGain.gain, 1, now)
    } else {
      this.jogTouching = false
      this.transport.contextTimeAtLastSync = now
      this.rampGain(this.musicBusGain.gain, 1, now)

      this.masterSource = this.startSource(this.masterBuffer, this.masterTrackGain, this.transport.offsetAtLastSync)
      this.bassSource = this.startSource(this.bassBuffer, this.bassKnobGain, this.transport.offsetAtLastSync)

      this.scratchSource?.stop(now + CROSSFADE_SEC)
      this.scratchSource = null
      this.rampGain(this.scratchBusGain.gain, 0, now)
    }
  }

  /** 슬라이더 raw 0~1000(BPM) -> 마스터/베이스 공통 재생 배속(0.9~1.1x). */
  setSliderValue(raw: number): void {
    const rate = mapSliderToRate(raw)
    if (rate === this.transport.rate) return

    if (!this.jogTouching) {
      const now = this.ctx.currentTime
      this.transport.offsetAtLastSync = this.getCurrentOffset()
      this.transport.contextTimeAtLastSync = now
    }
    this.transport.rate = rate

    this.masterSource?.playbackRate.setValueAtTime(rate, this.ctx.currentTime)
    this.bassSource?.playbackRate.setValueAtTime(rate, this.ctx.currentTime)
  }

  /** 노브 모듈의 포텐셔미터 3개(각 raw 0~100) -> 트레블 필터 / 베이스 게인 / 마스터 볼륨. */
  setKnobValues({ treble, bass, volume }: { treble: number; bass: number; volume: number }): void {
    const now = this.ctx.currentTime
    this.trebleFilter.gain.setTargetAtTime(mapTrebleToDb(treble), now, 0.01)
    this.bassKnobGain.gain.setTargetAtTime(mapBassToGain(bass), now, 0.01)
    this.masterOutputGain.gain.setTargetAtTime(mapVolumeToGain(volume), now, 0.01)
  }

  /**
   * 최종 믹스(master+bass+scratch 크로스페이드 결과)의 현재 주파수 도메인 데이터(0~255)를
   * 반환한다. 비주얼라이저가 매 requestAnimationFrame마다 호출하는 조회 전용 메서드.
   * 내부 버퍼를 매 호출마다 덮어써서 반환하므로(프레임마다 새로 할당하지 않기 위함),
   * 반환값을 다음 프레임까지 보관하지 말고 호출한 자리에서 바로 사용할 것.
   */
  getAnalyserData(): Uint8Array<ArrayBuffer> {
    this.analyser.getByteFrequencyData(this.analyserData)
    return this.analyserData
  }

  /** 디버그 패널 언마운트 시 등 정리용. */
  dispose(): void {
    this.masterSource?.stop()
    this.bassSource?.stop()
    this.scratchSource?.stop()
    void this.ctx.close()
  }

  /** jogTouching 여부와 상관없이 "지금 마스터 트랙 재생 위치가 몇 초인지"를 계산한다. */
  private getCurrentOffset(): number {
    if (this.jogTouching) return this.transport.offsetAtLastSync
    const elapsed = this.ctx.currentTime - this.transport.contextTimeAtLastSync
    return this.transport.offsetAtLastSync + elapsed * this.transport.rate
  }

  private rampGain(param: AudioParam, target: number, now: number): void {
    param.cancelScheduledValues(now)
    param.setValueAtTime(param.value, now)
    param.linearRampToValueAtTime(target, now + CROSSFADE_SEC)
  }

  private startSource(buffer: AudioBuffer | null, destination: GainNode, offset: number): AudioBufferSourceNode | null {
    if (!buffer) return null
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.playbackRate.value = this.transport.rate
    source.connect(destination)
    const safeOffset = buffer.duration > 0 ? offset % buffer.duration : 0
    source.start(0, safeOffset)
    return source
  }

  private async loadBuffer(asset: TrackAsset): Promise<AudioBuffer> {
    try {
      const res = await fetch(asset.url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arrayBuffer = await res.arrayBuffer()
      if (arrayBuffer.byteLength === 0) throw new Error('empty file')
      return await this.ctx.decodeAudioData(arrayBuffer)
    } catch (err) {
      console.warn(`[AudioCore] "${asset.url}" 로드 실패 — ${asset.fallbackFreq}Hz 테스트 톤으로 대체합니다.`, err)
      return this.generateToneBuffer(asset.fallbackFreq, asset.fallbackType)
    }
  }

  /** 루프 경계에서 클릭이 나지 않도록, 정수 사이클 길이(약 1초)로 톤 버퍼를 합성한다. */
  private generateToneBuffer(freq: number, type: ToneType): AudioBuffer {
    const sampleRate = this.ctx.sampleRate
    const cycles = Math.max(1, Math.round(freq))
    const duration = cycles / freq
    const length = Math.round(sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    const amplitude = type === 'sine' ? 0.5 : 0.3
    for (let i = 0; i < length; i++) {
      const phase = (2 * Math.PI * freq * i) / sampleRate
      data[i] = type === 'sine' ? Math.sin(phase) * amplitude : Math.sign(Math.sin(phase)) * amplitude
    }
    return buffer
  }
}