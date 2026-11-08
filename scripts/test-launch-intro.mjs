// App-owned session/policy rules, real SSR markup and Motion integration.
// Motion owns native animation lifecycle; browser paint remains a separate gate.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useAnimate as actualUseAnimate } from 'motion/react-mini';
import { createRequire } from 'node:module';
const postcss = createRequire(import.meta.resolve('vite/package.json'))('postcss');

const source=await readFile('app/launch-intro.tsx','utf8');
const sceneSource=await readFile('app/launch-intro-scene.tsx','utf8');
function transpile(text){
 const ast=ts.createSourceFile('launch.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const body=ast.statements.filter(node=>!ts.isImportDeclaration(node)).map(node=>node.getText(ast).replace(/^export /,'')).join('\n');
 return ts.transpileModule(body,{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
}
function compile(scope,scene=false){return new Function(...Object.keys(scope),transpile(scene?sceneSource:source)+(scene?';return {IntroScene};':';return {LaunchIntro,claimLaunchIntro,consumeLaunchIntro,launchIntroEligible,LAUNCH_INTRO_KEY};'))(...Object.values(scope));}
class Events{
 listeners=new Map();
 addEventListener(type,fn,options){assert.equal(options.capture,true);assert.equal(options.passive,true);if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 emit(type,extra={}){const event={target:this,preventDefault(){assert.fail('Policy listeners must never consume underlying actions')},stopPropagation(){assert.fail('Policy listeners must not trap events')},...extra};for(const fn of this.listeners.get(type)||[])fn(event);}
 count(){return [...this.listeners.values()].reduce((sum,list)=>sum+list.size,0);}
}
function browser(){
 const window=new Events(),document=new Events(),stored=new Map();
 let age=100,paintTime=50,focused=true,printing=false,shell=true,writes=0;
 window.sessionStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>{writes++;stored.set(key,value)}};
 window.performance={now:()=>age,getEntriesByType:type=>{assert.equal(type,'paint');return paintTime===null?[]:[{name:'first-contentful-paint',startTime:paintTime}]}};window.navigator={userActivation:{hasBeenActive:false}};
 window.matchMedia=query=>{assert.equal(query,'print');return{matches:printing}};
 window.setTimeout=window.requestAnimationFrame=window.fetch=()=>assert.fail('Intro rules must not own animation timers, frames or network');
 document.hidden=false;document.hasFocus=()=>focused;document.querySelector=selector=>{assert.equal(selector,'.app.unified-dashboard.personal-workspace.personal-experience');return shell?{}:null;};
 return{window,document,stored,writes:()=>writes,age:value=>{age=value},paint:value=>{paintTime=value},focus:value=>{focused=value},print:value=>{printing=value},shell:value=>{shell=value}};
}
function hooks(env,initial={ready:false,enabled:false}){
 let cursor=0,policy=initial;const cells=[],effects=[],pending=[];
 const useState=initial=>{const index=cursor++;if(!cells[index])cells[index]={value:typeof initial==='function'?initial():initial};return[cells[index].value,value=>{cells[index].value=typeof value==='function'?value(cells[index].value):value;}];};
 const useRef=initial=>{const index=cursor++;return cells[index]??=( {current:initial} );};
 const useCallback=(fn,deps)=>{const index=cursor++,cell=cells[index];if(!cell||deps.some((value,i)=>!Object.is(value,cell.deps[i])))cells[index]={fn,deps};return cells[index].fn;};
 const useEffect=(callback,deps)=>{const index=cursor++,old=effects[index];if(!old||deps.some((value,i)=>!Object.is(value,old.deps[i])))pending.push(()=>{old?.cleanup?.();effects[index]={callback,deps,cleanup:callback()};});};
 const code=compile({React,lazy:()=>function LazyScene(){},Suspense:React.Suspense,useState,useRef,useCallback,useEffect,useWorkspaceMotion:()=>policy,useAnimate:()=>assert.fail('Parent must not create animation controls'),window:env.window,document:env.document});
 const render=()=>{cursor=0;const element=code.LaunchIntro();for(const effect of pending.splice(0))effect();return element;};
 return{...code,render,policy:next=>{policy=next},replay(){for(const effect of effects)effect?.cleanup?.();for(const effect of effects)if(effect)effect.cleanup=effect.callback();},dispose(){for(const effect of effects)effect?.cleanup?.();}};
}
function assertTerminal(env,run){
 assert.equal(run.render(),null);
 assert.equal(env.document.count()+env.window.count(),0,'Terminal intro leaves no layout-lifetime capture listeners');
 const writes=env.writes();
 for(const type of ['keydown','wheel','pointerdown'])env.document.emit(type);
 for(const type of ['blur','pagehide','pageshow'])env.window.emit(type,{persisted:true});
 assert.equal(env.writes(),writes,'Ordinary interaction after the intro does not write sessionStorage');
 run.replay();assert.equal(env.document.count()+env.window.count(),0,'StrictMode cannot reattach terminal listeners');
}
const env=browser(),run=hooks(env);
assert.equal(run.render(),null);assert.equal(env.stored.size,0,'SSR/hydration policy wait does not consume a decision');
run.replay();assert.equal(env.document.count()+env.window.count(),9,'StrictMode leaves only one listener set');
run.policy({ready:true,enabled:true});run.render();const scene=run.render();assert.equal(scene.type,React.Suspense);assert.deepEqual([...env.stored.values()],['1']);
run.replay();assert.equal(run.render().type,React.Suspense,'StrictMode does not suppress an already accepted entry');
run.policy({ready:true,enabled:false});run.render();assert.equal(run.render(),null);
run.policy({ready:true,enabled:true});run.render();assert.equal(run.render(),null,'Quiet then Expressive cannot replay');
assertTerminal(env,run);run.dispose();assert.equal(env.document.count()+env.window.count(),0);
const reload=hooks(env,{ready:true,enabled:true});reload.render();assert.equal(reload.render(),null,'Reload in this tab skips');assertTerminal(env,reload);reload.dispose();
const quietEnv=browser(),quiet=hooks(quietEnv,{ready:true,enabled:false});quiet.render();assert.equal(quiet.render(),null);assert.equal(quietEnv.stored.get(quiet.LAUNCH_INTRO_KEY),'1');quiet.policy({ready:true,enabled:true});quiet.render();assert.equal(quiet.render(),null,'First ready Quiet/reduced decision is consumed');assertTerminal(quietEnv,quiet);quiet.dispose();

for(const modify of [b=>b.age(2501),b=>b.focus(false),b=>b.print(true),b=>b.shell(false),b=>{b.document.hidden=true},b=>{b.window.navigator.userActivation.hasBeenActive=true},b=>b.age(NaN)]){
 const b=browser();modify(b);const h=hooks(b,{ready:true,enabled:true});h.render();assert.equal(h.render(),null);assert.equal(b.stored.get(h.LAUNCH_INTRO_KEY),'1','Skipped decisions are consumed');assertTerminal(b,h);h.dispose();
}
for(const modify of [b=>{b.age(2400);b.paint(100)},b=>b.paint(NaN),b=>b.paint(101),b=>{b.window.performance.getEntriesByType=()=>{throw new Error('Unavailable timing')}}]){
 const b=browser();modify(b);const h=hooks(b,{ready:true,enabled:true});h.render();assert.equal(h.render(),null,'An already-painted page or invalid timing must not receive a late cover');assertTerminal(b,h);h.dispose();
}
for(const paint of [2300,null]){
 const b=browser();b.age(2400);b.paint(paint);const h=hooks(b,{ready:true,enabled:true});h.render();assert.ok(h.render(),'A slow initial load may still reveal before its first paint or immediately after it');h.dispose();
}
for(const broken of ['getter','get','set','noPersistence']){
 const b=browser();if(broken==='getter')Object.defineProperty(b.window,'sessionStorage',{get(){throw new Error('blocked')}});
 else if(broken==='get')b.window.sessionStorage.getItem=()=>{throw new Error('blocked')};
 else if(broken==='set')b.window.sessionStorage.setItem=()=>{throw new Error('blocked')};
 else b.window.sessionStorage.setItem=()=>{};
 const h=hooks(b,{ready:true,enabled:true});h.render();assert.equal(h.render(),null);assertTerminal(b,h);h.dispose();
}
for(const type of ['pointerdown','touchstart','keydown','wheel']){
 const b=browser(),h=hooks(b);h.render();b.document.emit(type);h.policy({ready:true,enabled:true});h.render();assert.equal(h.render(),null,`${type} before readiness skips without consuming the action`);assertTerminal(b,h);h.dispose();
}
for(const type of ['keydown','wheel','blur','pagehide','beforeprint','visibilitychange','pageshow']){
 const b=browser(),h=hooks(b,{ready:true,enabled:true});h.render();assert.ok(h.render());h.render().props.children.props.onStart();
 if(type==='visibilitychange')b.document.hidden=true;
 (['keydown','wheel','visibilitychange'].includes(type)?b.document:b.window).emit(type,{persisted:true});
 assert.equal(h.render(),null,`${type} dismisses`);assertTerminal(b,h);h.dispose();
}
// A pointer during the optional chunk download skips without eating the action.
const focusEnv=browser(),focusRun=hooks(focusEnv,{ready:true,enabled:true});focusRun.render();focusRun.render().props.children.props.onStart();focusEnv.window.emit('blur',{target:{}});assert.ok(focusRun.render(),'A descendant blur is not a window blur');focusEnv.window.emit('blur');assert.equal(focusRun.render(),null);assertTerminal(focusEnv,focusRun);focusRun.dispose();
const pendingEnv=browser(),pendingRun=hooks(pendingEnv,{ready:true,enabled:true});pendingRun.render();assert.ok(pendingRun.render());pendingEnv.document.emit('pointerdown');assert.equal(pendingRun.render(),null);assertTerminal(pendingEnv,pendingRun);pendingRun.dispose();
// Once the native cover is playing, its own click handles pointer dismissal.
const activeEnv=browser(),activeRun=hooks(activeEnv,{ready:true,enabled:true});activeRun.render();activeRun.render().props.children.props.onStart();activeEnv.document.emit('pointerdown');assert.ok(activeRun.render());activeRun.dispose();
const staleEnv=browser(),staleRun=hooks(staleEnv);staleRun.render();const stale=[...staleEnv.document.listeners.get('keydown')][0];staleRun.dispose();stale();assert.equal(staleEnv.stored.size,0,'Disposed callbacks cannot consume a later mount');
const failedEnv=browser();failedEnv.window.addEventListener=()=>{throw new Error('missing host')};const failedRun=hooks(failedEnv,{ready:true,enabled:true});failedRun.render();assert.equal(failedRun.render(),null);failedRun.dispose();assert.equal(failedEnv.document.count(),0,'Partial registration cleans up');

// Real React SSR: the launch owner is null even with a ready policy. The scene
// exposes one native skip button, not an interactive region hidden from AT.
const real=compile({React,lazy:React.lazy,Suspense:React.Suspense,useState:React.useState,useRef:React.useRef,useEffect:React.useEffect,useCallback:React.useCallback,useAnimate:actualUseAnimate,useWorkspaceMotion:()=>({ready:true,enabled:true}),window:undefined,document:undefined});
assert.equal(renderToStaticMarkup(React.createElement(real.LaunchIntro)),'');
const realScene=compile({React,useEffect:React.useEffect,useAnimate:actualUseAnimate},true);
const html=renderToStaticMarkup(React.createElement(realScene.IntroScene,{onDone(){},onStart(){},canStart:()=>true}));
assert.match(html,/<button[^>]*type="button"[^>]*tabindex="-1"[^>]*aria-label="Skip introduction"/);
assert.match(html,/<span class="launch-intro__light" aria-hidden="true">/);assert.match(html,/>NeonWorth<\/span>/);assert.equal((html.match(/<button/g)||[]).length,1);assert.doesNotMatch(html,/autofocus|<h1|role="dialog"/i);

// Execute the scene effect and native-button contract callback with scoped
// controls. This is not real browser click-through or paint verification.
const calls=[],effects=[],scope={current:{decorativeButton:true}};let finish,done=0,started=0,stoppedControls=0;
const completion=new Promise(resolve=>{finish=resolve});completion.stop=()=>{stoppedControls++};
const controls=compile({React,useEffect:fn=>effects.push(fn),useAnimate:()=>[scope,(target,keyframes,options)=>{calls.push({target,keyframes,options});return completion;}],useState:React.useState,useRef:React.useRef,useCallback:React.useCallback,useWorkspaceMotion:()=>({}),window:undefined,document:undefined},true);
const button=controls.IntroScene({onDone(){done++},onStart(){started++},canStart:()=>true});const cleanup=effects[0]();
assert.equal(calls.length,5);assert.equal(started,1);assert.equal(calls[0].target,scope.current);assert.equal(calls[0].options.duration,6.8);assert.equal(calls[0].keyframes.visibility.at(-1),'hidden');assert.equal(calls[0].keyframes.opacity.at(-1),0);
assert.ok(calls[0].options.duration*(1-calls[0].options.times.at(-2))>=2,'The scene dissolves into the workspace over at least two seconds');
assert.deepEqual(calls[0].options.ease,['easeOut','linear','easeInOut','linear'],'Per-keyframe easing keeps the 4.6s fade boundary on a linear overall timeline');
for(const call of calls){assert.ok((call.options.delay||0)+call.options.duration<=calls[0].options.duration);assert.ok(!('repeat' in call.options));if(typeof call.target==='string')assert.match(call.target,/^\.launch-intro__/);assert.ok(!('x' in call.keyframes)&&!('scaleX' in call.keyframes));}
const titleCall=calls.find(call=>call.target==='.launch-intro__title'),rimCall=calls.find(call=>call.target==='.launch-intro__title-light');
assert.ok(titleCall.options.delay>0&&titleCall.options.delay+titleCall.options.duration>calls.find(call=>call.target==='.launch-intro__tube').options.duration,'The overhead light leads the title reveal');
assert.ok(Math.max(...titleCall.keyframes.opacity)<1&&Math.max(...rimCall.keyframes.opacity)<1,'Brand lettering remains an intentionally subdued part of the lighting composition');
let prevented=false,stopped=false,underlyingSaves=0;
assert.equal(button.props.onPointerDown,undefined,'Native pointer sequence keeps the cover until its completed click');
button.props.onClick({preventDefault(){prevented=true},stopPropagation(){stopped=true}});if(!stopped)underlyingSaves++;
assert.equal(prevented,true);assert.equal(stopped,true);assert.equal(underlyingSaves,0);assert.equal(done,1);
cleanup();assert.equal(stoppedControls,5,'Every returned Motion control is stopped by standard cleanup');finish();await Promise.resolve();await Promise.resolve();assert.equal(done,1,'Stale completion after unmount cannot dismiss a later scene');

// Late lazy chunks recheck the actual environmental gate before any animation.
for(const mutation of [b=>b.age(3000),b=>{b.window.navigator.userActivation.hasBeenActive=true},b=>b.focus(false)]){
 const b=browser();mutation(b);let skipped=0;const effects=[];
 const component=compile({React,useEffect:fn=>effects.push(fn),useAnimate:()=>[scope,()=>assert.fail('Late scene must never animate')]},true);
 component.IntroScene({onDone(){skipped++},onStart(){assert.fail('Skipped scene cannot start')},canStart:()=>real.launchIntroEligible(b.window,b.document)});effects[0]();assert.equal(skipped,1);
}
const completedEnv=browser(),completedRun=hooks(completedEnv,{ready:true,enabled:true});completedRun.render();const completedProps=completedRun.render().props.children.props;
const panEffects=[],panRun=compile({React,useEffect:fn=>panEffects.push(fn),useAnimate:()=>[scope,()=>assert.fail('Only the native pointer-cancel contract is under test')]},true);let panDismissed=0;const panButton=panRun.IntroScene({onDone(){panDismissed++},onStart(){},canStart:()=>false});panButton.props.onPointerCancel();assert.equal(panDismissed,1,'A browser-cancelled touch gesture dismisses without implementing gesture recognition');
const completedEffects=[],completedControls=compile({React,useEffect:fn=>completedEffects.push(fn),useAnimate:()=>[scope,()=>Object.assign(Promise.resolve(),{stop(){}})]},true);
completedControls.IntroScene(completedProps);const completedCleanup=completedEffects[0]();await Promise.resolve();await Promise.resolve();assertTerminal(completedEnv,completedRun);completedCleanup();completedRun.dispose();

let load;const fallbackEffects=[];compile({React,useEffect:fn=>fallbackEffects.push(fn),lazy:loader=>{load=loader;return()=>null},Suspense:React.Suspense});
const missing=await load(),missingEnv=browser(),missingRun=hooks(missingEnv,{ready:true,enabled:true});missingRun.render();const missingProps=missingRun.render().props.children.props;
assert.equal(missing.default(missingProps),null,'Optional chunk failure renders no cover');
assert.equal(fallbackEffects.length,1);fallbackEffects[0]();assertTerminal(missingEnv,missingRun);missingRun.dispose();

const css=postcss.parse(await readFile('app/launch-intro.css','utf8'));
const base=css.nodes.find(node=>node.type==='rule'&&node.selector==='.launch-intro');const declarations=Object.fromEntries(base.nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value]));
assert.equal(declarations.display,'none');assert.equal(declarations.visibility,'hidden');assert.equal(declarations.opacity,'0');assert.equal(declarations['pointer-events'],'auto');assert.equal(declarations.position,'fixed');
css.walkRules(rule=>assert.ok(rule.selector.includes('launch-intro'),'All styling is isolated from financial content'));
css.walkDecls('display',decl=>{if(decl.value!=='none'&&decl.parent.selector.includes('body:has')){assert.match(decl.parent.parent.params,/prefers-reduced-motion: no-preference/);assert.match(decl.parent.parent.params,/forced-colors: none/);assert.match(decl.parent.parent.params,/screen/);}});
assert.doesNotMatch(source+sceneSource,/\bsetTimeout\b|\bsetInterval\b|requestAnimationFrame|\.animate\(/,'Our code has no animation scheduler or raw native engine');
assert.match(sceneSource,/from 'motion\/react-mini'/);assert.doesNotMatch(source,/motion\/react/,'Returning users must not eagerly load Motion');
console.log('Launch intro: actual once/skip policy, session failure, hydration grace, StrictMode, dismissal and cleanup; real SSR/native-button contract; scoped finite Motion endpoint and isolated policy CSS passed. Browser painting remains separate.');
