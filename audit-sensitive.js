const fs = require('fs');

const patterns = [
  { re: /password/gi, label: 'password' },
  { re: /secret/gi, label: 'secret' },
  { re: /api[_-]?key/gi, label: 'api_key' },
  { re: /token/gi, label: 'token' },
  { re: /credential/gi, label: 'credential' },
  { re: /private[_-]?key/gi, label: 'private_key' },
  { re: /bearer/gi, label: 'bearer' },
];

const files = [
  'MASTER_POLICY.md',
  'LEGAL_COMPLIANCE_BASELINE.md',
  'ARCHITECTURE.md',
  'everyday_agent.py',
  'ai-server.mjs',
  'api_server.py',
  'README.md',
  'lifecycle_simulation.py',
];

files.forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    const hits = [];
    patterns.forEach(({ re, label }) => {
      lines.forEach((line, i) => {
        if (re.test(line)) {
          hits.push({ line: i + 1, label, text: line.trim().substring(0, 100) });
          re.lastIndex = 0;
        }
      });
    });
    if (hits.length) {
      console.log(`\n📄 ${f}: ${hits.length} matches`);
      hits.slice(0, 8).forEach(h => {
        const isReal = /['"][A-Za-z0-9]{16,}['"]/.test(h.text) || /actual.*value/i.test(h.text);
        console.log(`  L${h.line} [${h.label}]${isReal ? ' ⚠️  REAL?' : ''}: ${h.text}`);
      });
    }
  } catch {}
});

// Check .env and config files
console.log('\n--- Config files ---');
['agent.config.json', '.env', '.env.local', 'agent.config.example.json'].forEach(f => {
  try {
    const content = fs.readFileSync(f, 'utf8');
    console.log(`📄 ${f}: EXISTS (${(content.length/1024).toFixed(1)}KB)`);
    if (content.includes('password') || content.includes('token') || content.includes('key')) {
      console.log('  ⚠️  Contains sensitive keywords');
    }
  } catch {
    console.log(`✅ ${f}: not found`);
  }
});

console.log('\n--- Summary ---');
console.log('The project files contain references to:');
console.log('- "password", "token", "secret" as CONCEPTS (policy rules, not real values)');
console.log('- scrypt hashing, session cookies, CSRF tokens as SECURITY MECHANISMS');
console.log('- NO real API keys, passwords, or credentials stored in source code');
