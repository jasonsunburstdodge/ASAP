// Build-only prompt export. Requires jsdom; never loads personal application data.
const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]*><\/script>/g,''),{url:'https://example.com/?entry=direct',runScripts:'outside-only'}),w=dom.window;
w.structuredClone=structuredClone;w.HTMLElement.prototype.scrollIntoView=function(){};
for(const f of ['jobs.js','app.js','recruiter-data.js'])w.eval(fs.readFileSync(path.join(root,f),'utf8'));
let src=fs.readFileSync(path.join(root,'recruiter.js'),'utf8');
const hook=`
window.capturePrompt=(stage,language,job,idx=0)=>{
 lang=language;state=stage;selected=job;p={location:job.location,category:category(job),type:'Any',roleAnswers:[],interviews:[]};checkIndex=roleIndex=interviewIndex=idx;transcript=[];$('chatMessages').replaceChildren();render();return currentQuestion;
};`;
src=src.replace(/\}\)\(\);\s*$/,hook+'\n})();');w.eval(src);
const map=new Map();
function capture(stage,language,job,idx=0){const text=w.capturePrompt(stage,language,job,idx);for(const segment of text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)){
 const key=language+'\n'+segment;if(map.has(key)){map.get(key).uses.push(stage+':'+job.id);continue;}
 const id=language+'-'+crypto.createHash('sha256').update(key).digest('hex').slice(0,16);
 map.set(key,{id,language,text:segment,spoken_text:segment.replace(/ASAP/g,'A S A P'),filename:id+'.mp3',uses:[stage+':'+job.id]});
}}
const jobs=w.ASAP_JOBS.jobs,data=w.ASAP_RECRUITER_DATA;
for(const language of ['en','es']){
 for(const stage of ['welcome','location','unlisted','category','experience','skills','shift','type','startAvailability','desiredPay','results','redirect','unclear','firstName','lastName','phone','email','city','state','zip','review'])capture(stage,language,jobs[0]);
 for(const job of jobs){
  for(const stage of ['jobOverview','requirements','certifications','transportation'])capture(stage,language,job);
  for(let i=0;i<(data.checks[job.id]||[]).length;i++)capture('check',language,job,i);
  for(let i=0;i<w.ASAP_FORM.questions(job).length;i++)capture('role',language,job,i);
  for(let i=0;i<2;i++)capture('interview',language,job,i);
  // Ad entry has a role-specific question. Capture without candidate information.
  dom.reconfigure({url:'https://example.com/?job_id='+job.id});w.ASAP_FORM.selectJob(job.id);capture('welcome',language,job);dom.reconfigure({url:'https://example.com/?entry=direct'});
 }
}
const prompts=[...map.values()];const payload={version:'asap.rachel.saved_audio.v1',voice_name:'Rachel',voice_id:'21m00Tcm4TlvDq8ikWAM',model_id:'eleven_multilingual_v2',status:'scripts_only_audio_not_generated',prompts};
fs.writeFileSync(path.join(root,'audio/prompts.json'),JSON.stringify(payload,null,2)+'\n');
for(const language of ['en','es'])fs.writeFileSync(path.join(root,'audio/prompts-'+language+'.txt'),prompts.filter(x=>x.language===language).map(x=>'FILE: '+x.filename+'\n'+x.spoken_text).join('\n\n--------------------\n\n')+'\n');
console.log(JSON.stringify({clips:prompts.length,english:prompts.filter(x=>x.language==='en').length,spanish:prompts.filter(x=>x.language==='es').length,spoken_characters:prompts.reduce((n,x)=>n+x.spoken_text.length,0)}));dom.window.close();
