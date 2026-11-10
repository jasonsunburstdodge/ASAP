# ASAP recruiter chat: developer handoff

Nov. 10, 2026. Working concept for Jason's review. This extends the existing Quick Apply preview; it is not deployed on asapworksforme.com.

## Try the experience

- General visitor: `./?entry=direct&chat=open`. No job or Facebook source is assumed.
- Ad visitor: `./?campaign=facebook-forklift&job_id=9202&preferred_location=CONWAY&job_type=Full%20Time&utm_source=facebook&utm_medium=paid_social&chat=open`.
- The base page now starts without ad prefill. Use the explicit ad link to demonstrate Facebook.
- Use fictional contact details. JSON and email drafts are created locally, not delivered.

## What works

A prominent top-of-page call CTA uses `tel:+15015372727`, labeled as the Little Rock recruiter line, with a link to other offices. Verified against https://asapworksforme.com/contact-us/ on Nov. 10, 2026. The welcome offers calling directly, filling the existing quick-apply form independently or guided chat. A call link remains available throughout; it starts a phone call only when the visitor activates it. Confirm production call-routing ownership before rollout.

The illustrated assistant opens from the page introduction or floating button. English and Spanish are selectable throughout. It explains typed and spoken answers before asking questions. Optional read-aloud uses the selected language. Speech input starts only on request, shows a browser-service notice, then places the transcript in an editable field. Candidates explicitly send each answer. There is no hidden recording or automatic submission.

General visitors choose a listed work location, work category, experience level, skills, shift, employment type, start date and optional desired pay. Positions are filtered by location, category and employment type. Listings with unspecified employment type remain visible and labeled. The bot does not pretend a shift or pay rate is confirmed when the catalog omits it. Candidates can explore all roles in the location or change locations; it does not silently broaden their search.

Ad visitors confirm the actual listed job and work location first. The earlier Conway preference/Manor job demo is not silently treated as a Conway opening. Attribution stays on the page URL and is included in the existing export.

Each chosen role displays a source-derived English or Spanish summary plus the complete original English requirements and source link. Spanish job titles and summaries are draft translations for review before production. Required and preferred items must remain distinct. All 31 catalog jobs have summaries. Manufacturing Lead has insufficient requirements and routes to a recruiter rather than automatically passing a candidate.

Specific published requirements generate direct Yes/No/Not sure questions where configured: stand-up/reach forklift experience, a current Class A CDL, DOT card, required experience and other credentials. Other minimum requirements receive an explicit review/attestation against the source listing. The assistant records training/certification separately. The Manor listing does not explicitly mandate a forklift license, so no certificate gate is invented. ASAP can add an approved required credential in the production catalog.

A reported unmet requirement produces: “Based on your answers, this position may not be the right fit right now. Other positions may fit your experience. Can I ask a few questions to help you explore those options?” An affirmative answer continues discovery, retaining shared information, excluding the declined job from that exploration and asking only missing discovery questions. A new role resets its requirement checks and interview answers. Unknown requirements offer human help. No final hiring decision, qualification score or applicant rejection is generated.

For a selected role, the assistant collects role-specific screening answers and two short interview responses. Examples include warehouse inventory discrepancies, pre-delivery vehicle problems and safe completion of a technical repair. Responses are preserved verbatim for recruiters, not scored. Contact details are gathered afterward. A review lets candidates edit answers, fill the existing form or explicitly generate the preview. The same form validation and minimum-requirement rules run at submission. No resume or formal application is added. SMS remains a separate, unchecked opt-in.

## Source files and data contract

- `recruiter.js`: guided state machine, bilingual questions, speech input/output, field validation, review and form bridge. This is a guided chatbot, not an unrestricted LLM service.
- `recruiter-data.js`: category filters, translated titles, source summaries, explicit requirement questions and interview prompts.
- `recruiter.css`: accessible dialog and responsive chat UI.
- `assets/recruiter.webp`: the approved-in-conversation orange-shirt avatar concept.
- `app.js`: `window.ASAP_FORM` exposes limited select/fill methods. JSON retains `asap.quick_apply.v2` and adds an optional `recruiter_chat` object with version `asap.recruiter_chat.v1`.
- Chat fields: language, input mode, entry mode, selected job ID, catalog date, requirement answers, interviews, preferences, declined job IDs, voice-notice acceptance and transcript. These are self-reported and require recruiter review.
- Existing form fields remain authoritative for the final application. If a person edits the form after chat transfer, the chat transcript is a historical record, not a replacement for final field values. A manual job/filter change clears attached chat metadata.

## Production implementation

