# ASAP Quick Apply concept

Recruiter-screening concept. No resume upload or formal application.

- Open `index.html` to try the three-step flow.
- Click **Try it with sample details**, continue through experience, then submit.
- Submission generates local JSON, a personalized confirmation email preview and a thank-you dialog.
- Download JSON or an `.eml` draft from the output panel.
- Nothing is sent to ASAP, email or COATS. Use fictional data.
- Read `build-guide.html` for WordPress implementation, recruiter routing, email delivery and the COATS contract dependency.
- `jobs.json` is a snapshot of 31 listings retrieved November 10, 2026. Production must use the current approved catalog.

## Verification

JavaScript syntax checked. Browser-tested sample submission, JSON/email generation, modal, Back/Continue, job filtering and general-interest question changes. Desktop and 390-pixel mobile layout visually reviewed. Native mobile device interactions, production email delivery and COATS ingestion are not verified.

## Data and assets

ASAP logo and industries-page people illustration come from asapworksforme.com. Montserrat fonts are retained from the site's font sources. All sample candidate information is fictional. Existing repository homepage and assets are preserved.

## Revision: ad prefill and requirements

The explicit `?campaign=facebook-forklift` demo simulates a Facebook ad: Full-Time, Conway preference, Forklift Warehouse Associate - Manor. The source job remains Manor with employment type unspecified; this mismatch is explicitly labeled in the concept. Production campaigns must resolve valid job metadata server-side.

- `?entry=direct` opens the manual search flow with no prefilled job.
- `?campaign=facebook-forklift&job_id=9202&preferred_location=CONWAY&job_type=Full%20Time&utm_source=facebook&utm_medium=paid_social` demonstrates campaign prefill.
- Every one of the 31 jobs has source-derived requirements in `jobs.json` / `jobs.js`.
- Location precedes the job selector. Changing filters clears the selection; choosing another position removes the campaign exception.
- A No minimum-requirements response opens the alternate-position dialog on submit and generates no JSON/email. Choosing another position preserves contact fields but resets job-specific questions and attestation.
- JSON version is `asap.quick_apply.v2`; includes requirements snapshot, explicit response and campaign context. No application category.
- Hero reuses the exact transparent people asset from ASAP's industries page; CSS recreates the layered geometric backdrop in shades of orange.

## Revision: bilingual recruiter chat

The base page now opens without ad assumptions. Use `?entry=direct&chat=open` for general discovery. The recruiter avatar opens a guided English/Spanish conversation with optional dictation and read-aloud, job-specific screening, alternate-role exploration and short interviews. Chat can fill the existing form or generate its local application preview after explicit review. See `recruiter-build-guide.html` for the full flow and production requirements.

Source continuity: based on repository commit `162138d3ca0aa505156d940ada5f56f07799d343`, preserved in Git history and local backup branch `backup/pre-recruiter-chat-20261110`. Reviewed the current ASAP Client Statement of Truth and existing Quick Apply README/build guide on Nov. 10, 2026. User authorized this preview extension in the project conversation. Production/client approval is not claimed. This README records the preview task; the separate agency-wide task register was not edited.

### Recruiter chat verification, Nov. 10, 2026

Nine automated DOM checks passed: general discovery through JSON, ad location confirmation and missing-credential redirect, Spanish screening through email preview, incomplete requirements, mocked speech-language/consent/transcript/error handling, ambiguous input and Back, coverage for all 31 summaries, call/form/chat opening choices and alternate-role selection preserving profile while resetting role-specific answers. Run with Node 24, install `jsdom@31.0.0` as a development dependency, then `node tests/recruiter.cjs`.

Public-browser checks verified the top call CTA and its tel target, no-prefill entry, location/category questions, job results, unmet-credential redirect, retained location and Spanish alternatives. Desktop layout visually checked. Speech recognition was tested with mock events only; actual microphone transcription, installed voice playback and physical mobile devices remain unverified. No actual phone call was placed. Email and COATS remain disconnected.
