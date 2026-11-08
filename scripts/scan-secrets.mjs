import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, readFile, readlink, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const configFile = join(root, '.gitleaks.toml');
const pin = JSON.parse(await readFile(new URL('./secret-scanner.json', import.meta.url), 'utf8'));
const digest = data => createHash('sha256').update(data).digest('hex');

export function verifyArchive(data, expected) {
  if (!/^[a-f0-9]{64}$/.test(expected) || digest(data) !== expected) throw new Error('Secret scanner archive checksum mismatch.');
}

const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);
class ScannerDownloadUnavailable extends Error {
  constructor(attempts) {
    // Only our endpoint labels and bounded HTTP status/transport enums enter
    // this message, never a response body, URL or caught exception message.
    super(`Pinned scanner download unavailable (${attempts.join('; ')}).`);
  }
}

export async function downloadScannerArchive(asset, { fetchImpl = globalThis.fetch, wait = delay } = {}) {
  if (!Number.isSafeInteger(asset.api_id) || asset.api_id <= 0) throw new Error('Pinned scanner asset ID is invalid.');
  const sources = [
    { label: 'release', url: `https://github.com/gitleaks/gitleaks/releases/download/v${pin.version}/${asset.file}` },
    { label: 'assets-api', url: `https://api.github.com/repos/gitleaks/gitleaks/releases/assets/${asset.api_id}`,
      headers: { Accept: 'application/octet-stream' } },
  ];
  const attempts = [];
  for (const source of sources) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let data, reason = 'transport', retry = true;
      try {
        // Four attempts remain bounded below the regression child's 120s
        // deadline, including its real scanner-canary execution afterward.
        const response = await fetchImpl(source.url, { headers: source.headers, signal: AbortSignal.timeout(20_000) });
        if (response.ok) data = Buffer.from(await response.arrayBuffer());
        else {
          reason = Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? `HTTP ${response.status}` : 'response';
          retry = transientStatuses.has(response.status);
          try { await response.body?.cancel(); } catch { /* No response content enters diagnostics. */ }
        }
      } catch { /* Transport/read errors may contain sensitive URLs or headers. */ }
      if (data) {
        // An integrity failure is terminal: do not retry or fall back after a
        // successful response fails the reviewed checksum.
        verifyArchive(data, asset.sha256);
        return data;
      }
      attempts.push(`${source.label}: ${reason}`);
      if (!retry || attempt === 1) break;
      await wait(500);
    }
  }
  throw new ScannerDownloadUnavailable(attempts);
}

// Never forward scanner stdout/stderr, Match, Secret, commit messages, or code
// snippets. Keep a minimal, bounded location so a finding can be fixed safely.
export function findingLocations(findings) {
  if (!Array.isArray(findings)) throw new Error('Secret scanner produced an invalid report.');
  return findings.map(finding => {
    const file = String(finding.File ?? '').replace(/[\x00-\x1f\x7f]/g, '?').slice(0, 240);
    const rule = String(finding.RuleID ?? '').replace(/[^a-zA-Z0-9_-]/g, '?').slice(0, 80);
    const line = Number.isSafeInteger(finding.StartLine) && finding.StartLine > 0 ? finding.StartLine : '?';
    return `${file}:${line} (${rule})`;
  });
}

export async function scannerBinary(temporary) {
  const asset = pin.assets[`${process.platform}-${process.arch}`];
  if (!asset) throw new Error('Secret scanning supports Linux and macOS x64/arm64. Run the pinned CI gate on other hosts.');
  const cache = join(root, '.sites-runtime', 'security-tools');
  await mkdir(cache, { recursive: true });
  const archivePath = join(cache, asset.file);
  let archive;
  try { archive = await readFile(archivePath); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!archive) {
    archive = await downloadScannerArchive(asset);
    await writeFile(archivePath, archive, { flag: 'wx', mode: 0o600 });
  }
  verifyArchive(archive, asset.sha256);
  const extraction = spawnSync('tar', ['-xzf', archivePath, '-C', temporary, 'gitleaks'], { encoding: 'utf8' });
  if (extraction.error || extraction.status !== 0) throw new Error('Could not extract the verified secret scanner.');
  return join(temporary, 'gitleaks');
}

async function snapshotSource(destination) {
  const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 16_000_000 }).split('\0').filter(Boolean);
  for (const filename of new Set(paths)) {
    const source = resolve(root, filename);
    if (relative(root, source).startsWith('..')) throw new Error('Unexpected path in tracked source.');
    let stat;
    try { stat = await lstat(source); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const target = join(destination, filename);
    await mkdir(dirname(target), { recursive: true });
    // Scan the link text, never dereference a symlink into a private host file.
    if (stat.isSymbolicLink()) await writeFile(target, await readlink(source));
    else if (stat.isFile()) await copyFile(source, target);
    else throw new Error('Unexpected file type in tracked source.');
  }
}

async function scan(binary, temporary, kind, source) {
  const report = join(temporary, `${kind}.json`);
  const args = [kind, source, '--config', configFile, '--redact=100', '--no-banner', '--ignore-gitleaks-allow',
    '--gitleaks-ignore-path', join(temporary, 'no-ignored-findings'), '--report-format=json', '--report-path', report,
    ...(kind === 'git' ? ['--log-opts=HEAD'] : [])];
  const result = spawnSync(binary, args, { cwd: root, encoding: 'utf8', maxBuffer: 16_000_000, timeout: 180_000 });
  if (result.error || ![0, 1].includes(result.status)) throw new Error('Secret scan could not complete; scanner diagnostics were withheld to avoid exposing content.');
  let findings;
  try { findings = JSON.parse(await readFile(report, 'utf8')); }
  catch { throw new Error('Secret scan did not produce a readable report.'); }
  if (result.status === 1 && !findings.length) throw new Error('Secret scan failed without a complete findings report.');
  return findingLocations(findings).map(location => `${kind === 'git' ? 'History' : 'Source'}: ${location}`);
}

async function main() {
  const temporary = await mkdtemp(join(tmpdir(), 'neonworth-secret-scan-'));
  let phase = 'scanner bootstrap';
  try {
    const binary = await scannerBinary(temporary);
    phase = 'source snapshot';
    const source = join(temporary, 'source');
    await mkdir(source);
    await snapshotSource(source);
    phase = 'history scan';
    const history = await scan(binary, temporary, 'git', root);
    phase = 'source scan';
    const locations = [...history, ...await scan(binary, temporary, 'dir', source)];
    if (locations.length) {
      console.error(`Secret scan found ${locations.length} findings. Values and code are withheld.`);
      for (const location of locations.slice(0, 100)) console.error(location);
      if (locations.length > 100) console.error('Additional locations omitted.');
      process.exitCode = 1;
    } else console.log(`Gitleaks ${pin.version}: no findings in reachable Git history or current source.`);
  } catch (error) {
    // Errors can contain response bodies or subprocess diagnostics. Do not relay
    // them; operational failures block the gate just like detected secrets.
    if (error instanceof ScannerDownloadUnavailable) console.error(error.message);
    console.error(`Secret scan failed during ${phase}; no source or credential values were printed.`);
    process.exitCode = 1;
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