1. Add the widget to the WordPress/Elementor site, with scoped styles and one shared application API. Preserve the quick-apply form as an alternative. Do not place API keys in client JavaScript.
2. Replace the snapshot with a server-maintained, recruiter-approved job feed. Track open/closed status, job ID, location, pay, shift, employment type, duties and requirements. Every requirement needs an ID, source, required/preferred status, acceptable alternatives, question text in both languages, effective date and revision. Flag unclear source wording for recruiters rather than inferring a gate. Validate that a job remains open on final submission.
3. If a conversational model is added, use it only to understand responses and ask approved questions against that feed. Return structured fields for confirmation. Treat candidate answers as data, not instructions. Never fabricate openings, pay, shifts, requirements or promises. Keep eligibility/redirect logic server-validated and visible; let candidates correct an interpretation or contact a recruiter.
4. Collect only job-related answers. Do not request medical details, identification numbers or sensitive personal histories. Do not infer ability, personality or language proficiency from an accent or voice. Clarifications and accommodation questions go to a human, not an automatic failure. Do not score or rank applicants. Review employer-supplied screening criteria before production use.
5. Replace the local export with authenticated server intake, validation, size limits, rate limiting, duplicate/idempotency protection and approved storage/retention. Maintain source and consent timestamps. Do not send contact details, interview text, credentials or transcripts to Meta/GA analytics. No microphone audio is stored by this concept.
6. Route the recruiter packet with selected job, preferred location, source campaign, self-reported credentials, availability, interview answers and unresolved questions. Mark records as requiring recruiter review. Human-help requests need a real approved destination and service process; the concept provides the verified Little Rock call link and links to ASAP's contact page and does not promise or request a callback.
7. Generate a confirmation in the candidate's selected language only after the backend accepts the record. Connect COATS only after its supported import/API contract and required fields are confirmed. Keep delivered, imported and recruiter-reviewed statuses separate.
8. Record generic events such as chat_started, language_selected, job_selected, alternate_roles_requested, application_reviewed and application_accepted. A conversion occurs after backend acceptance, not after opening chat or merely generating a local file. Deduplicate browser/server Meta events when implemented. The concept installs no analytics or production connections.

## Voice support and test limits

Speech recognition is not supported uniformly. Some browsers send audio to a browser-managed service. It may need an internet connection and HTTPS, and microphone access can be denied. Always keep typing available. The initial notice and permission request must appear before microphone use. Recognition uses `en-US` or `es-US`; speech synthesis selects the nearest available installed voice. Available voices and quality vary by device. Audio stops when the dialog closes, the language changes or recognition starts.

The concept uses push-to-talk, then review and send. It does not provide a hands-free continuous conversation. For dependable cross-browser voice, add a consented server transcription/speech service with documented processors, retention, latency and costs. Do not claim native-browser voice works everywhere.

References: [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [MDN getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices).

Before release, test English/Spanish on Chrome, Edge and Safari desktop/mobile, with real microphones and local voices. Include permission denied, no speech, disconnected service, missing Spanish voice, corrected dictation, name/email/phone transcription, screen readers, keyboard navigation and small screens. Confirm draft Spanish summaries and screening logic with ASAP. Test stale/closed jobs, no suitable openings, switching roles, every required/preferred alternative and backend delivery failures. Browser API availability is not proof of successful microphone transcription.

## Preferred speaking voice, Nov. 10, 2026

Jason requested a pleasant woman's voice. The preview now prefers named adult female device voices, including Microsoft Aria/Jenny or Apple Samantha for English and Microsoft Dalia/Sabina or Apple Paulina/Mónica for Spanish when available. A Voice selector shows the actual voice in use. Device availability varies; if none of those named voices are installed, other voices for the chosen language remain selectable. No gender claim is made about unnamed or unrecognized device voices. The preview waits for the device voice list and does not silently switch to another language. Normal pitch and a slightly slower speaking rate (0.94) keep questions clear.

For a consistent hosted voice, the recommended candidate is ElevenLabs Rachel, ID `21m00Tcm4TlvDq8ikWAM`. ElevenLabs describes her as a personable female voice for conversational use: https://ui.elevenlabs.io/docs/components/voice-picker. Official sample: https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/b4928a68-c03b-411f-8533-3d5c299fd451.mp3. This recommendation is based on the provider's description; English/Spanish auditions with the actual recruiter script are still needed.

ElevenLabs is NOT active in this preview. No connected ElevenLabs service or configured API key was available. Production should generate only approved assistant prompts through a backend with its API key in a secret store, or pre-generate the fixed prompts and serve their audio. Do not put the key in the public GitHub repository. Start by auditioning Rachel with `eleven_multilingual_v2` in both languages, using normal pitch and moderate pacing. Validate voice availability in the account and usage rights before deployment. If Spanish delivery is not natural enough, choose a native Spanish female voice for that language. Do not send candidate answers, names or contact details to the speech provider.

API reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert. The browser voice remains the fallback until a hosted speech connection is configured and tested.
