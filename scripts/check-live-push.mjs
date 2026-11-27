const base = process.argv[2] || 'https://qada-tracker-yassine.netlify.app';
// The hosting build can have different asset hashes from a local build.
// Verify the files promised by the deployed worker, not an unrelated local dist.
const manifestResponse = await fetch(base + '/sw.js', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
if (!manifestResponse.ok) throw new Error(`Deployed worker unavailable: ${manifestResponse.status}`);
const source = await manifestResponse.text();
const buildMatch = source.match(/BUILD_ID = '([^']+)/);
const pathsMatch = source.match(/PRECACHE_URLS = (\[[^;]+);/);
if (!buildMatch || !pathsMatch) throw new Error('Deployed offline manifest is missing');
const build = buildMatch[1];
const paths = JSON.parse(pathsMatch[1]);
const failures = [];
let cursor = 0;
async function check() {
  while (cursor < paths.length) {
    const path = paths[cursor++];
    try {
      const response = await fetch(base + path, { cache: 'reload', signal: AbortSignal.timeout(20000) });
      const type = response.headers.get('content-type') || '';
      if (!response.ok) failures.push([path, response.status]);
      else if (path.endsWith('.html')) {
        const html = await response.text();
        if (!html.includes(`content="${build}"`)) failures.push([path, 'build mismatch', response.url]);
      } else if (type.includes('text/html')) failures.push([path, 'HTML fallback']);
      else await response.arrayBuffer();
    } catch { failures.push([path, 'network failure']); }
  }
}
await Promise.all(Array.from({ length: 6 }, check));
console.log(JSON.stringify({ base, build, checked: paths.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
