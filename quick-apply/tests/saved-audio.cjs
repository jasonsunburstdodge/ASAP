const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../saved-audio.js'),'utf8');
let audio=[],fallback=0,status=[];
class Audio {constructor(src){this.src=src;audio.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}}
const window={ASAP_AUDIO_MANIFEST:{clips:{en:{Hello:'audio/en-hello.mp3',Next:'audio/en-next.mp3'},es:{Hola:'audio/es-hola.mp3'}}}};
vm.runInNewContext(source,{window,Audio});const player=window.ASAP_SAVED_AUDIO;
assert(player.available('en'));assert(!player.play('Unknown','en',()=>fallback++,s=>status.push(s)));assert.equal(audio.length,0);
assert(player.play('Hello\n\nNext','en',()=>fallback++,s=>status.push(s)));assert.equal(audio[0].src,'audio/en-hello.mp3');audio[0].onended();assert.equal(audio[1].src,'audio/en-next.mp3');
player.stop();assert(audio[1].paused);audio[1].onended();assert.equal(audio.length,2);
player.play('Hola','es',()=>fallback++,s=>status.push(s));assert.equal(audio[2].src,'audio/es-hola.mp3');audio[2].onerror();assert.equal(fallback,1);
player.play('Hello','en',()=>fallback++,s=>status.push(s));player.stop();audio[3].onerror();assert.equal(fallback,1);
assert(status.some(s=>s.includes('Rachel')));console.log('PASS saved-audio sequencing, locale, missing clips, cancellation and error fallback');
