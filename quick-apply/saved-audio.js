/* Static Rachel audio playback. No API key, network synthesis or candidate data. */
(() => {
 'use strict';
 const manifest=window.ASAP_AUDIO_MANIFEST||{clips:{en:{},es:{}}};
 let active=null,sequence=0;
 function stop(){sequence++;if(active){active.pause();active.removeAttribute('src');active.load?.();active=null;}}
 function available(language){return Object.keys(manifest.clips?.[language]||{}).length>0;}
 function play(text,language,onFallback,onStatus){
  stop();const run=sequence;
  const texts=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  const paths=texts.map(t=>manifest.clips?.[language]?.[t]);
  // All segments must exist. Never label partial or device-generated output as Rachel.
  if(!texts.length||paths.some(p=>!p||!/^audio\/[a-z0-9_-]+\.mp3$/.test(p)))return false;
  const fallback=()=>{if(run!==sequence)return;stop();onFallback();};
  function next(i){
   if(run!==sequence)return;
   if(i===paths.length){active=null;return;}
   const audio=new Audio(paths[i]);active=audio;audio.preload='auto';audio.onended=()=>next(i+1);audio.onerror=fallback;
   try{const result=audio.play();if(result?.catch)result.catch(fallback);}catch{fallback();return;}
   onStatus(language==='es'?'Voz: Rachel · audio grabado':'Voice: Rachel · recorded audio');
  }
  next(0);return true;
 }
 window.ASAP_SAVED_AUDIO={available,play,stop};
})();
