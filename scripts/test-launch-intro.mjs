// App-owned session/policy rules, real SSR markup and Motion integration.
// Motion owns native animation lifecycle; browser paint remains a separate gate.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { finishLaunchGate } from '../app/launch-gate.ts';
import { useAnimate as actualUseAnimate } from 'motion/react-mini';
import { LAUNCH_LIGHTING, sampleLaunchLighting } from '../app/launch-lighting.ts';
import { createRequire } from 'node:module';
const postcss = createRequire(import.meta.resolve('vite/package.json'))('postcss');

const source=await readFile('app/launch-intro.tsx','utf8');
const sceneSource=await readFile('app/launch-intro-scene.tsx','utf8');
function transpile(text){
 const ast=ts.createSourceFile('launch.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const body=ast.statements.filter(node=>!ts.isImportDeclaration(node)).map(node=>node.getText(ast).replace(/^export /,'')).join('\n');
 return ts.transpileModule(body,{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
}
function compile(scope,scene=false){return new Function(...Object.keys(scope),transpile(scene?sceneSource:source)+(scene?';return {IntroScene};':';return {LaunchIntro};'))(...Object.values(scope));}
// Execute the actual layout owner through readiness and StrictMode effect replay.
function ownerHarness({ ready=false, enabled=false, missing=false }={}) {
 let cursor=0, policy={ready,enabled};const cells=[],effects=[],pending=[],listeners=new Set();
 const gate={phase:'pending',claims:0,starts:0,claim(){this.claims++;if(this.phase!=='pending')return false;this.phase='claimed';return true;},canStart(){return this.phase!=='done';},started(){this.starts++;this.phase='playing';},finish(){this.phase='done';for(const callback of [...listeners])callback();}};
 const window={__neonworthLaunchGate:missing?undefined:gate};
 const document={addEventListener:(type,fn)=>{assert.equal(type,'neonworth-launch-finished');listeners.add(fn)},removeEventListener:(_type,fn)=>listeners.delete(fn),getElementById:()=>({outsideRoot:true}),body:{},documentElement:{setAttribute(){}},querySelector:()=>null};
 const useState=initial=>{const index=cursor++;if(!cells[index])cells[index]={value:initial};return[cells[index].value,value=>{cells[index].value=value;}];};
 const useRef=initial=>{const index=cursor++;return cells[index]??={current:initial};};
 const useCallback=(fn,deps)=>{const index=cursor++,old=cells[index];if(!old||deps.some((value,i)=>!Object.is(value,old.deps[i])))cells[index]={fn,deps};return cells[index].fn;};
 const useEffect=(fn,deps)=>{const index=cursor++,old=effects[index];if(!old||deps.some((value,i)=>!Object.is(value,old.deps[i])))pending.push(()=>{old?.cleanup?.();effects[index]={fn,deps,cleanup:fn()};});};
 const actual=compile({React,lazy:()=>function LazyScene(){},Suspense:React.Suspense,createPortal:(child,target)=>({child,target}),useState,useRef,useCallback,useEffect,useWorkspaceMotion:()=>policy,finishLaunchGate,window,document});
 return{gate,listeners,policy:next=>{policy=next},render(props={}){cursor=0;const tree=actual.LaunchIntro(props);for(const effect of pending.splice(0))effect();return tree;},replay(){for(const effect of effects)effect?.cleanup?.();for(const effect of effects)if(effect)effect.cleanup=effect.fn();},dispose(){for(const effect of effects)effect?.cleanup?.();}};
}
const owner=ownerHarness();
assert.ok(owner.render(),'The pending native gate has server/initial markup before policy readiness');
assert.equal(owner.gate.claims,0);owner.replay();assert.equal(owner.listeners.size,1);
owner.policy({ready:true,enabled:true});owner.render();let owned=owner.render();
assert.equal(owned.props.children[1].type,React.Suspense);assert.equal(owner.gate.claims,1);
owner.replay();owned=owner.render();assert.equal(owner.gate.claims,1,'StrictMode does not spend another document claim');
owned.props.children[1].props.children.props.onStart();assert.equal(owner.gate.phase,'playing');
owner.policy({ready:true,enabled:false});owner.render();assert.equal(owner.render(),null);assert.equal(owner.gate.phase,'done');
owner.policy({ready:true,enabled:true});owner.render();assert.equal(owner.render(),null,'Policy re-enabling does not replay');
owner.dispose();assert.equal(owner.listeners.size,0);
const portalOwner=ownerHarness({ready:true,enabled:true});portalOwner.render({externalGate:true});
const portal=portalOwner.render({externalGate:true}).props.children[1];assert.equal(portal.target.outsideRoot,true,'The demo scene is portaled outside the concealed/inert root');portalOwner.gate.finish('input');assert.equal(portalOwner.render({externalGate:true}),null);portalOwner.dispose();
const missingOwner=ownerHarness({ready:true,enabled:true,missing:true});missingOwner.render();assert.equal(missingOwner.render(),null,'A missing independent bootstrap never creates a late intro');missingOwner.dispose();

// Real React SSR: the launch owner is null even with a ready policy. The scene
// exposes one native skip button, not an interactive region hidden from AT.
const real=compile({React,lazy:React.lazy,Suspense:React.Suspense,useState:React.useState,useRef:React.useRef,useEffect:React.useEffect,useCallback:React.useCallback,useAnimate:actualUseAnimate,useWorkspaceMotion:()=>({ready:true,enabled:true}),finishLaunchGate,window:undefined,document:undefined});
assert.match(renderToStaticMarkup(React.createElement(real.LaunchIntro)), /id="launch-gate"[^>]*type="button"/);
assert.equal(renderToStaticMarkup(React.createElement(real.LaunchIntro,{externalGate:true})), '');
const realScene=compile({React,useEffect:React.useEffect,useAnimate:actualUseAnimate},true);
const html=renderToStaticMarkup(React.createElement(realScene.IntroScene,{onDone(){},onStart(){},canStart:()=>true}));
assert.match(html,/<button[^>]*type="button"[^>]*tabindex="0"[^>]*aria-label="Skip introduction"/);
assert.match(html,/<span class="launch-intro__light" aria-hidden="true">/);assert.match(html,/>NeonWorth<\/span>/);assert.equal((html.match(/<button/g)||[]).length,1);assert.doesNotMatch(html,/autofocus|<h1|role="dialog"/i);

// Execute the original owner integration. OGL and Motion are mocked only at
// their boundaries; real GPU compilation, light appearance and native input
// remain browser evidence. The actual sampler is shared with the adapter QA.
function sceneHarness({ available=true, healthy=true, immediate=false, throwClock=false, display='block', position='fixed' }={}) {
 const effects=[],calls=[],samples=[],styles=new Map();let done=0,started=0,disposed=0,stopped=0,finish;
 const root={ownerDocument:{defaultView:{getComputedStyle:()=>({display,position})}},dataset:{},style:{opacity:'',setProperty:(key,value)=>styles.set(key,value)},
   querySelector:selector=>selector.includes('canvas')?{}:{getBoundingClientRect:()=>({top:0})}};
 const scope={current:root};
 const end=Object.assign(immediate?Promise.resolve():new Promise(resolve=>{finish=resolve}),{stop(){stopped++}});
 let update;
 const code=compile({React,useEffect:fn=>effects.push(fn),useAnimate:()=>[scope,(target,keyframes,options)=>{calls.push({target,keyframes,options});return end;}],
   animateValue:(from,to,options)=>{if(throwClock)throw new Error('clock unavailable');calls.push({from,to,options});update=options.onUpdate;return{stop(){stopped++}}},
   LAUNCH_LIGHTING,sampleLaunchLighting,
   createNeonLightField:(_canvas,options)=>{assert.equal(options.secondaryStrength,1);return available?{render:sample=>{samples.push(sample);return healthy},dispose(){disposed++}}:null}},true);
 const props={onDone(){done++},onStart(){started++},canStart:()=>true};
 return{code,props,root,effects,calls,samples,styles,get done(){return done},get started(){return started},get disposed(){return disposed},get stopped(){return stopped},
   start(next=props){const button=code.IntroScene(next),cleanup=effects.at(-1)();return{button,cleanup}},tick:t=>update(t),finish:()=>finish?.()};
}
const h=sceneHarness(),{button,cleanup}=h.start();
assert.equal(h.calls.length,2);assert.equal(h.started,1);
assert.equal(h.calls[0].target,h.root);assert.equal(h.calls[0].options.duration,LAUNCH_LIGHTING.duration);
assert.equal(h.calls[0].keyframes.visibility.at(-1),'hidden');
assert.equal(h.calls[0].keyframes.opacity,undefined,'Native safety endpoint does not apply a second scene fade');
assert.equal(h.calls[1].from,0);assert.equal(h.calls[1].to,LAUNCH_LIGHTING.duration);
assert.equal(h.calls[1].options.duration,LAUNCH_LIGHTING.duration);assert.equal(h.calls[1].options.ease,'linear');
assert.equal(h.root.style.opacity,'0');assert.equal(h.samples.length,1,'Compile/first draw completes before the clock starts');
h.tick(3.5);assert.deepEqual(h.samples.at(-1),sampleLaunchLighting(3.5));assert.equal(h.root.dataset.lightField,'ready');
h.tick(6.5);assert.equal(h.root.style.opacity,String(sampleLaunchLighting(6.5).scene),'Single sampled fade surrounds GPU and fallback');
assert.equal(h.styles.get('--launch-rim'),String(sampleLaunchLighting(6.5).rim));
let prevented=false,stopped=false,underlyingSaves=0;
assert.equal(button.props.onPointerDown,undefined,'Native pointer sequence keeps the cover until its completed click');
button.props.onClick({preventDefault(){prevented=true},stopPropagation(){stopped=true}});if(!stopped)underlyingSaves++;
assert.equal(prevented,true);assert.equal(stopped,true);assert.equal(underlyingSaves,0);assert.equal(h.done,1);
cleanup();assert.equal(h.stopped,2,'Both Motion clocks are stopped');assert.equal(h.disposed,1,'GPU resources released once');
const before=h.samples.length;h.tick(1);assert.equal(h.samples.length,before,'Stale frame callbacks are inert');
h.finish();await Promise.resolve();await Promise.resolve();assert.equal(h.done,1,'Stale completion cannot dismiss a later scene');
for(const config of [{available:false},{healthy:false}]){
 const fallback=sceneHarness(config),run=fallback.start();
 assert.equal(fallback.root.dataset.lightField,'fallback');fallback.tick(3);
 assert.equal(fallback.styles.get('--launch-room'),String(sampleLaunchLighting(3).room),'CSS fallback receives the identical finite light envelope');
 assert.equal(fallback.disposed,config.available===false?0:1);run.cleanup();
 assert.equal(fallback.disposed,config.available===false?0:1,'A failed renderer is not disposed twice by owner cleanup');
}
const expired=sceneHarness();let startChecks=0;
expired.start({...expired.props,canStart:()=>++startChecks===1});
assert.equal(expired.samples.length,1);assert.equal(expired.calls.length,0);assert.equal(expired.started,0);assert.equal(expired.disposed,1);assert.equal(expired.done,1,'Cold compilation cannot start a late cover');
for(const styles of [{display:'none'},{position:'static'}]){
 const unstyled=sceneHarness(styles),run=unstyled.start(); assert.equal(unstyled.calls.length,0); assert.equal(unstyled.started,0); assert.equal(unstyled.done,1,'An unavailable optional stylesheet skips before starting choreography'); assert.equal(unstyled.disposed,1); run.cleanup?.();
}
const failedClock=sceneHarness({throwClock:true}),failedCleanup=failedClock.start().cleanup;
assert.equal(failedClock.done,1);assert.equal(failedClock.disposed,1);assert.equal(failedClock.started,0);failedCleanup();

// Missing optional chunks call the owner's failure release without creating a cover.
let load;const fallbackEffects=[];compile({React,useEffect:fn=>fallbackEffects.push(fn),lazy:loader=>{load=loader;return()=>null},Suspense:React.Suspense});
const missing=await load();let failure;
assert.equal(missing.default({onDone:reason=>{failure=reason}}),null);
fallbackEffects[0]();assert.equal(failure,'unavailable');

const css=postcss.parse(await readFile('app/launch-intro.css','utf8'));
const base=css.nodes.find(node=>node.type==='rule'&&node.selector==='.launch-intro');const declarations=Object.fromEntries(base.nodes.filter(node=>node.type==='decl').map(node=>[node.prop,node.value]));
assert.equal(declarations.display,'none');assert.equal(declarations.visibility,'hidden');assert.equal(declarations.opacity,'0');assert.equal(declarations['pointer-events'],'auto');assert.equal(declarations.position,'fixed');
css.walkRules(rule=>assert.ok(rule.selector.includes('launch-intro'),'All styling is isolated from financial content'));
css.walkDecls('display',decl=>{if(decl.value!=='none'&&decl.parent.selector.includes('body:has')){assert.match(decl.parent.parent.params,/prefers-reduced-motion: no-preference/);assert.match(decl.parent.parent.params,/forced-colors: none/);assert.match(decl.parent.parent.params,/screen/);}});
assert.doesNotMatch(source+sceneSource,/\bsetTimeout\b|\bsetInterval\b|requestAnimationFrame|\.animate\(/,'Our code has no animation scheduler or raw native engine');
assert.match(sceneSource,/from 'motion\/react-mini'/);assert.doesNotMatch(source,/motion\/react/,'Returning users must not eagerly load Motion');
console.log('Launch intro: real SSR gate/native-button contract; actual Motion/OGL integration, finite endpoint, failure release, click isolation and resource cleanup passed. Browser painting remains separate.');
