const {JSDOM}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
function setup(query='?entry=direct'){
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8').replace(/<script[^>]*><\/script>/g,'');
 const dom=new JSDOM(html,{url:'https://example.com/quick-apply/'+query,runScripts:'outside-only'}),w=dom.window;
 w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.reportValidity=function(){return this.checkValidity()};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 w.speechSynthesis={cancel(){},speak(u){w.spoken=u},getVoices(){return [{name:'Microsoft David',lang:'en-US',voiceURI:'david'},{name:'Microsoft Zira',lang:'en-US',voiceURI:'zira'},{name:'Microsoft Mark',lang:'en-US',voiceURI:'mark'},{name:'Microsoft Aria',lang:'en-US',voiceURI:'aria'},{name:'Microsoft Sabina',lang:'es-US',voiceURI:'sabina'}]}};w.SpeechSynthesisUtterance=function(t){this.text=t};
 w.SpeechRecognition=function(){w.rec=this;this.start=()=>this.onstart();this.stop=()=>this.onend();this.abort=()=>this.onend?.()};
 for(const f of ['jobs.js','app.js','recruiter-data.js','audio/manifest.js','saved-audio.js','site-index.js','site-help.js','recruiter.js'])w.eval(fs.readFileSync(path.join(base,f),'utf8'));
 const $=id=>w.document.getElementById(id);
 const click=s=>{const all=[...$('chatChoices').querySelectorAll('button')];const b=all.find(b=>b.textContent===s)||all.find(b=>b.textContent.startsWith(s));assert(b,'Missing choice '+s+' in '+all.map(b=>b.textContent).join(' | '));b.click();};
 const say=s=>{$('chatInput').value=s;$('chatForm').dispatchEvent(new w.Event('submit',{cancelable:true}));};
 $('openRecruiter').click();return {w,$,click,say,dom};
}
function discover(t,loc='Little Rock',cat='Warehouse & distribution'){
 t.click('Help me find a job');t.click(loc);t.click(cat);t.click('3-4 years');t.say('I have operated reach forklifts, picked orders and counted inventory.');t.click('Day');t.click('Any');t.click('Immediately');t.click('Discuss with recruiter');
}
function finish(t){t.say('Alex');t.say('Sample');t.say('5015550123');t.say('alex@example.com');t.say('Little Rock');t.click('Arkansas');t.say('72201');}
{
 const t=setup();assert.equal(t.$('job').value,'');assert.equal(t.$('branch').value,'');discover(t);
 assert(!t.$('chatChoices').textContent.includes('Manor'));t.click('1. Order Selector');t.click('Review this role');t.click('Yes');t.click('Yes');t.click('None currently');t.click('Yes');t.click('Standard / non-CDL');t.say('Delivery van and reach truck');t.say('Stand-up and reach forklifts, order picking and inventory.');t.say('Stop and compare the count with records, then tell the lead.');finish(t);
 assert(t.$('chatChoices').textContent.includes('Confirm and create'));t.click('Confirm and create');
 assert(t.$('thanks').open);const out=JSON.parse(t.$('jsonPreview').textContent);assert.equal(out.position.wordpress_job_id,9358);assert.equal(out.recruiter_chat.interview_answers.length,2);assert.equal(out.recruiter_chat.entry_mode,'general_visit');assert.equal(out.attribution.utm_source,null);assert.equal(out.applicant.email,'alex@example.com');assert.equal(out.consent.sms_opt_in,false);console.log('PASS general visitor -> screening -> interview -> reviewed JSON');t.dom.window.close();
}
{
 const t=setup('?campaign=facebook-forklift&job_id=9202&preferred_location=CONWAY&job_type=Full%20Time&utm_source=facebook');assert(t.$('chatMessages').textContent.includes('Manor'));t.click('Explore this job');t.click('Review this role');t.click('No');assert(t.$('chatMessages').textContent.includes('may not be the right fit'));t.click('Yes, show me');assert(t.$('chatChoices').textContent.includes('3-4 years'));assert(!t.$('chatChoices').textContent.includes('Little Rock'));console.log('PASS ad confirms actual location; missing experience redirects and retains preferences');t.dom.window.close();
}
{
 const t=setup();t.$('chatLanguage').value='es';t.$('chatLanguage').dispatchEvent(new t.w.Event('change'));t.click('Ayúdeme');t.click('Little Rock');t.click('Manufactura');t.click('1 a 2 años');t.say('He operado máquinas de coser.');t.click('Día');t.click('Cualquier tipo');t.click('De inmediato');t.click('Hablar con el reclutador');t.click('1. Costurero');t.click('Revisar este');t.click('Sí');t.click('Sí');t.click('Ninguna actualmente');t.click('Sí');t.say('Máquinas industriales de coser.');t.say('Coser prendas y revisar costuras.');t.say('Detendría la máquina y avisaría al supervisor.');finish(t);t.click('Confirmar y crear');assert(t.$('thanks').open);const out=JSON.parse(t.$('jsonPreview').textContent);assert.equal(out.recruiter_chat.language,'es');assert.equal(out.recruiter_chat.interview_answers.length,2);assert(t.$('emailSubject').textContent.startsWith('Gracias'));console.log('PASS Spanish discovery -> interviews -> form -> Spanish email preview');t.dom.window.close();
}
{
 const t=setup();discover(t,'North Little Rock','Manufacturing & production');t.click('1. Manufacturing Lead');t.click('Review this role');assert(t.$('chatMessages').textContent.includes('help clarify'));assert(!t.$('minimumYes').checked);console.log('PASS incomplete requirements require recruiter clarification');t.dom.window.close();
}
{
 const t=setup();t.$('readAloud').checked=true;t.$('readAloud').dispatchEvent(new t.w.Event('change'));assert(t.w.spoken.text.includes('type'));assert.equal(t.w.spoken.voice.name,'Microsoft Aria');assert(!/David|Zira|Mark/.test(t.$('chatVoice').textContent));t.$('chatLanguage').value='es';t.$('chatLanguage').dispatchEvent(new t.w.Event('change'));assert.equal(t.w.spoken.lang,'es-US');assert.equal(t.w.spoken.voice.name,'Microsoft Sabina');t.$('chatMic').click();assert(t.$('voiceConsent').open);t.$('allowVoice').click();assert.equal(t.w.rec.lang,'es-US');t.w.rec.onresult({results:[[{transcript:'Hola, quiero trabajar'}]]});assert.equal(t.$('chatInput').value,'Hola, quiero trabajar');assert(!t.$('chatMessages').textContent.includes('Hola, quiero trabajar'));t.w.rec.onerror({error:'not-allowed'});assert(t.$('chatStatus').textContent.includes('No se permitió'));t.$('closeChat').click();assert(!t.$('recruiterChat').open);console.log('PASS speech-language selection, consent, editable dictation, denied microphone and close (mocked APIs)');t.dom.window.close();
}
{
 const t=setup();t.click('Help me find');t.say('Rock');assert.equal(t.$('branch').value,'');assert(t.$('chatStatus').textContent.includes('closest option'));assert(t.$('chatMessages').textContent.includes('Thank you for explaining'));assert(t.$('chatMessages').textContent.includes('location where you want to work'));assert(!t.$('chatMessages').textContent.includes('I do not want to guess'));t.click('Conway');t.click('Office, finance');t.$('chatBack').click();assert(t.$('chatChoices').textContent.includes('Office, finance'));console.log('PASS ambiguous text does not select a job/location; Back restores stage');t.dom.window.close();
}
{
 const t=setup();for(const j of t.w.ASAP_JOBS.jobs){assert(t.w.ASAP_RECRUITER_DATA.summaries[j.id]?.length===2);assert(t.w.ASAP_RECRUITER_DATA.titles[j.id]);assert(j.requirements.length);}console.log('PASS all 31 jobs have source requirements and bilingual summaries');t.dom.window.close();
}
{
 const t=setup();assert.equal(t.$('chatChoices').querySelector('a').getAttribute('href'),'tel:+15015372727');t.click('Fill out the form myself');assert(!t.$('recruiterChat').open);assert.equal(t.$('stepLabel').textContent,'Step 1 of 3 · Contact & opportunity');console.log('PASS welcome offers phone, independent form and guided chat');t.dom.window.close();
}
{
 const t=setup();discover(t);t.click('1. Order Selector');t.click('Review this role');t.click('No');t.click('Yes, show me');assert(t.$('chatMessages').textContent.includes('do not see another'));t.click('Explore all roles');assert(!t.$('chatChoices').textContent.includes('Order Selector'));assert(t.$('chatChoices').textContent.includes('Seamstress'));t.click('1. Seamstress');t.click('Review this role');t.click('Yes');t.click('Yes');t.click('None currently');t.click('Yes');t.say('Industrial sewing machines');t.say('I sew garments and inspect seams.');t.say('I would stop and tell the supervisor.');finish(t);t.click('Confirm and create');const out=JSON.parse(t.$('jsonPreview').textContent);assert.equal(out.position.wordpress_job_id,9505);assert(out.recruiter_chat.declined_job_ids.includes('9358'));assert.equal(out.candidate_screening.skills_and_experience,'I have operated reach forklifts, picked orders and counted inventory.');assert(out.recruiter_chat.requirement_answers.every(a=>a.job_id==='9505'));console.log('PASS alternate role retains profile, resets requirement checks and exports correct new job');t.dom.window.close();
}

