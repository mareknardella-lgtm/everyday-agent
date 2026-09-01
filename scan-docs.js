const fs = require('fs');
const path = require('path');

function scan(dir) {
  const results = [];
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory() && !['node_modules', '.git', '__pycache__', '.freebuff', 'gallery', 'video', '.git'].includes(f.name)) {
        results.push(...scan(full));
      } else if (f.isFile()) {
        const ext = path.extname(f.name).toLowerCase();
        if (['.md', '.py', '.mjs', '.js', '.html', '.css', '.json', '.txt'].includes(ext)) {
          const s = fs.statSync(full);
          results.push({ path: full, size: s.size, ext });
        }
      }
    }
  } catch {}
  return results;
}

const files = scan('.');
const total = files.reduce((a, f) => a + f.size, 0);
const byExt = {};
files.forEach(f => { byExt[f.ext] = (byExt[f.ext] || 0) + f.size; });

console.log('\n📊 Document inventory for LLM training:\n');
console.log('Total files:', files.length);
console.log('Total size:', (total / 1024).toFixed(1), 'KB =', (total / 1048576).toFixed(2), 'MB');
console.log('Approximate tokens:', Math.round(total / 4).toLocaleString(), '(~4 chars/token)');

console.log('\nBy type:');
Object.entries(byExt).sort((a, b) => b[1] - a[1]).forEach(([ext, size]) => {
  const count = files.filter(f => f.ext === ext).length;
  console.log(`  ${ext}: ${count} files, ${(size / 1024).toFixed(1)} KB`);
});

console.log('\nTop 15 largest files:');
files.sort((a, b) => b.size - a.size).slice(0, 15).forEach(f => {
  console.log(`  ${f.path.replace(/\\/g, '/').substring(0, 60)}: ${(f.size / 1024).toFixed(1)} KB`);
});

// Estimate training data quality
const mdSize = byExt['.md'] || 0;
const pySize = byExt['.py'] || 0;
const jsSize = (byExt['.js'] || 0) + (byExt['.mjs'] || 0);
console.log('\n--- LLM Training Estimates ---');
console.log('Documentation (.md):', (mdSize / 1024).toFixed(1), 'KB =', Math.round(mdSize / 4).toLocaleString(), 'tokens');
console.log('Python backend (.py):', (pySize / 1024).toFixed(1), 'KB =', Math.round(pySize / 4).toLocaleString(), 'tokens');
console.log('JavaScript frontend:', (jsSize / 1024).toFixed(1), 'KB =', Math.round(jsSize / 4).toLocaleString(), 'tokens');
console.log('Combined knowledge base:', (total / 1024).toFixed(1), 'KB =', Math.round(total / 4).toLocaleString(), 'tokens');
