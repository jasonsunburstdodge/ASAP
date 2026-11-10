(() => {
'use strict';
const $=id=>document.getElementById(id), catalog=window.ASAP_JOBS.jobs, data=window.ASAP_RECRUITER_DATA;
const tr=(en,es)=>lang==='es'?es:en, norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9@.+ ]/g,' ').replace(/\s+/g,' ').trim();
const nice=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bCdl\b/g,'CDL');
let lang='en',state='welcome',p={},selected=null,answers=[],history=[],transcript=[],choices=[],currentQuestion='',editing=null,checkIndex=0,roleIndex=0,interviewIndex=0,usedVoice=false,voiceAllowed=false,recognizer=null,listening=false;
const locations=[...new Set(catalog.map(j=>j.location))].sort();
const labels={location:['Preferred work location','Lugar de trabajo preferido'],category:['Kind of work','Tipo de trabajo'],experience:['Related experience','Experiencia relacionada'],skills:['Experience and skills','Experiencia y habilidades'],shift:['Preferred shift','Turno preferido'],type:['Job type','Tipo de empleo'],startAvailability:['Available to start','Disponibilidad para comenzar'],desiredPay:['Desired hourly pay','Pago por hora deseado'],firstName:['First name','Nombre'],lastName:['Last name','Apellido'],phone:['Phone','Teléfono'],email:['Email','Correo electrónico'],city:['Home city','Ciudad de residencia'],state:['Home state','Estado de residencia'],zip:['ZIP code','Código postal'],transportation:['Travel to the job','Traslado al trabajo'],certifications:['Training or certifications','Formación o certificaciones']};
const enums={experience:[['No experience yet','Sin experiencia todavía'],['Less than 1 year','Menos de 1 año'],['1-2 years','1 a 2 años'],['3-4 years','3 a 4 años'],['5+ years','5 años o más']],shift:[['Day','Día'],['Evening','Tarde'],['Night','Noche'],['Flexible','Flexible']],type:[['Any','Cualquier tipo'],['Full Time','Tiempo completo'],['Contract','Contrato'],['Other','Otro']],startAvailability:[['Immediately','De inmediato'],['Within 1 week','Dentro de 1 semana'],['Within 2 weeks','Dentro de 2 semanas'],['More than 2 weeks','Más de 2 semanas'],['Need to discuss','Necesito hablarlo']],transportation:[['Yes','Sí'],['No','No'],['Need to discuss','Necesito hablarlo']]};
const contactSteps=['firstName','lastName','phone','email','city','state','zip'];
const profileSteps=['location','category','experience','skills','shift','type','startAvailability','desiredPay'];
function title(j){return lang==='es'?(data.titles[j.id]||nice(j.title)):nice(j.title);}
function category(j){return data.categories.find(c=>c[0]!=='any'&&new RegExp(c[3]).test(j.title))?.[0]||'production';}
function label(key){return labels[key]?.[lang==='es'?1:0]||key;}
function displayValue(key,val){return enums[key]?.find(x=>x[0]===val)?.[lang==='es'?1:0] || (key==='category'?data.categories.find(x=>x[0]===val)?.[lang==='es'?2:1]:null)||val;}
function stopVoice(){window.ASAP_SAVED_AUDIO?.stop();waitingForVoice=false;if(recognizer){recognizer.abort();recognizer=null;}listening=false;window.speechSynthesis?.cancel();$('chatMic').setAttribute('aria-pressed','false');$('chatMic').textContent=tr('Use microphone','Usar micrófono');}
// Prefer named adult women's voices where the device offers them; never infer gender from language alone.
const voicePreferences={en:['Google UK English Female','Sonia','Serena','Aria','Jenny','Samantha','Ava','Allison','Susan','Victoria','Karen','Serena','Sonia'],es:['Dalia','Paloma','Sabina','Paulina','Mónica','Monica','Elvira','Helena','Laura']};
const selectedVoices={};
let availableVoices=[],waitingForVoice=false;
function voiceKey(v){return v.voiceURI||v.name+'|'+v.lang;}
// Device voices have no standard gender field; exclude recognized male names and Zira.
const excludedVoiceNames=/\b(zira|david|mark|george|james|guy|christopher|eric|roger|ryan|andrew|brian|steffan|tony|jacob|sean|richard|ravi|rishi|hemant|pablo|raul|raúl|alvaro|álvaro|jorge|diego|enrique|miguel|alonso|alex|daniel|fred|thomas|lee|oliver|male)\b/i;
function isPermittedVoice(v){if(excludedVoiceNames.test(v.name||''))return false;if(v.lang?.toLowerCase()==='en-gb')return voicePreferences.en.some(name=>(v.name||'').toLowerCase().includes(name.toLowerCase()));return !v.lang?.toLowerCase().startsWith('es')||voicePreferences.es.some(name=>(v.name||'').toLowerCase().includes(name.toLowerCase()));}
function voiceRank(v){const i=voicePreferences[lang].findIndex(n=>(v.name||'').toLowerCase().includes(n.toLowerCase()));return (lang==='en'?(v.lang.toLowerCase()==='en-gb'?0:2000):0)+(i<0?1000:i*10)+(v.lang.toLowerCase()===(lang==='es'?'es-mx':'en-gb')?0:2);}
function refreshVoices(){
 availableVoices=(window.speechSynthesis?.getVoices()||[]).filter(v=>v.lang?.toLowerCase().startsWith(lang)&&isPermittedVoice(v)).sort((a,b)=>voiceRank(a)-voiceRank(b));
 const box=$('chatVoice');box.replaceChildren();const recorded=window.ASAP_SAVED_AUDIO?.available(lang);
 if(recorded)box.add(new Option(tr('Rachel · saved audio','Rachel · audio grabado'),'recorded-rachel'));
 if(!availableVoices.length&&!recorded){box.add(new Option(tr('No voice loaded for this language','No hay voz cargada para este idioma'),''));box.disabled=true;return;}
 box.disabled=false;availableVoices.forEach(v=>box.add(new Option((v.name||v.lang)+' · '+v.lang,voiceKey(v))));
 const ukFemale=lang==='en'&&availableVoices.find(v=>v.lang.toLowerCase()==='en-gb');
 box.value=ukFemale?voiceKey(ukFemale):(recorded?'recorded-rachel':voiceKey(availableVoices[0]));
}
function speak(text){
 if(!$('readAloud').checked)return;
 window.speechSynthesis?.cancel();refreshVoices();
 if($('chatVoice').value==='recorded-rachel'&&window.ASAP_SAVED_AUDIO?.play(text,lang,()=>{ $('chatStatus').textContent=tr('Recorded audio is unavailable. Using the selected device voice.','El audio grabado no está disponible. Se usará la voz del dispositivo.');speakDevice(text);},s=>{$('chatStatus').textContent=s;}))return;
 speakDevice(text);
}
function speakDevice(text){
 if(!$('readAloud').checked||!('speechSynthesis' in window))return;
 window.speechSynthesis.cancel();refreshVoices();
 const v=availableVoices.find(v=>voiceKey(v)===$('chatVoice').value)||availableVoices[0];
 if(!v){waitingForVoice=true;$('chatStatus').textContent=tr('A voice for this language has not loaded. You can keep reading or try Hear again.','No se ha cargado una voz para este idioma. Puede seguir leyendo o intentar Escuchar de nuevo.');return;}
 waitingForVoice=false;
 const u=new SpeechSynthesisUtterance(text.replace(/ASAP/g,'A S A P'));u.lang=v.lang;u.voice=v;u.rate=.94;u.pitch=1;
 u.onerror=e=>{if(!['canceled','interrupted'].includes(e.error))$('chatStatus').textContent=tr('Audio is unavailable. You can read every question here.','El audio no está disponible. Puede leer cada pregunta aquí.');};speechSynthesis.speak(u);
}

