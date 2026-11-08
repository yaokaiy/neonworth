import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { verifyArchive, findingLocations, scannerBinary, downloadScannerArchive } from './scan-secrets.mjs';

const archive = Buffer.from('Synthetic scanner archive');
const digest = createHash('sha256').update(archive).digest('hex');
assert.doesNotThrow(() => verifyArchive(archive, digest));
assert.throws(() => verifyArchive(Buffer.from('tampered scanner'), digest), /checksum/);
assert.throws(() => verifyArchive(archive, 'not-a-digest'), /checksum/);

const sensitive = ['SYNTHETIC', 'NEVER', 'PRINT'].join('_');
const rendered = findingLocations([{ File: 'lib/config.ts', StartLine: 7, RuleID: 'generic-api-key', Secret: sensitive, Match: `key=${sensitive}`, CommitMessage: sensitive }]).join('\n');
assert.equal(rendered, 'lib/config.ts:7 (generic-api-key)');
assert.ok(!rendered.includes(sensitive), 'Scanner values and source snippets never reach diagnostic output.');
assert.deepEqual(findingLocations([]), []);
assert.throws(() => findingLocations({ Secret: sensitive }), /invalid report/);
assert.equal(findingLocations([{File:'bad\nfile',StartLine:-1,RuleID:'rule\nforged'}])[0], 'bad?file:? (rule?forged)');
console.log('Secret scanner verifies pinned downloads and emits only bounded location metadata.');

// Delivery resilience never changes which bytes are trusted. These exercise
// HTTP/transport failures without contacting GitHub or running a fake scanner.
const pin = JSON.parse(await readFile(new URL('./secret-scanner.json', import.meta.url), 'utf8'));
for (const item of Object.values(pin.assets)) assert.ok(Number.isSafeInteger(item.api_id) && item.api_id > 0);
const asset = { ...pin.assets['linux-x64'], sha256: digest };
const ok = () => new Response(archive);
function delivery(steps) {
 const calls=[], waits=[];
 return { calls, waits, options:{
  async fetchImpl(url, options) {
   calls.push({url,options});const next=steps.shift();
   if(next instanceof Error)throw next;
   assert.ok(next,'Download attempts stay bounded');return next;
  },
  async wait(ms){waits.push(ms)},
 }};
}
let d=delivery([ok()]);
assert.deepEqual(await downloadScannerArchive(asset,d.options),archive);
assert.equal(d.calls.length,1);assert.deepEqual(d.waits,[]);
assert.match(d.calls[0].url,/^https:\/\/github\.com\/gitleaks\/gitleaks\/releases\/download\/v8\.30\.1\//);
assert.ok(d.calls[0].options.signal instanceof AbortSignal);

d=delivery([new Response(sensitive,{status:503}),ok()]);
assert.deepEqual(await downloadScannerArchive(asset,d.options),archive);
assert.equal(d.calls.length,2);assert.deepEqual(d.waits,[500]);
assert.equal(d.calls[0].url,d.calls[1].url);

d=delivery([new Response(sensitive,{status:504}),new Response(sensitive,{status:504}),ok()]);
assert.deepEqual(await downloadScannerArchive(asset,d.options),archive);
assert.equal(d.calls.length,3);assert.deepEqual(d.waits,[500]);
assert.equal(d.calls[2].url,`https://api.github.com/repos/gitleaks/gitleaks/releases/assets/${asset.api_id}`);
assert.deepEqual(d.calls[2].options.headers,{Accept:'application/octet-stream'});
assert.ok(d.calls.every(call=>!call.options.headers?.Authorization),'Public downloads never add authentication');

d=delivery([new Error(sensitive),new Error(sensitive),new Response(sensitive,{status:429}),ok()]);
assert.deepEqual(await downloadScannerArchive(asset,d.options),archive);
assert.equal(d.calls.length,4);assert.deepEqual(d.waits,[500,500]);

d=delivery([new Response(sensitive,{status:404}),ok()]);
assert.deepEqual(await downloadScannerArchive(asset,d.options),archive);
assert.equal(d.calls.length,2);assert.deepEqual(d.waits,[],'Permanent HTTP errors do not retry the same endpoint');

d=delivery([new Response('corrupt successful download'),ok()]);
await assert.rejects(downloadScannerArchive(asset,d.options),/checksum/);
assert.equal(d.calls.length,1);assert.deepEqual(d.waits,[],'Integrity failure never retries or uses a fallback');
d=delivery([new Response('',{status:404}),new Response('corrupt API response'),ok()]);
await assert.rejects(downloadScannerArchive(asset,d.options),/checksum/);
assert.equal(d.calls.length,2);

d=delivery([new Response(sensitive,{status:504}),new Response(sensitive,{status:504}),new Error(sensitive),new Error(sensitive)]);
await assert.rejects(downloadScannerArchive(asset,d.options),error=>{
 assert.equal(error.message,'Pinned scanner download unavailable (release: HTTP 504; release: HTTP 504; assets-api: transport; assets-api: transport).');
 assert.ok(!error.message.includes(sensitive));return true;
});
assert.equal(d.calls.length,4);assert.deepEqual(d.waits,[500,500]);
d=delivery([]);
await assert.rejects(downloadScannerArchive({...asset,api_id:0},d.options),/asset ID/);
assert.equal(d.calls.length,0);
console.log('Scanner delivery: bounded transient retries, fixed official API fallback, terminal integrity failures and content-free diagnostics passed.');


// Execute the pinned scanner against invented tokens. No project-specific
// allowlist may weaken any default credential rule.
const temporary=await mkdtemp(join(tmpdir(),'neonworth-scanner-regression-'));
try {
 const binary=await scannerBinary(temporary),source=join(temporary,'source');
 await mkdir(source);
 const synthetic=createHash('sha256').update('Synthetic scanner regression only; no service capability').digest('hex');
 const generic=['api','key'].join('_')+' = "'+synthetic+'"';
 const provider=['gh','p_'].join('')+synthetic.slice(0,36);
 await writeFile(join(source,'example.txt'),generic+'\n'+provider+'\n');
 const report=join(temporary,'report.json');
 const result=spawnSync(binary,['dir',source,'--config',resolve('.gitleaks.toml'),'--redact=100','--no-banner','--ignore-gitleaks-allow','--gitleaks-ignore-path',join(temporary,'absent-ignore-file'),'--report-format=json','--report-path',report],{encoding:'utf8',maxBuffer:1_000_000,timeout:30_000});
 assert.ok(!result.error&&result.status===1,'Pinned scanner must detect synthetic canaries; diagnostics intentionally withheld');
 const locations=JSON.parse(await readFile(report,'utf8')).map(item=>({rule:item.RuleID,line:item.StartLine}));
 assert.ok(locations.some(item=>item.rule==='generic-api-key'&&item.line===1));
 assert.ok(locations.some(item=>item.rule==='github-pat'&&item.line===2));
 assert.doesNotMatch(await readFile(resolve('.gitleaks.toml'),'utf8'),/allowlist/,'No personal false-positive exemptions ship in the template');
} finally { await rm(temporary,{recursive:true,force:true}); }
console.log('Pinned scanner detects invented generic and provider credentials with the unchanged default rules.');
