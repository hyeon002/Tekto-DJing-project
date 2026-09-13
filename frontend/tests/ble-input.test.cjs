const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('../node_modules/typescript');
const {test}=require('node:test');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(s=>load(path.resolve(path.dirname(file),s+'.ts')),module,module.exports);cache.set(file,module.exports);return module.exports}

class Characteristic extends EventTarget {
 constructor(initial){super();this.value=new DataView(Uint8Array.from(initial).buffer);this.reads=0}
 async startNotifications(){this.subscribed=true;return this}
 async readValue(){this.reads++;return this.value}
 send(bytes){this.value=new DataView(Uint8Array.from(bytes).buffer);this.dispatchEvent(new Event('characteristicvaluechanged'))}
}
function setup(serviceUuid,characteristicUuid,initial){
 const characteristic=new Characteristic(initial),device=new EventTarget(),requests=[];
 device.gatt={connected:false,connect:async()=>{device.gatt.connected=true;return {getPrimaryService:async uuid=>{assert.equal(uuid,serviceUuid);return {getCharacteristic:async id=>{assert.equal(id,characteristicUuid);return characteristic}}}}},disconnect(){this.connected=false}};
 Object.defineProperty(globalThis,'navigator',{value:{bluetooth:{requestDevice:async options=>{requests.push(options);assert.deepEqual(options.optionalServices,[serviceUuid]);assert.deepEqual(options.filters[0].services,[serviceUuid]);return device}}},configurable:true});
 return {characteristic,device,requests}
}
const knobModule=load(path.join(__dirname,'../src/core/ble/KnobBleLink.ts'));
const jogModule=load(path.join(__dirname,'../src/core/ble/JogBleLink.ts'));
test('knob firmware custom UUIDs, initial read, three-byte notify, and disconnect',async()=>{
 const {characteristic,requests}=setup(knobModule.KNOB_SERVICE_UUID,knobModule.KNOB_CHARACTERISTIC_UUID,[50,50,50]);
 const link=new knobModule.KnobBleLink(),values=[];link.onValue=v=>values.push(v);await link.connect();
 assert.equal(requests[0].filters[0].namePrefix,'BLEMIDI_2');assert.equal(characteristic.reads,1);assert.equal(link.getState(),'connected-gatt');
 assert.deepEqual(values,[{treble:50,bass:50,volume:50}]);characteristic.send([10,70,90]);assert.deepEqual(values.at(-1),{treble:10,bass:70,volume:90});
 for(const packet of [[75,10,70,90],[101,0,0],[1,2]])characteristic.send(packet);assert.equal(values.length,2);
 await link.disconnect();characteristic.send([0,0,0]);assert.equal(values.length,2);
})
test('jog firmware reads an already-held touch and receives one-byte on/off',async()=>{
 const {characteristic,device,requests}=setup(jogModule.JOG_SERVICE_UUID,jogModule.JOG_CHARACTERISTIC_UUID,[1]);
 const link=new jogModule.JogBleLink(),values=[];link.onValue=v=>values.push(v);await link.connect();
 assert.equal(requests[0].filters[0].namePrefix,'BLEMIDI_1');assert.deepEqual(values,[true]);characteristic.send([0]);characteristic.send([1]);assert.deepEqual(values,[true,false,true]);
 characteristic.send([84,1]);characteristic.send([2]);assert.equal(values.length,3);
 device.dispatchEvent(new Event('gattserverdisconnected'));characteristic.send([0]);assert.equal(values.length,3);assert.equal(link.getState(),'disconnected');
})
test('failure to find firmware service reports error instead of pretending advertising is connected',async()=>{
 const {device}=setup(knobModule.KNOB_SERVICE_UUID,knobModule.KNOB_CHARACTERISTIC_UUID,[50,50,50]);let advertised=false;device.watchAdvertisements=async()=>{advertised=true};
 device.gatt.connect=async()=>{throw new Error('service unavailable')};const link=new knobModule.KnobBleLink();await link.connect();assert.equal(link.getState(),'error');assert.equal(advertised,false);
})
test('a pending initial read cannot overwrite a newer notification',async()=>{
 const {characteristic}=setup(jogModule.JOG_SERVICE_UUID,jogModule.JOG_CHARACTERISTIC_UUID,[0]);
 let finishRead,startedRead;const reading=new Promise(resolve=>{startedRead=resolve});characteristic.readValue=()=>{startedRead();return new Promise(resolve=>{finishRead=resolve})};
 const link=new jogModule.JogBleLink(),values=[];link.onValue=v=>values.push(v);const connecting=link.connect();await reading;
 characteristic.send([1]);finishRead(new DataView(Uint8Array.from([0]).buffer));await connecting;assert.deepEqual(values,[true]);await link.disconnect();
})
test('disconnect during device picker prevents a late connection',async()=>{
 let select;const device={gatt:{connect(){throw new Error('must not connect')}}};
 Object.defineProperty(globalThis,'navigator',{value:{bluetooth:{requestDevice:()=>new Promise(resolve=>{select=resolve})}},configurable:true});
 const link=new knobModule.KnobBleLink();const connecting=link.connect();await link.disconnect();select(device);await connecting;assert.equal(link.getState(),'disconnected');
})
