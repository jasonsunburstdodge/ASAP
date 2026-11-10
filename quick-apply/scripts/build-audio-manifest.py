#!/usr/bin/env python3
"""Validate downloaded/generated clips and publish a manifest only for verified files."""
import json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'audio/prompts.json').read_text());clips={'en':{},'es':{}};missing=[]
for p in data['prompts']:
 file=root/'audio'/p['filename']
 if not file.exists():missing.append(p['filename']);continue
 result=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(file)],capture_output=True,text=True,check=True)
 if float(result.stdout.strip())<=0:raise ValueError('Invalid duration: '+file.name)
 clips[p['language']][p['text']]='audio/'+p['filename']
status='complete' if not missing else 'partial' if any(clips.values()) else 'pending_generation'
manifest={'voice':'Rachel','provider':'ElevenLabs','status':status,'clips':clips}
(root/'audio/manifest.js').write_text('window.ASAP_AUDIO_MANIFEST='+json.dumps(manifest,ensure_ascii=False)+';\n')
print(json.dumps({'status':status,'ready':sum(map(len,clips.values())),'missing':len(missing)}))
