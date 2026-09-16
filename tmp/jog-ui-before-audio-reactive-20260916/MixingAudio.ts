export interface EqValues { high: number; mid: number; low: number }
export function eqGain(value: number) { return (Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50)) - 50) * .24 }

// Shared by real-time playback and the offline frequency-response check.
export function createEqualizer(context: BaseAudioContext) {
 const high = context.createBiquadFilter()
 high.type = 'highshelf'; high.frequency.value = 4000
 const mid = context.createBiquadFilter()
 mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = .7
 const low = context.createBiquadFilter()
 low.type = 'lowshelf'; low.frequency.value = 250
 low.connect(mid); mid.connect(high)
 return {input:low, output:high, high, mid, low, setValues(value:EqValues) {
  high.gain.setTargetAtTime(eqGain(value.high), context.currentTime, .02)
  mid.gain.setTargetAtTime(eqGain(value.mid), context.currentTime, .02)
  low.gain.setTargetAtTime(eqGain(value.low), context.currentTime, .02)
 }}
}

// Three-band EQ processes the original music directly; scratch bypasses EQ.
export class MixingAudio {
 readonly context = new AudioContext()
 private output = this.context.createGain()
 private equalizer = createEqualizer(this.context)
 private limiter = this.context.createDynamicsCompressor()
 private sources: { source: AudioBufferSourceNode; gain: GainNode }[] = []
 private buffers: Partial<Record<'master' | 'scratch', AudioBuffer>> = {}
 private offset = 0
 private since = 0
 private rate = 1
 private touching = false
 playing = false
 get duration() { return this.buffers.master?.duration || 0 }
 get position() { return Math.min(this.duration, this.offset + (this.playing && !this.touching ? (this.context.currentTime - this.since) * this.rate : 0)) }
 constructor() {
  this.equalizer.output.connect(this.output)
  // Reduce overload when boosting several bands at once.
  this.limiter.threshold.value = -3
  this.limiter.knee.value = 6
  this.limiter.ratio.value = 12
  this.limiter.attack.value = .003
  this.limiter.release.value = .15
  this.output.connect(this.limiter)
  this.limiter.connect(this.context.destination)
 }
 async load(kind: 'master' | 'scratch', url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('음원을 불러올 수 없어요.')
  const buffer = await this.context.decodeAudioData(await response.arrayBuffer())
  if (this.context.state === 'closed') return
  this.buffers[kind] = buffer
  if (this.playing) this.restart()
 }
 async play() {
  if (!this.buffers.master) throw new Error('기본 음원을 먼저 등록해주세요.')
  await this.context.resume()
  if (this.context.state === 'closed' || this.playing) return
  if (this.position >= this.duration) this.offset = 0
  this.playing = true
  this.since = this.context.currentTime
  this.start()
 }
 pause() { this.offset = this.position; this.playing = false; this.stop() }
 seek(value: number) { this.stop(); this.offset = Math.max(0, Math.min(this.duration, value)); this.since = this.context.currentTime; if (this.playing) this.start() }
 setRate(value: number) { this.offset = this.position; this.rate = .9 + Math.max(0, Math.min(1, value)) * .2; this.since = this.context.currentTime; for (const {source} of this.sources) if (!this.touching) source.playbackRate.value = this.rate }
 setKnobs(value: EqValues) {
  this.equalizer.setValues(value)
 }
 setTouch(value: boolean) {
  // Missing sample must never silence the selected song.
  const touching = value && Boolean(this.buffers.scratch)
  if (touching === this.touching) return
  this.offset = this.position
  this.stop()
  this.touching = touching
  this.since = this.context.currentTime
  if (this.playing) this.start()
 }
 private restart() { this.offset = this.position; this.stop(); this.since = this.context.currentTime; this.start() }
 private start() {
  const now = this.context.currentTime
  for (const kind of (this.touching ? ['scratch'] : ['master']) as ('master' | 'scratch')[]) {
   const buffer = this.buffers[kind]
   if (!buffer || (!this.touching && this.offset >= buffer.duration)) continue
   const source = this.context.createBufferSource()
   const gain = this.context.createGain()
   source.buffer = buffer
   source.loop = kind === 'scratch'
   source.playbackRate.value = this.touching ? 1 : this.rate
   source.connect(gain)
   gain.connect(kind === 'scratch' ? this.output : this.equalizer.input)
   gain.gain.setValueAtTime(0, now)
   gain.gain.linearRampToValueAtTime(1, now + .12)
   source.onended = () => { source.disconnect(); gain.disconnect() }
   source.start(now, this.touching ? 0 : this.offset)
   this.sources.push({source, gain})
  }
 }
 private stop() {
  const now = this.context.currentTime
  for (const {source, gain} of this.sources) {
   gain.gain.cancelScheduledValues(now)
   gain.gain.setValueAtTime(gain.gain.value, now)
   gain.gain.linearRampToValueAtTime(0, now + .12)
   source.stop(now + .12)
  }
  this.sources = []
 }
 dispose() { this.stop(); void this.context.close() }
}