function message(text,user=false){const box=document.createElement('div');box.className='chat-message'+(user?' user':'');box.lang=lang;const who=document.createElement('span');who.className='message-who';who.textContent=user?tr('YOU','USTED'):tr('ASAP ASSISTANT','ASISTENTE ASAP');box.append(who,document.createTextNode(text));$('chatMessages').append(box);$('chatMessages').scrollTop=$('chatMessages').scrollHeight;transcript.push({speaker:user?'candidate':'assistant',text,language:lang});return box;}
function responsePrompt(text){
 if(text.trim().endsWith('?'))return text;
 const endings={
  jobOverview:['Would you like to review this role with me or explore another position?','¿Quiere revisar este puesto conmigo o explorar otro?'],
  requirements:['Can you meet these requirements? Choose yes, no or talk to a recruiter.','¿Puede cumplir estos requisitos? Elija sí, no o hablar con un reclutador.'],
  results:['Which position would you like to explore?','¿Qué puesto le gustaría explorar?'],
  review:['Choose an Edit button to make changes, fill your form or confirm and create the application preview.','Elija Editar para hacer cambios, complete su formulario o confirme y cree la vista previa de la solicitud.'],
  unclear:['Would you like to call using the button below, explore other positions or review this role again?','¿Quiere llamar con el botón de abajo, explorar otros puestos o revisar este puesto otra vez?'],
  certifications:['Tell me what you hold, or choose none currently or discuss with recruiter.','Dígame qué tiene, o elija ninguna actualmente o hablar con el reclutador.']
 };
 const ending=endings[state]||['Please type your answer or tap the microphone and tell me.','Escriba su respuesta o toque el micrófono para decírmela.'];
 return text+' '+tr(ending[0],ending[1]);
}
function ask(text){currentQuestion=responsePrompt(text);return message(currentQuestion);}
// Common phrases stay scoped to the current question and its offered choices.
const commonAnswers={
 shift:{
  Day:['day shift','days','daytime','morning shift','mornings','first shift','1st shift','I like working days','I prefer days','I can work days','turno de dia','de dia','por la manana','prefiero trabajar de dia','me gusta trabajar de dia'],
  Evening:['evening shift','evenings','afternoon shift','afternoons','second shift','2nd shift','I prefer evenings','turno de tarde','por la tarde','prefiero las tardes'],
  Night:['night shift','nights','overnight','graveyard shift','third shift','3rd shift','I like working nights','turno nocturno','turno de noche','por la noche','prefiero las noches'],
  Flexible:['any shift','any time','either shift','all shifts','I am flexible','my schedule is flexible','no preference','days or nights','cualquier turno','cualquier horario','soy flexible','no tengo preferencia']
 },
 experience:{
  'No experience yet':['no experience','I have no experience','this is my first job','first job','new to this','sin experiencia','no tengo experiencia','es mi primer trabajo'],
  'Less than 1 year':['less than a year','under a year','a few months','six months','6 months','menos de un ano','unos meses','seis meses'],
  '1-2 years':['one year','1 year','two years','2 years','a year','un ano','dos anos','2 anos'],
  '3-4 years':['three years','3 years','four years','4 years','tres anos','3 anos','cuatro anos','4 anos'],
  '5+ years':['five years','5 years','five or more years','5 or more years','more than five years','over five years','cinco anos','5 anos','cinco anos o mas','mas de cinco anos']
 },
 type:{
  Any:['anything','either one','no preference','any type','open to anything','cualquiera','cualquier empleo','no tengo preferencia'],
  'Full Time':['full time job','fulltime','a full time position','I want full time','40 hours a week','tiempo completo','jornada completa'],
  Contract:['contract work','contract job','a contract position','trabajo por contrato','por contrato'],
  Other:['part time','parttime','part time work','weekends only','medio tiempo','tiempo parcial','solo fines de semana']
 },
 startAvailability:{
  Immediately:['right away','as soon as possible','asap','today','tomorrow','I can start now','ready now','ahora','hoy','manana','lo antes posible','puedo empezar ya'],
  'Within 1 week':['next week','in a week','one week','1 week','this week','la proxima semana','en una semana','esta semana'],
  'Within 2 weeks':['in two weeks','two weeks','2 weeks','I need two weeks notice','en dos semanas','dos semanas'],
  'More than 2 weeks':['in a month','next month','in three weeks','three weeks','3 weeks','en un mes','el proximo mes','tres semanas'],
  'Need to discuss':['not sure yet','I am not sure','need to discuss','talk to a recruiter','no estoy seguro','no estoy segura','necesito hablarlo']
 },
 category:{
  warehouse:['warehouse work','warehouse jobs','picking and packing','order picking','almacen','trabajo de almacen','montacargas'],
  driving:['driving','delivery','delivery driver','truck driving','conducir','conductor','reparto','entregas'],
  trades:['maintenance','welding','welder','mechanic','skilled trades','mantenimiento','soldadura','mecanico'],
  production:['factory work','factory','manufacturing','production','sewing','fabrica','produccion','costura'],
  office:['office work','office job','administrative work','accounting','bookkeeping','oficina','administracion','contabilidad'],
  outdoor:['construction','landscaping','outdoor work','lawn care','construccion','jardineria','trabajo al aire libre'],
  any:['anything','open to anything','any kind of work','not sure yet','cualquier trabajo','estoy abierto a opciones','estoy abierta a opciones']
 },
 welcome:{discover:['help me','help me find work','find a job','looking for a job','ask me questions','lets start','let s start','buscar trabajo','busco empleo','hagame preguntas'],form:['the form','application form','I will fill it out','fill it out myself','el formulario','completar por mi cuenta']},
 transportation:{Yes:['yes I can','I can get there','I have reliable transportation','I have a ride','si puedo','puedo llegar','tengo transporte'],No:['no I cannot','I cannot get there','I do not have transportation','no puedo llegar','no tengo transporte'],'Need to discuss':['not sure','it depends','I need to discuss it','no estoy seguro','no estoy segura','depende']}
};
function commonAliases(value){
 const local=commonAnswers[state]?.[value]||[];
 if(['check','requirements'].includes(state))return [...local,...({yes:['yes I do','yes I can','I meet those requirements','si puedo','si cumplo'],no:['no I do not','no I cannot','I do not meet those requirements','no cumplo','no puedo'],unsure:['not sure','I am not sure','I need more information','it depends','talk to a recruiter','no estoy seguro','no estoy segura','necesito mas informacion','depende']}[value]||[])];
 return local;
}
function option(en,es,value,action,sub='',aliases=[]){const b=document.createElement('button');b.type='button';b.textContent=tr(en,es);if(sub){b.className='job-choice';const s=document.createElement('small');s.textContent=sub;b.append(s);}const item={value,label:tr(en,es),aliases:[en,es,String(value),...aliases,...commonAliases(value)],action};choices.push(item);b.onclick=()=>accept(item.label,item.value,action);$('chatChoices').append(b);}
function save(){history.push({state,p:structuredClone(p),selected:selected?.id||null,answers:structuredClone(answers),checkIndex,roleIndex,interviewIndex,editing,transcriptLength:transcript.length});}
function accept(text,val,action){stopVoice();save();message(text,true);message(tr('Thank you for sharing that.','Gracias por compartirlo.'));$('chatInput').value='';$('chatStatus').textContent='';if(action)action(val);else handle(val);}
function go(next){state=next;render();}
function profileNext(){go(profileSteps.find(k=>p[k]===undefined)||'results');}
function contactNext(){go(contactSteps.find(k=>!p[k])||'review');}
function resetRole(j){p.afterRole=false;selected=j;answers=[];checkIndex=roleIndex=interviewIndex=0;delete p.requirements;delete p.credential;delete p.certifications;delete p.transportation;p.roleAnswers=[];p.interviews=[];}
function noFit(){p.declined=[...new Set([...(p.declined||[]),selected.id])];go('redirect');}
function roleNext(){const list=window.ASAP_FORM.questions(selected);if(roleIndex<list.length)go('role');else go('interview');}
function qualify(){const checks=data.checks[selected.id]||[];if(checkIndex<checks.length)go('check');else go('requirements');}
function selectJob(id){const j=catalog.find(j=>j.id===id);if(!j)return;resetRole(j);go('jobOverview');}
function yesNo(yes,no,unsure){option('Yes','Sí','yes',yes,'',['yes i do','si tengo']);option('No','No','no',no,'',['no i do not','no tengo']);if(unsure)option('Not sure / talk to a recruiter','No estoy seguro / hablar con un reclutador','unsure',unsure);}
function record(q,a){answers.push({job_id:selected.id,question:q,answer:a,language:lang});}
function showRequirements(box){const details=document.createElement('details'),sum=document.createElement('summary');sum.textContent=tr('Read all published requirements','Leer todos los requisitos publicados (inglés)');details.append(sum);const ul=document.createElement('ul');for(const req of selected.requirements){const li=document.createElement('li');li.textContent=req;ul.append(li);}details.append(ul);const link=document.createElement('a');link.href=selected.url;link.target='_blank';link.rel='noopener';link.textContent=tr('Open the original job listing','Abrir el anuncio original');details.append(link);box.append(details);}
function jobOptions(){
 let local=catalog.filter(j=>j.location===p.location&&!(p.declined||[]).includes(j.id));
 const typeList=p.type==='Any'?local:local.filter(j=>!j.employment_type||j.employment_type===p.type);
 const cat=data.categories.find(x=>x[0]===p.category)||data.categories.at(-1);
 const relevant=typeList.filter(j=>new RegExp(cat[3]).test(j.title));
 const list=p.showAll?local:relevant;
 if(!list.length){ask(tr('I do not see another listing for those preferences in '+nice(p.location)+'. Would you like to explore other kinds of work here or choose another location?','No veo otro anuncio para esas preferencias en '+nice(p.location)+'. ¿Quiere explorar otros tipos de trabajo aquí o elegir otro lugar?'));}
 else ask(tr((list.length===1?'Here is 1 position to explore in ':'Here are '+list.length+' positions to explore in ')+nice(p.location)+'. Choose one to review its requirements. Your schedule, pay and qualifications still need confirmation.','Hay '+list.length+' puestos para explorar en '+nice(p.location)+'. Elija uno para revisar sus requisitos. Aún debemos confirmar horario, pago y cualificaciones.'));
 list.forEach((j,i)=>option((i+1)+'. '+nice(j.title),(i+1)+'. '+title(j),j.id,selectJob,nice(j.location)+' · '+(j.employment_type?(enums.type.find(x=>x[0]===j.employment_type)?.[lang==='es'?1:0]||j.employment_type):tr('Job type not specified','Tipo de empleo no especificado')),'one two three four five six seven eight nine ten'.split(' ').slice(i,i+1).concat(String(i+1),nice(j.title),title(j))));
 if(!p.showAll)option('Explore all roles in this location','Explorar todos los puestos aquí','all',()=>{p.showAll=true;go('results');});
 option('Choose another location','Elegir otro lugar','location',()=>{delete p.location;p.showAll=false;go('location');});
}
let companyHelp=false;
function showCompanyHelp(query=''){
 stopVoice();companyHelp=true;choices=[];$('chatMessages').replaceChildren();$('chatChoices').replaceChildren();$('chatPages').hidden=true;$('chatChoiceHint').hidden=true;$('chatInput').value='';$('chatInput').disabled=false;$('chatSend').disabled=false;$('chatBack').disabled=true;
 const topics=window.ASAP_SITE_HELP||[],q=norm(query);
 const hits=q?topics.filter(t=>new RegExp('\\b('+t.pattern+')\\b').test(q)):[];
 if(query)message(query,true);
 const answer=hits.length===1?hits[0]:null;
 currentQuestion=answer?(lang==='es'?answer.es:answer.en):query?tr('Thanks for asking. I do not have a verified answer to that specific question. You can explore the official pages below or call an ASAP recruiter.','Gracias por preguntar. No tengo una respuesta verificada a esa pregunta específica. Puede consultar las páginas oficiales de abajo o llamar a un reclutador de ASAP.'):tr('I can help with questions about ASAP, office contacts, applications and career resources. What would you like to know?','Puedo ayudar con preguntas sobre ASAP, oficinas, solicitudes y recursos profesionales. ¿Qué le gustaría saber?');
 message(currentQuestion);
 const link=(title,url)=>{const a=document.createElement('a');a.className='asap-help-link';a.textContent=title;a.href=url;a.target='_blank';a.rel='noopener noreferrer';$('chatMessages').append(a);};
 if(answer)link(tr('Open official ASAP page','Abrir página oficial de ASAP'),'https://asapworksforme.com/'+answer.path);
 else if(query){const words=q.split(' ').filter(w=>w.length>3);const found=(window.ASAP_SITE_INDEX?.pages||[]).map(p=>({...p,score:words.filter(w=>norm(p.title).includes(w)).length})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,3);found.forEach(p=>link(p.title,p.url));link(tr('Contact ASAP','Contactar a ASAP'),'https://asapworksforme.com/contact-us/');}
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;$('chatChoices').append(b);};
 button(tr('Return to my application','Volver a mi solicitud'),()=>{companyHelp=false;render();});
 if(!query)topics.forEach(t=>button(lang==='es'?t.esTitle:t.enTitle,()=>showCompanyHelp(t.id==='apply'?'application':t.id==='contact'?'contact':t.id==='requirements'?'requirements':t.id==='resources'?'resources':t.id==='employers'?'employer':t.id==='pay'?'payroll':t.id==='about'?'about':t.id==='privacy'?'privacy':t.id==='hours'?'hours':'jobs')));
 if(!query){arrangeStep();$('chatChoiceHint').hidden=true;}
 currentQuestion+=' '+tr('What else would you like to know, or would you like to return to your application?','¿Qué más desea saber, o quiere volver a su solicitud?');speak(currentQuestion);
}
function render(){
 if(companyHelp){showCompanyHelp();return;}
 choices=[];$('chatMessages').replaceChildren();$('chatChoices').replaceChildren();$('chatInput').value='';$('chatInput').disabled=false;$('chatSend').disabled=false;$('chatBack').disabled=!history.length;$('chatStatus').textContent='';
 let box;
 switch(state){
 case 'welcome':
 ask(tr('Hi, I’m ASAP’s virtual recruiting assistant. I can help you explore jobs that fit your experience and location. You can type your answers or tap the microphone to speak. Turn on “Read questions aloud” if you’d like me to speak, too. Review the options provided and answer with one of them. You can click an option, type it or say it using the microphone. How would you like to get started? Would you like to call a recruiter, fill out the application yourself or answer a few questions with me?','Hola, soy la asistente virtual de reclutamiento de ASAP. Puedo ayudarle a explorar empleos según su experiencia y ubicación. Puede escribir sus respuestas o tocar el micrófono para hablar. Active “Leer preguntas en voz alta” si desea escucharme. Revise las opciones y responda con una de ellas. Puede seleccionar una opción, escribirla o decirla usando el micrófono. ¿Cómo le gustaría comenzar? ¿Prefiere llamar a un reclutador, completar la solicitud por su cuenta o responder unas preguntas conmigo?'));
 const call=document.createElement('a');call.href='tel:+15015372727';call.textContent=tr('Call ASAP: 501-537-2727 (Little Rock)','Llamar a ASAP: 501-537-2727 (Little Rock)');$('chatChoices').append(call);
 option('Fill out the form myself','Completar el formulario por mi cuenta','form',()=>{close();window.ASAP_FORM.open();});
 const linked=window.ASAP_FORM.getJob();
 if(linked&&(new URLSearchParams(location.search).has('job_id')||new URLSearchParams(location.search).get('campaign')==='facebook-forklift')){
 ask(tr('Your link points to '+nice(linked.title)+' in '+nice(linked.location)+'. Is that where you want to work?','Su enlace corresponde a '+title(linked)+' en '+nice(linked.location)+'. ¿Quiere trabajar allí?'));
 option('Explore this job','Explorar este puesto','ad',()=>{p.location=linked.location;p.category=category(linked);selectJob(linked.id);});}
 option('Help me find a job','Ayúdeme a encontrar trabajo','discover',()=>profileNext(),'',['start','begin','empezar','buscar trabajo']);break;
 case 'location':ask(tr('Where would you like to work? Choose a location with listed jobs.','¿Dónde le gustaría trabajar? Elija un lugar con puestos anunciados.'));locations.forEach(l=>option(nice(l),nice(l),l,null,'',l==='ROUND ROCK/PFLUGERVILLE'?['Round Rock','Pflugerville']:[]));option('My location is not listed','Mi ubicación no aparece','unlisted',()=>go('unlisted'));break;
 case 'unlisted':ask(tr('I only have listings for the locations shown. A recruiter can help with other areas. Would you like to explore a listed location?','Solo tengo anuncios para los lugares indicados. Un reclutador puede ayudar con otras áreas. ¿Quiere explorar uno de los lugares disponibles?'));option('Explore listed locations','Explorar lugares disponibles','location',()=>go('location'));break;
 case 'category':ask(tr('What kind of work interests you? It is fine to be open to several options.','¿Qué tipo de trabajo le interesa? Puede estar abierto a varias opciones.'));data.categories.forEach(c=>option(c[1],c[2],c[0],null,'',c[0]==='warehouse'?['forklift','montacargas','warehouse']:[]));break;
 case 'experience':ask(tr('How much experience do you have in that kind of work?','¿Cuánta experiencia tiene en ese tipo de trabajo?'));enumOptions('experience');break;
 case 'skills':ask(tr('Tell me about work you have done, equipment you have used or skills you want to bring. If this would be your first job, say so.','Cuénteme sobre sus trabajos, equipos que ha usado o habilidades que puede aportar. Si sería su primer empleo, dígamelo.'));break;
 case 'shift':ask(tr('Which shift works for you? I will keep this preference for the recruiter.','¿Qué turno le conviene? Guardaré su preferencia para el reclutador.'));enumOptions('shift');break;
 case 'type':ask(tr('What type of employment are you looking for?','¿Qué tipo de empleo busca?'));enumOptions('type');break;
 case 'startAvailability':ask(tr('When could you start?','¿Cuándo podría comenzar?'));enumOptions('startAvailability');break;
 case 'desiredPay':ask(tr('What hourly pay are you looking for? Enter a dollar amount, or choose “Discuss with recruiter.” Pay is not available in this catalog.','¿Qué pago por hora busca? Escriba una cantidad en dólares o elija “Hablar con el reclutador”. Este catálogo no incluye salarios.'));option('Discuss with recruiter','Hablar con el reclutador','',()=>handle(''));break;
 case 'results':jobOptions();break;
 case 'jobOverview':
 box=ask(title(selected)+' · '+nice(selected.location)+'\n\n'+data.summaries[selected.id][lang==='es'?1:0]);showRequirements(box);
 option('Review this role with me','Revisar este puesto conmigo','continue',()=>{if(selected.requirements_note){go('unclear');}else qualify();});option('Explore another position','Explorar otro puesto','other',()=>{p.declined=[...(p.declined||[]),selected.id];profileNext();});break;
 case 'check':{const c=data.checks[selected.id][checkIndex];ask(c[lang==='es'?2:1]);yesNo(()=>{record(c[1],'yes');checkIndex++;qualify();},()=>{record(c[1],'no');noFit();},()=>{record(c[1],'needs_recruiter_clarification');go('unclear');});break;}
 case 'requirements':
 box=ask(tr('Can you meet the minimum requirements for this role, including its job duties? Items marked “preferred” are not mandatory. If you need clarification or want to discuss support for a duty, choose “Talk to a recruiter.” Do not share medical information.','¿Puede cumplir los requisitos mínimos de este puesto, incluidas sus tareas? Los puntos marcados como “preferidos” no son obligatorios. Si necesita aclaración o apoyo para una tarea, elija “Hablar con un reclutador”. No comparta información médica.')+'\n\n'+data.summaries[selected.id][lang==='es'?1:0]);showRequirements(box);
 yesNo(()=>{p.requirements=true;go('certifications');},()=>{p.requirements=false;noFit();},()=>{p.requirements=null;go('unclear');});break;
 case 'certifications':ask(/FORKLIFT|WAREHOUSE|ORDER SELECTOR/.test(selected.title)?tr('What forklift training or certification do you hold, if any? Include the equipment type and when you trained. Do not include ID numbers. This answer goes to a recruiter; a certificate is not an automatic requirement unless the listing says so.','¿Qué formación o certificación de montacargas tiene? Indique el tipo de equipo y cuándo recibió formación. No incluya números de identificación. Un reclutador revisará la respuesta; el certificado solo es obligatorio si el anuncio lo indica.'):tr('What relevant training, licenses or certifications do you hold? Include the type only, no ID numbers.','¿Qué formación, licencias o certificaciones relacionadas tiene? Indique solo el tipo, sin números de identificación.'));option('None currently','Ninguna actualmente','None currently');option('Discuss with recruiter','Hablar con el reclutador','Need to discuss');break;
 case 'transportation':ask(tr('This job is in '+nice(selected.location)+'. Can you reliably get to that location for work?','Este trabajo está en '+nice(selected.location)+'. ¿Puede llegar de forma confiable para trabajar?'));enumOptions('transportation');break;
 case 'role':{const item=window.ASAP_FORM.questions(selected)[roleIndex];ask(roleQuestion(item));if(item.options)item.options.forEach((o,i)=>option(o,roleOption(o),o));break;}
 case 'interview':{const qs=data.interview[category(selected)]||data.interview.production;if(interviewIndex>=qs.length){profileNextAfterRole();return;}ask(tr('A short question for your recruiter. ','Una pregunta breve para su reclutador. ')+qs[interviewIndex][lang==='es'?1:0]+tr(' A new worker can explain what they would do.',' Si es nuevo en este trabajo, puede explicar qué haría.'));option('Discuss this with a recruiter','Hablar de esto con un reclutador','Need to discuss');break;}
 case 'redirect':ask(tr('Based on your answers, this position may not be the right fit right now. Other positions may fit your experience. Can I ask a few questions to help you explore those options?','Según sus respuestas, este puesto podría no ser adecuado en este momento. Otros puestos podrían encajar con su experiencia. ¿Puedo hacerle unas preguntas para explorar otras opciones?'));option('Yes, show me other options','Sí, mostrar otras opciones','yes',()=>{p.showAll=false;profileNext();});option('I would rather talk to a recruiter','Prefiero hablar con un reclutador','human',()=>go('unclear'));break;
 case 'unclear':ask(tr('An ASAP recruiter can help clarify this. I will not mark you as meeting a requirement you are unsure about. Call the Little Rock recruiter line below, or explore other positions.','Un reclutador de ASAP puede aclarar esto. No marcaré como cumplido un requisito sobre el que tiene dudas. Llame a la línea de Little Rock abajo o explore otros puestos.'));option('Explore other positions','Explorar otros puestos','other',()=>{p.declined=[...new Set([...(p.declined||[]),selected?.id].filter(Boolean))];p.showAll=false;profileNext();});option('Review this role again','Revisar este puesto otra vez','again',()=>selected?selectJob(selected.id):profileNext());break;
 case 'firstName':ask(tr('What is your first name? Use sample details in this concept.','¿Cuál es su nombre? Use datos de ejemplo en este concepto.'));break;
 case 'lastName':ask(tr('What is your last name?','¿Cuál es su apellido?'));break;
 case 'phone':ask(tr('What phone number can a recruiter use? Please check all 10 digits after dictating.','¿A qué número puede llamar un reclutador? Verifique los 10 dígitos después de dictar.'));break;
 case 'email':ask(tr('What email address should the confirmation use? Please check the spelling after dictating.','¿Qué correo electrónico desea usar? Verifique cómo está escrito después de dictar.'));break;
 case 'city':ask(tr('What city do you live in? This can differ from your preferred work location.','¿En qué ciudad vive? Puede ser distinta del lugar donde desea trabajar.'));break;
 case 'state':ask(tr('What state do you live in? You may type another U.S. state.','¿En qué estado vive? Puede escribir otro estado de EE. UU.'));option('Arkansas','Arkansas','AR');option('Texas','Texas','TX');break;
 case 'zip':ask(tr('What is your ZIP code?','¿Cuál es su código postal?'));break;
 case 'review':renderReview();break;
 }
 if(state==='results')currentQuestion=tr('Review the positions shown. Choose a role to review its requirements, explore other kinds of work or choose another location.','Revise los puestos mostrados. Elija uno para revisar sus requisitos, explore otros tipos de trabajo o elija otro lugar.');
 if(state==='review')currentQuestion=tr('Review your contact details and answers on the screen. You can edit them before creating the application preview. No information has been sent.','Revise sus datos de contacto y respuestas en la pantalla. Puede editarlos antes de crear la vista previa. No se ha enviado información.');
 currentQuestion=responsePrompt(currentQuestion);
 arrangeStep();
 speak(currentQuestion);
}
function arrangeStep(){
 $('chatChoiceHint').hidden=choices.length===0;
 $('chatChoiceHint').textContent=tr('Review the options below and answer with one of them. Click an option, type it or tap the microphone to say it.','Revise las opciones de abajo y responda con una de ellas. Seleccione una opción, escríbala o toque el micrófono para decirla.');
 const nodes=[...$('chatChoices').children],nav=$('chatPages');nav.replaceChildren();nav.hidden=nodes.length<=4;
 let page=0;const pages=Math.ceil(nodes.length/4);
 function draw(){nodes.forEach((n,i)=>{n.hidden=Math.floor(i/4)!==page;});nav.replaceChildren();if(pages<=1)return;
 const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
 prev.type=next.type='button';prev.textContent=tr('Back','Atrás');next.textContent=tr('More options','Más opciones');prev.disabled=page===0;next.disabled=page===pages-1;count.textContent=(page+1)+' / '+pages;
 prev.onclick=()=>{page--;draw();};next.onclick=()=>{page++;draw();};nav.append(prev,count,next);}
 draw();
}
function enumOptions(k){enums[k].forEach(v=>option(v[0],v[1],v[0]));}
function roleQuestion(q){const map={license_class:'¿Qué clase de licencia de conducir tiene actualmente?',vehicle_experience:'¿Qué vehículos ha conducido para trabajar?',equipment_experience:'¿Qué equipos de almacén ha usado?',warehouse_tasks:'¿Qué tareas de almacén ha realizado?',maintenance_experience:'¿Qué equipos o sistemas ha mantenido o reparado?',electrical_mechanical_years:'¿Cuánta experiencia eléctrica o mecánica pesada tiene?',technical_equipment:'¿Qué máquinas, procesos de soldadura o herramientas ha usado?',technical_training:'¿Qué formación o certificaciones relacionadas tiene?',office_systems:'¿Qué programas o sistemas empresariales ha usado?',office_tasks:'¿Qué tareas de este puesto ha realizado?',relevant_tasks:'¿Con qué tareas o equipos se siente más cómodo?'};return lang==='es'?map[q.id]||q.label:q.label;}
function roleOption(s){return {'Standard / non-CDL':'Estándar / no CDL','Class A CDL':'CDL Clase A','Class B CDL':'CDL Clase B','Class C CDL':'CDL Clase C','No current license':'Sin licencia vigente','Other / need to discuss':'Otro / necesito hablarlo','None yet':'Ninguna todavía','Less than 1 year':'Menos de 1 año','1-3 years':'1 a 3 años','4+ years':'4 años o más','Need to discuss':'Necesito hablarlo'}[s]||s;}
function profileNextAfterRole(){const missing=profileSteps.find(k=>p[k]===undefined);if(missing){p.afterRole=true;go(missing);}else contactNext();}
function renderReview(){
 const box=ask(tr('Here is what we prepared for '+title(selected)+'. Check your contact details and answers. You can edit them before creating the preview. No information has been sent.','Esto es lo que preparamos para '+title(selected)+'. Revise sus datos y respuestas. Puede editarlos antes de crear la vista previa. No se ha enviado información.'));
 for(const key of [...profileSteps,'certifications','transportation',...contactSteps]){const row=document.createElement('span');row.className='chat-review-row';row.textContent=label(key)+': '+(displayValue(key,p[key])||tr('Discuss with recruiter','Hablar con el reclutador'));const b=document.createElement('button');b.type='button';b.textContent=tr('Edit','Editar');b.onclick=()=>{save();editing=key;go(key);};row.append(b);box.append(row);}
 for(const [i,a] of p.roleAnswers.entries()){const row=document.createElement('span');row.className='chat-review-row';row.textContent=(lang==='es'?roleQuestion(window.ASAP_FORM.questions(selected)[i]):a.question)+': '+a.answer;const b=document.createElement('button');b.type='button';b.textContent=tr('Edit','Editar');b.onclick=()=>{save();editing='role';roleIndex=i;go('role');};row.append(b);box.append(row);}
 for(const [i,a] of p.interviews.entries()){const row=document.createElement('span');row.className='chat-review-row';row.textContent=a.question+': '+a.answer;const b=document.createElement('button');b.type='button';b.textContent=tr('Edit','Editar');b.onclick=()=>{save();editing='interview';interviewIndex=i;go('interview');};row.append(b);box.append(row);}
 option('Fill my quick-apply form','Completar mi formulario','fill',()=>transfer(false));option('Confirm and create application preview','Confirmar y crear vista previa','submit',()=>transfer(true));
}
function validText(v){return typeof v==='string'&&v.trim().length>0&&v.length<=1500;}
function handle(v){
 if(profileSteps.includes(state)){
 if(state==='desiredPay'&&v!==''&&(!/^\$?\d+(\.\d{1,2})?$/.test(v)||Number(v.replace('$',''))>1000)){error(tr('Enter an amount from 0 to 1000, or choose “Discuss with recruiter.”','Escriba una cantidad de 0 a 1000 o elija “Hablar con el reclutador”.'));return;}
 p[state]=state==='desiredPay'?v.replace('$',''):v;
 if(editing){const changed=editing;editing=null;if(['location','category','type'].includes(changed)){p.showAll=false;p.afterRole=false;go('results');}else go('review');}
 else if(p.afterRole)profileNextAfterRole();else profileNext();return;
 }
 if(state==='certifications'){p.certifications=v.slice(0,300);if(editing){editing=null;go('review');}else go('transportation');return;}
 if(state==='transportation'){p.transportation=v;if(v==='No'){noFit();return;}if(v==='Need to discuss'){go('unclear');return;}if(editing){editing=null;go('review');}else roleNext();return;}
 if(state==='role'){const q=window.ASAP_FORM.questions(selected)[roleIndex];p.roleAnswers[roleIndex]={question_id:q.id,question:q.label,answer:v};roleIndex++;if(editing){editing=null;go('review');}else roleNext();return;}
 if(state==='interview'){const q=(data.interview[category(selected)]||data.interview.production)[interviewIndex];p.interviews[interviewIndex]={question:q[lang==='es'?1:0],question_en:q[0],answer:v,language:lang};interviewIndex++;if(editing){editing=null;go('review');}else go('interview');return;}
 if(contactSteps.includes(state)){
 let val=String(v).trim();
 if(['firstName','lastName','city','state'].includes(state)&&val.length>80){error(tr('Please keep this answer under 80 characters.','Use menos de 80 caracteres.'));return;}
 if(state==='phone'){val=val.replace(/\D/g,'');if(val.length===11&&val[0]==='1')val=val.slice(1);if(val.length!==10){error(tr('Please enter a 10-digit U.S. phone number.','Ingrese un teléfono de EE. UU. de 10 dígitos.'));return;}}
 if(state==='email'){val=val.replace(/\s+(at|arroba)\s+/gi,'@').replace(/\s+(dot|punto)\s+/gi,'.').replace(/\s/g,'').toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)||val.length>254){error(tr('Please check the email address. For example: alex@example.com.','Revise el correo electrónico. Por ejemplo: alex@example.com.'));return;}}
 if(state==='zip'){val=val.replace(/\s/g,'');if(!/^\d{5}(-\d{4})?$/.test(val)){error(tr('Please enter a valid ZIP code, such as 72032.','Ingrese un código postal válido, como 72032.'));return;}}
 p[state]=val;if(editing){editing=null;go('review');}else contactNext();return;
 }
 error(tr('Please choose one of the options shown.','Elija una de las opciones mostradas.'));
}
function error(s){$('chatStatus').textContent=s;message(s);}
function clarifyAnswer(text){
 stopVoice();$('chatMessages').replaceChildren();message(text,true);
 const needs={
  welcome:['To get started, I need to know how you would like help: use the form yourself or explore jobs with me. You can also use the call button to speak with a recruiter.','Para comenzar, necesito saber cómo prefiere recibir ayuda: completar el formulario o explorar empleos conmigo. También puede usar el botón de llamada para hablar con un reclutador.'],
  location:['To show the right openings, I need the location where you want to work. If it is not shown, choose “My location is not listed.”','Para mostrarle las vacantes adecuadas, necesito saber dónde quiere trabajar. Si no aparece, elija “Mi ubicación no aparece”.'],
  category:['To narrow down the openings, I need one kind of work to start with. We can explore other kinds afterward.','Para reducir las opciones, necesito un tipo de trabajo para comenzar. Después podemos explorar otros.'],
  experience:['For this step, I need roughly how much experience you have in that kind of work. Choose the closest experience range shown. You can describe your background in the next question.','En este paso, necesito saber aproximadamente cuánta experiencia tiene en ese tipo de trabajo. Elija el rango más cercano. En la siguiente pregunta puede describir su experiencia.'],
  shift:['To record your availability, I need the shift that works best for you. Choose the closest option shown.','Para registrar su disponibilidad, necesito saber qué turno le conviene más. Elija la opción más cercana.'],
  type:['To narrow down the openings, I need the type of employment you want. Choose one of the employment options shown.','Para reducir las opciones, necesito saber qué tipo de empleo busca. Elija una de las opciones mostradas.'],
  startAvailability:['To help the recruiter plan, I need to know when you could start. Choose the closest option shown.','Para ayudar al reclutador a planificar, necesito saber cuándo podría comenzar. Elija la opción más cercana.'],
  results:['To continue, I need to know which listed job you want to explore. You can use its name or number, or choose another location.','Para continuar, necesito saber qué puesto anunciado quiere explorar. Puede usar su nombre o número, o elegir otro lugar.'],
  check:['For this requirement, I need a clear yes or no. If your answer depends on the details, choose “Talk to a recruiter” so someone can help clarify.','Para este requisito, necesito un sí o un no claro. Si su respuesta depende de los detalles, elija “Hablar con un reclutador” para aclararlo.'],
  requirements:['To continue with this role, I need to know whether you can meet its listed minimum requirements. You can answer yes, no or ask a recruiter to clarify.','Para continuar con este puesto, necesito saber si puede cumplir los requisitos mínimos anunciados. Puede responder sí, no o pedir una aclaración al reclutador.'],
  transportation:['For this step, I need to know whether you can reliably get to the work location. You can answer yes, no or choose to discuss it with a recruiter.','En este paso, necesito saber si puede llegar al lugar de trabajo de forma confiable. Puede responder sí, no o hablarlo con un reclutador.']
 };
 const detail=needs[state]||['I need one choice for this step before we continue. The options below show the next steps I can help with.','Necesito una opción para este paso antes de continuar. Las opciones de abajo muestran cómo puedo ayudarle.'];
 const examples=choices.slice(0,2).map(c=>'“'+c.label+'”').join(tr(' or ',' o '));
 currentQuestion=tr('Thank you for explaining. I have kept your response in this conversation. ','Gracias por explicarlo. Su respuesta queda en esta conversación. ')+tr(...detail)+' '+tr('Which option fits best? You can say or select ','¿Qué opción le corresponde mejor? Puede decir o seleccionar ')+examples+'.';
 message(currentQuestion);$('chatStatus').textContent=tr('Your answer is above. Please choose the closest option, or use the recruiter call link.','Su respuesta aparece arriba. Elija la opción más cercana o use el enlace para llamar al reclutador.');
 arrangeStep();
 speak(currentQuestion);
}
function answerMatchText(value){
 let text=norm(value);
 if(state==='experience'){
  const numbers={one:'1',two:'2',three:'3',four:'4',five:'5',uno:'1',un:'1',dos:'2',tres:'3',cuatro:'4',cinco:'5'};
  text=text.replace(/\b(one|two|three|four|five|uno|un|dos|tres|cuatro|cinco)\b/g,w=>numbers[w]);
  text=text.replace(/(\d+)\s+(?:to|through|a|hasta)\s+(\d+)/g,'$1 $2');
 }
 return text;
}
function submitText(e){e.preventDefault();const text=$('chatInput').value.trim();if(companyHelp){if(text)showCompanyHelp(text);return;}if(/^(what|when|where|how|does|is|can|do|who|que|cuando|donde|como)\b/i.test(norm(text))&&/\b(asap|payroll|paid|office|offices|privacy|nomina|oficina|oficinas)\b/.test(norm(text))){showCompanyHelp(text);return;}if(!validText(text))return;
 if(choices.length){let hits=choices.filter(c=>c.aliases.some(a=>answerMatchText(a)===answerMatchText(text)));if(!hits.length){
 const normalized=answerMatchText(text);
 // Do not treat a preference mentioned in a denial or qualification as an answer.
 const qualified=/\b(no|not|never|cannot|can t|don t|do not|but|except|maybe|unsure|depends|pero|excepto|quizas|depende|ni)\b/.test(normalized);
 if(!qualified&&!['check','requirements','transportation'].includes(state))hits=choices.filter(c=>c.aliases.some(a=>{const phrase=answerMatchText(a);return phrase.length>3&&(' '+normalized+' ').includes(' '+phrase+' ');}));
 }
 if(hits.length===1){accept(text,hits[0].value,hits[0].action);return;}
 const free=['certifications','desiredPay','state','interview'].includes(state);
 if(!free){clarifyAnswer(text);return;}}
 accept(text,text);
}
function transfer(submit){
 if(!selected||p.requirements!==true||p.transportation!=='Yes'){go('unclear');return;}
 const fields={};for(const k of ['experience','skills','shift','startAvailability','desiredPay','certifications','transportation',...contactSteps])fields[k]=p[k]||'';
 if(!['AR','TX'].includes(fields.state)){fields.otherState=fields.state;fields.state='other';}
 const chat={version:'asap.recruiter_chat.v1',language:lang,input_mode:usedVoice?'voice_and_text':'text',entry_mode:new URLSearchParams(location.search).has('job_id')||new URLSearchParams(location.search).has('campaign')?'job_link':'general_visit',job_id:selected.id,catalog_snapshot:window.ASAP_JOBS.retrieved_at,screening_status:'candidate_self_report_recruiter_review_required',requirement_answers:answers,interview_answers:p.interviews,preferences:{location:p.location,category:p.category,job_type:p.type,shift:p.shift},declined_job_ids:p.declined||[],voice_consent:voiceAllowed,transcript:structuredClone(transcript)};
 window.ASAP_FORM.selectJob(selected.id);window.ASAP_FORM.fill(fields,p.roleAnswers,chat);close();
 if(submit)$('applyForm').requestSubmit();
}
function localize(){
 $('recruiterChat').lang=lang;
 $('companyHelp').textContent=tr('Ask about ASAP','Preguntar sobre ASAP');
 const map={chatTitle:['ASAP Job Seeking Assistant','Asistente de búsqueda de empleo ASAP'],chatSubtitle:['Virtual recruiting assistant','Asistente virtual de reclutamiento'],languageLabel:['Language','Idioma'],voiceLabel:['Voice','Voz'],readAloudLabel:['Read questions aloud','Leer preguntas en voz alta'],repeatQuestion:['Hear again','Escuchar de nuevo'],chatDemo:['Concept: use sample details. Nothing is sent to ASAP.','Concepto: use datos de ejemplo. No se envía nada a ASAP.'],chatInputLabel:['Your answer','Su respuesta'],chatMic:['Use microphone','Usar micrófono'],chatSend:['Send answer','Enviar respuesta'],chatBack:['Previous question','Pregunta anterior'],chatRestart:['Start over','Empezar de nuevo'],humanRecruiter:['Call 501-537-2727','Llamar al 501-537-2727'],voiceTitle:['Use voice input?','¿Usar entrada de voz?'],voiceNotice:['Your browser may send audio to its speech service to turn it into text. This concept does not save audio. You can edit the words before sending them, or keep typing.','Su navegador puede enviar audio a su servicio de voz para convertirlo en texto. Este concepto no guarda audio. Puede editar las palabras antes de enviarlas o seguir escribiendo.'],allowVoice:['Use microphone','Usar micrófono'],cancelVoice:['Keep typing','Seguir escribiendo']};for(const[id,v]of Object.entries(map))$(id).textContent=v[lang==='es'?1:0];
 $('chatInput').placeholder=tr('Type here or use the microphone','Escriba aquí o use el micrófono');$('closeChat').ariaLabel=tr('Close chat','Cerrar chat');$('chatChoices').ariaLabel=tr('Suggested answers','Respuestas sugeridas');
 const supported=!!(window.SpeechRecognition||window.webkitSpeechRecognition);$('chatMic').disabled=!supported;
 if(!supported)$('chatStatus').textContent=tr('Voice input is unavailable in this browser. Please type your answers.','La entrada de voz no está disponible en este navegador. Escriba sus respuestas.');
 refreshVoices();$('chatVoice').setAttribute('aria-label',tr('Speaking voice','Voz del asistente'));
 $('readAloud').disabled=!('speechSynthesis' in window)&&!window.ASAP_SAVED_AUDIO?.available(lang);$('repeatQuestion').disabled=$('readAloud').disabled;
}
function listen(){
 if(listening){recognizer?.stop();return;}window.ASAP_SAVED_AUDIO?.stop();window.speechSynthesis?.cancel();
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){error(tr('Please type; this browser does not support voice input.','Escriba; este navegador no admite entrada de voz.'));return;}
 const r=new SR();recognizer=r;r.lang=lang==='es'?'es-US':'en-US';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
 r.onstart=()=>{listening=true;$('chatMic').setAttribute('aria-pressed','true');$('chatMic').textContent=tr('Stop listening','Dejar de escuchar');$('chatStatus').textContent=tr('Listening. Your words will appear below for review before you send.','Escuchando. Sus palabras aparecerán para revisarlas antes de enviarlas.');};
 r.onresult=e=>{const s=Array.from(e.results).map(x=>x[0].transcript).join(' ');$('chatInput').value=($('chatInput').value+' '+s).trim().slice(0,1500);usedVoice=true;$('chatStatus').textContent=tr('Review or edit your words, then send your answer.','Revise o edite sus palabras y envíe su respuesta.');$('chatInput').focus();};
 r.onerror=e=>{const denied=['not-allowed','service-not-allowed'].includes(e.error);$('chatStatus').textContent=denied?tr('Microphone access was not allowed. You can keep typing.','No se permitió el micrófono. Puede seguir escribiendo.'):tr('Voice input could not finish. Try again or type your answer.','La entrada de voz no terminó. Intente otra vez o escriba.');};
 r.onend=()=>{listening=false;recognizer=null;$('chatMic').textContent=tr('Use microphone','Usar micrófono');$('chatMic').setAttribute('aria-pressed','false');};try{r.start();}catch{error(tr('Could not start the microphone. Please type or try again.','No se pudo iniciar el micrófono. Escriba o intente otra vez.'));}
}
function open(){if(!$('recruiterChat').open)$('recruiterChat').showModal();$('chatLauncher').setAttribute('aria-expanded','true');if(!transcript.length)render();localize();$('chatInput').focus();}
function close(){stopVoice();$('recruiterChat').close();$('chatLauncher').setAttribute('aria-expanded','false');}
$('openRecruiter').onclick=open;$('chatLauncher').onclick=open;$('closeChat').onclick=close;$('recruiterChat').addEventListener('cancel',()=>{stopVoice();$('chatLauncher').setAttribute('aria-expanded','false');});
$('chatForm').onsubmit=submitText;
$('companyHelp').onclick=()=>showCompanyHelp();
$('chatLanguage').onchange=()=>{stopVoice();lang=$('chatLanguage').value;localize();if(transcript.length)render();};
$('readAloud').onchange=()=>{if($('readAloud').checked)speak(currentQuestion);else {window.ASAP_SAVED_AUDIO?.stop();window.speechSynthesis?.cancel();}};$('repeatQuestion').onclick=()=>{$('readAloud').checked=true;speak(currentQuestion);};
$('chatMic').onclick=()=>{if(!voiceAllowed){$('voiceConsent').showModal();}else listen();};$('allowVoice').onclick=()=>{voiceAllowed=true;$('voiceConsent').close();listen();};$('cancelVoice').onclick=()=>$('voiceConsent').close();
$('chatBack').onclick=()=>{stopVoice();const prev=history.pop();if(!prev)return;({state,p,answers,checkIndex,roleIndex,interviewIndex,editing}=prev);selected=catalog.find(j=>j.id===prev.selected)||null;transcript=transcript.slice(0,prev.transcriptLength);$('chatMessages').replaceChildren();const restored=[...transcript];transcript=[];restored.forEach(m=>message(m.text,m.speaker==='candidate'));render();};
$('chatRestart').onclick=()=>{companyHelp=false;stopVoice();p={};selected=null;answers=[];history=[];transcript=[];editing=null;checkIndex=roleIndex=interviewIndex=0;usedVoice=false;window.ASAP_CHAT_SUBMISSION=null;$('chatMessages').replaceChildren();go('welcome');};
$('chatVoice').onchange=()=>{selectedVoices[lang]=$('chatVoice').value;if($('readAloud').checked)speak(currentQuestion);};
window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{refreshVoices();if(waitingForVoice&&$('recruiterChat').open&&$('readAloud').checked)speak(currentQuestion);});
window.addEventListener('pagehide',stopVoice);localize();
if(new URLSearchParams(location.search).get('chat')==='open')open();
})();
