const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
let now=new Date('2026-10-28T15:00:00').getTime();
const windows=[];
function boot(saved, demo=false){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('HTMLCanvasElement'))errors.push(e.message);});
 const d=new JSDOM(html,{url:'https://local.test/index.html'+(demo?'?demo=1':''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  const D=w.Date; w.Date=class extends D{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
  if(saved)w.localStorage.setItem('retentionApp_v3',JSON.stringify(saved));
 }});windows.push(d.window);
 assert.deepEqual(errors,[],'Application must boot without script errors');
 assert.ok(d.window.__prsDebug,'debug API available after initialization');return d.window;
}
function run(name,fn){fn();console.log('PASS '+name);}
const state=w=>w.__prsDebug.getState(), qs=(w,s)=>w.document.querySelector(s);
try{
run('Blank first run offers daily logging and a quick subject form',()=>{const w=boot();assert.equal(state(w).subjects.length,0);assert.ok(!qs(w,'#quickSetup').classList.contains('hidden'));assert.equal(qs(w,'section.active').dataset.tab,'timer');});
run('Demo is isolated from the real study-data key',()=>{const w=boot(null,true);assert.equal(state(w).subjects.length,3);assert.equal(w.localStorage.getItem('retentionApp_v3'),null);assert.equal(qs(w,'#todayMinutes').textContent,'1h 45m');});
let saved;
run('Batch logging supports a historical date, multiple subjects and undo',()=>{const w=boot();const a=w.__prsDebug.addSubject('Physics'),b=w.__prsDebug.addSubject('Biology');qs(w,'#logDate').value='2026-10-26';qs(w,'.log-hours').value='1';qs(w,'.log-minutes').value='20';qs(w,'#addLogRow').click();const rows=w.document.querySelectorAll('.day-log-row');rows[1].querySelector('select').value=b.id;rows[1].querySelector('.log-minutes').value='45';qs(w,'#dayLogForm').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(state(w).flowSessions.length,2);assert.equal(state(w).flowSessions.reduce((a,x)=>a+x.minutes,0),125);assert.ok(state(w).flowSessions.every(x=>x.date==='2026-10-26'));assert.equal(qs(w,'#todayMinutes').textContent,'2h 05m');qs(w,'#reviewSessionBtn').click();assert.equal(state(w).flowSessions.length,0);saved=state(w);});
run('Empty, future-date and over-24-hour batches are rejected',()=>{const w=boot(saved);const f=qs(w,'#dayLogForm');f.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(state(w).flowSessions.length,0);qs(w,'.log-hours').value='25';f.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(state(w).flowSessions.length,0);qs(w,'.log-hours').value='1';qs(w,'#logDate').value='2026-10-29';f.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(state(w).flowSessions.length,0);});
let active,completed;
run('Starting focus persists the subject, topic and timestamp',()=>{const w=boot(saved);w.__prsDebug.addUnit(state(w).subjects[0].id,'Motion');qs(w,'#releaseUnit').value=state(w).subjects[0].units[0].id;w.__prsDebug.startFocus();active=state(w);assert.equal(active.activeTimer.subjectName,'Physics');assert.ok(active.activeTimer.unitId);assert.equal(active.activeTimer.startedAt,now);assert.ok(qs(w,'.log-subject'));assert.ok(qs(w,'#subjectToggle button').disabled);});
run('Refresh restores elapsed focus and captures the original subject',()=>{now+=10*60*1000;active.currentSubjectId=active.subjects[1].id;const w=boot(active);assert.equal(qs(w,'#clockDisplay').textContent,'10:00');w.__prsDebug.endFocusStartBreak();completed=state(w);assert.equal(completed.flowSessions[0].subjectName,'Physics');assert.equal(completed.flowSessions[0].minutes,10);assert.equal(completed.activeTimer.phase,'break');assert.equal(completed.activeTimer.endsAt,now+120000);w.__prsDebug.endFocusStartBreak();assert.equal(state(w).flowSessions.length,1);});
run('Break uses an absolute deadline across refresh and throttled callbacks',()=>{now+=90000;const w=boot(completed);assert.equal(qs(w,'#clockDisplay').textContent,'00:30');now+=45000;w.__prsDebug.tick();assert.equal(state(w).activeTimer,null);assert.equal(qs(w,'#clockDisplay').textContent,'00:00');assert.equal(state(w).flowSessions.length,1);});
run('Legacy saves and earned companions survive migration',()=>{const w=boot({...saved,pet:{id:'cat',enabled:true,unlocked:['fox','cat','dog','bunny'],milestones:['h10']}});assert.equal(state(w).pet.id,'cat');assert.ok(state(w).pet.unlocked.includes('bunny'));assert.equal(state(w).subjects.length,2);});
run('Repeated review clicks cannot advance the ladder twice in one day',()=>{const w=boot(saved);const sid=state(w).subjects[0].id;const u=w.__prsDebug.addUnit(sid,'Motion');w.__prsDebug.markStudied(sid,u.id);w.__prsDebug.markStudied(sid,u.id);assert.equal(state(w).subjects[0].units[0].stage,0);});
run('Storage failure is visible and leaves in-memory data available',()=>{const w=boot(saved);w.Storage.prototype.setItem=function(){throw Error('Quota');};w.__prsDebug.save();assert.ok(!qs(w,'#storageNotice').classList.contains('hidden'));assert.equal(state(w).subjects.length,2);});
run('Space on unrelated buttons does not start the timer',()=>{const w=boot(saved);qs(w,'#addLogRow').dispatchEvent(new w.KeyboardEvent('keydown',{code:'Space',bubbles:true}));assert.equal(state(w).activeTimer,null);});
run('Quiet mode and reduced motion persist through reload',()=>{const w=boot(saved);qs(w,'#quietToggle').click();qs(w,'#motionToggle').click();const v=boot(state(w));assert.equal(state(v).pet.quiet,true);assert.ok(qs(v,'#petWrap').classList.contains('reduce-motion'));});
run('Malformed active timers are rejected during migration',()=>{const w=boot({...saved,activeTimer:{phase:'focus',id:'x',startedAt:now+100000,subjectId:'x',subjectName:'Test'}});assert.equal(state(w).activeTimer,null);});
console.log('13 checks passed.');
}catch(e){console.error(e);process.exitCode=1;}finally{windows.forEach(w=>w.close());}
