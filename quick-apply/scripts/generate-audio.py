#!/usr/bin/env python3
"""Generate fixed Rachel clips once; the public site never needs the API key.
Default is a dry run. --generate uses account credits. --limit 2 can create a sample.
"""
import argparse, json, os, pathlib, subprocess, sys, urllib.request, urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--generate',action='store_true');parser.add_argument('--limit',type=int);parser.add_argument('--language',choices=['en','es']);args=parser.parse_args()
data=json.loads((ROOT/'audio/prompts.json').read_text());prompts=[p for p in data['prompts'] if not args.language or p['language']==args.language]
if args.limit is not None:prompts=prompts[:max(0,args.limit)]
missing=[p for p in prompts if not (ROOT/'audio'/p['filename']).exists()]
print(f"Pending clips: {len(missing)}; spoken characters: {sum(len(p['spoken_text']) for p in missing)}")
if not args.generate:print('Dry run only. Pass --generate after reviewing account credit usage.');sys.exit(0)
key=os.environ.get('ELEVENLABS_API_KEY')
if not key:sys.exit('ELEVENLABS_API_KEY must be configured securely in this local environment. Do not put it in the repository.')
for i,p in enumerate(missing,1):
 body=json.dumps({'text':p['spoken_text'],'model_id':data['model_id'],'voice_settings':{'stability':0.55,'similarity_boost':0.75,'style':0,'use_speaker_boost':True,'speed':0.94}}).encode()
 request=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/'+data['voice_id']+'?output_format=mp3_44100_128',data=body,headers={'Content-Type':'application/json','xi-api-key':key})
 dest=ROOT/'audio'/p['filename'];tmp=dest.with_suffix('.tmp.mp3')
 try:
  with urllib.request.urlopen(request,timeout=120) as response:audio=response.read()
  tmp.write_bytes(audio)
  subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(tmp)],check=True,capture_output=True)
  tmp.replace(dest)
 except urllib.error.HTTPError as e:sys.exit(f'Provider returned HTTP {e.code}. Stopped without automatic retries; check the account before resuming.')
 except Exception:tmp.unlink(missing_ok=True);sys.exit('Audio generation or validation failed. Existing completed clips are preserved.')
 print(f'{i}/{len(missing)} saved {p["filename"]}')
print('Run scripts/build-audio-manifest.py after listening to the generated clips.')
