import type { KnobValues } from '../ble/KnobBleLink'

// Selected music and its aligned bass stem share one Web Audio clock.
export class MixingAudio {
 readonly context = new AudioContext()
 private output = this.context.createGain()
 private treble = this.context.createBiquadFilter()
 private bassGain = this.context.createGain()
 private sources: { source: AudioBufferSourceNode; gain: GainNode }[] = []
 private buffers: Partial<Record<'master' | 'bass' | 'scratch', AudioBuffer>> = {}
 private offset = 0
 private since = 0
 private rate = 1
 private touching = false
 playing = false
 get duration() { return this.buffers.master?.duration || 0 }
 get position() { return Math.min(this.duration, this.offset + (this.playing && !this.touching ? (this.context.currentTime - this.since) * this.rate : 0)) }
 constructor() {
  this.treble.type = 'highshelf'
  this.treble.frequency.value = 3000
  this.bassGain.connect(this.treble)
  this.treble.connect(this.output)
  this.output.connect(this.context.destination)
 }
 async load(kind: 'master' | 'bass' | 'scratch', url: string) {
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
 setKnobs(value: KnobValues) {
  const now = this.context.currentTime
  this.treble.gain.setTargetAtTime((value.treble / 100) * 24 - 12, now, .01)
  this.bassGain.gain.setTargetAtTime(value.bass / 100, now, .01)
  this.output.gain.setTargetAtTime(value.volume / 100, now, .01)
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
  for (const kind of (this.touching ? ['scratch'] : ['master', 'bass']) as ('master' | 'bass' | 'scratch')[]) {
   const buffer = this.buffers[kind]
   if (!buffer || (!this.touching && this.offset >= buffer.duration)) continue
   const source = this.context.createBufferSource()
   const gain = this.context.createGain()
   source.buffer = buffer
   source.loop = kind === 'scratch'
   source.playbackRate.value = this.touching ? 1 : this.rate
   source.connect(gain)
   gain.connect(kind === 'bass' ? this.bassGain : kind === 'scratch' ? this.output : this.treble)
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
