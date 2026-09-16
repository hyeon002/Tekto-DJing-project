import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MixingAudio, eqGain } from '../src/core/audio/MixingAudio.ts'
class Param { value=0; setValueAtTime(v){this.value=v} linearRampToValueAtTime(v){this.value=v} setTargetAtTime(v){this.value=v} cancelScheduledValues(){} }
class Node { gain=new Param(); Q=new Param(); threshold=new Param(); knee=new Param(); ratio=new Param(); attack=new Param(); release=new Param(); frequency=new Param(); playbackRate=new Param(); connect(target){this.target=target} disconnect(target){this.target=target} start(time,offset){this.started={time,offset}} stop(time){this.stopped=time} }
class Context { currentTime=0; state='running'; destination={}; sources=[]; filters=[]; createDynamicsCompressor(){return new Node()} createGain(){return new Node()} createBiquadFilter(){const n=new Node();this.filters.push(n);return n} createBufferSource(){const n=new Node();this.sources.push(n);return n} async resume(){} async close(){this.state='closed'} async decodeAudioData(){return {duration:120}} }
globalThis.AudioContext=Context
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})
test('jog holds position and resumes original music after repeated touch packets',async()=>{
 const p=new MixingAudio();for(const k of ['master','scratch'])await p.load(k,k)
 await p.play();p.context.currentTime=10;p.setTouch(true);assert.equal(p.position,10)
 const count=p.context.sources.length;p.context.currentTime=15;p.setTouch(true);assert.equal(p.context.sources.length,count);assert.equal(p.position,10)
 p.setTouch(false);assert.equal(p.context.sources.at(-1).started.offset,10)
 p.context.currentTime=17;assert.equal(p.position,12);p.pause();p.context.currentTime=20;assert.equal(p.position,12);await p.play();assert.equal(p.context.sources.at(-1).started.offset,12);p.dispose()
})
test('missing scratch leaves music playing; seek and speed preserve synchronized position',async()=>{
 const p=new MixingAudio();await p.load('master','master');await p.play();p.context.currentTime=5;p.setTouch(true);p.context.currentTime=6;assert.equal(p.position,6)
 p.setRate(1);p.context.currentTime=16;assert.equal(p.position,17);p.seek(30);assert.equal(p.context.sources.at(-1).started.offset,30);assert.equal(p.context.sources.at(-1).playbackRate.value,1.1)
 p.pause();p.setTouch(false);assert.equal(p.playing,false);p.dispose()
})
test('requires a real master asset and rejects failed downloads',async()=>{
 const p=new MixingAudio();await assert.rejects(()=>p.play(),/기본 음원/);globalThis.fetch=async()=>({ok:false});await assert.rejects(()=>p.load('master','missing'));assert.equal(p.duration,0);p.dispose()
})

test('EQ has neutral defaults, independent gains, clamps invalid values, and never restarts music',()=>{
 const p=new MixingAudio();const [high,mid,low]=p.context.filters
 assert.deepEqual([high.type,mid.type,low.type],['highshelf','peaking','lowshelf'])
 assert.equal(low.target,mid);assert.equal(mid.target,high)
 p.setKnobs({high:50,mid:50,low:50});assert.deepEqual([high.gain.value,mid.gain.value,low.gain.value],[0,0,0])
 p.setKnobs({high:100,mid:0,low:50});assert.deepEqual([high.gain.value,mid.gain.value,low.gain.value],[12,-12,0])
 p.setKnobs({high:50,mid:50,low:100});assert.deepEqual([high.gain.value,mid.gain.value,low.gain.value],[0,0,12])
 assert.equal(eqGain(NaN),0);assert.equal(eqGain(-50),-12);assert.equal(eqGain(150),12)
 assert.equal(p.context.sources.length,0);p.dispose()
})