{const t=setup();t.w.speechSynthesis.getVoices=()=>[{name:'Microsoft Aria',lang:'en-US',voiceURI:'aria'},{name:'Microsoft Sonia',lang:'en-GB',voiceURI:'sonia'},{name:'Microsoft George',lang:'en-GB',voiceURI:'george'}];t.$('readAloud').checked=true;t.$('readAloud').dispatchEvent(new t.w.Event('change'));assert.equal(t.w.spoken.voice.name,'Microsoft Sonia');console.log('PASS female UK English preferred over US voice');t.dom.window.close();}

{const t=setup();t.w.speechSynthesis.getVoices=()=>[{name:'Google US English',lang:'en-US',voiceURI:'us'},{name:'Google UK English Female',lang:'en-GB',voiceURI:'uk-female'},{name:'Google UK English Male',lang:'en-GB',voiceURI:'uk-male'}];t.$('readAloud').checked=true;t.$('readAloud').dispatchEvent(new t.w.Event('change'));assert.equal(t.w.spoken.voice.voiceURI,'uk-female');assert(!t.$('chatVoice').textContent.includes('UK English Male'));console.log('PASS Chrome UK female selected automatically');t.dom.window.close();}

for(const answer of ['3 to 4 years','three to four years','I have three to four years of experience','3–4 years','3 a 4 años','tres a cuatro años']){const t=setup();t.click('Help me find a job');t.click('Little Rock');t.click('Warehouse & distribution');t.say(answer);assert(t.$('chatMessages').textContent.includes('Tell me about work'));t.dom.window.close();}console.log('PASS typed and dictated experience ranges in English and Spanish');
function reachShift(t){t.click('Help me find a job');t.click('Little Rock');t.click('Warehouse & distribution');t.click('3-4 years');t.say('Warehouse picking');}
for(const answer of ['Day shift','I like working days','I would prefer a morning shift','night shift','I prefer evenings','any shift','prefiero trabajar de dia','turno de noche']){const t=setup();reachShift(t);t.say(answer);assert(t.$('chatMessages').textContent.includes('What type of employment'),answer);t.dom.window.close();}
for(const answer of ['I cannot work day shift','I like days but not nights','day shift or evening shift','maybe night shift','no puedo trabajar turno de noche']){const t=setup();reachShift(t);t.say(answer);assert(t.$('chatChoices').textContent.includes('Flexible'),answer);assert(t.$('chatMessages').textContent.includes('Thank you for explaining'),answer);t.dom.window.close();}
{const t=setup();t.say('ask me questions');t.click('Little Rock');t.say('warehouse work');t.say('this is my first job');t.say('I am ready to learn');t.say('any shift');t.say('I want full time');t.say('I can start now');assert(t.$('chatMessages').textContent.includes('hourly pay'));t.dom.window.close();}
console.log('PASS common response phrases, multi-option ambiguity and negation safety');

{
 const t=setup();t.click('Help me find a job');t.$('companyHelp').click();t.say('When do I get paid?');assert(t.$('chatMessages').textContent.includes('weekly pay'));assert(t.$('chatMessages').querySelector('a').href.includes('job-seeker-faq'));t.click('Return to my application');assert(t.$('chatChoices').textContent.includes('Little Rock'));t.$('companyHelp').click();t.say('Do you offer a spaceship allowance?');assert(t.$('chatMessages').textContent.includes('do not have a verified answer'));t.$('chatLanguage').value='es';t.$('chatLanguage').dispatchEvent(new t.w.Event('change'));t.say('horario');assert(t.$('chatMessages').textContent.includes('lunes a viernes'));t.dom.window.close();console.log('PASS sourced company answers, unknown fallback, Spanish and application continuity');
}
