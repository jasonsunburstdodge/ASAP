# Rachel saved audio

Status: scripts and playback ready; audio not generated. ElevenLabs sign-in is pending. No credentials are stored here.

`prompts.json` is the source manifest: 322 clips, 162 English and 160 Spanish, totaling 32,745 spoken characters. It is exported from the actual chatbot prompts and job catalog, not candidate answers. Paragraphs are deduplicated so shared requirements instructions are recorded once. Dynamic job-result screens use a stable spoken instruction while showing exact job names and counts on screen. Personal application details stay on screen and are not recorded.

`prompts-en.txt` and `prompts-es.txt` contain copy-ready ElevenLabs text with the required output filenames. FILE labels and separators are instructions, not text to record. Generate only the text under each filename. Use Rachel with Eleven Multilingual v2, normal pitch and a calm, conversational delivery. Pronounce ASAP as A S A P. Audition both languages before generating the remaining clips.

The website does not require an API account or server for playback. Store each actual MP3 under its listed filename, then run `python scripts/build-audio-manifest.py`. This checks files with ffprobe and enables only files that exist. Listen to generated clips before publication; file validation does not verify pronunciation.

For generation through an already authorized ElevenLabs account, the optional local helper reads `ELEVENLABS_API_KEY` from the environment. The key must never be placed in any tracked file. `python scripts/generate-audio.py` is dry-run only. `--generate --limit 1 --language en` and the equivalent Spanish command make small auditions. Full generation uses account credits; review the displayed character count and account balance first. The helper skips existing files, stops on errors and does not retry billable requests automatically. It does not purchase or upgrade an account.

Run `NODE_PATH=<jsdom installation>/node_modules node scripts/export-audio-prompts.cjs` after changing spoken copy or requirements. IDs change with the text. Run the manifest builder again so stale clips cannot play for changed text. Retain old clips until the replacement is verified.

Until real clips are available, the manifest remains empty and the original device voice works. Rachel is offered in the voice menu only when verified clips exist. Missing or failed recordings fall back to the selected/best available device voice and display that fact. There are no placeholder audio files and no use of ElevenLabs' unrelated public sample as a recruiter prompt.
