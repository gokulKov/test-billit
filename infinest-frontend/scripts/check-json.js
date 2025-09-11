const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  try {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) files.push(...walk(full));
      else files.push(full);
    }
  } catch (e) {
    // ignore
  }
  return files;
}

function check(dir) {
  const all = walk(dir).filter(f => f.endsWith('.json'));
  console.log(`Checking ${all.length} .json files under ${dir}`);
  let bad = 0;
  for (const f of all) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      JSON.parse(content);
      // valid
    } catch (err) {
      console.error('INVALID JSON:', f, err.message);
      bad++;
    }
  }
  return bad;
}

const roots = [
  path.join(__dirname, '..', 'node_modules', 'jspdf'),
  path.join(__dirname, '..', 'node_modules', 'recharts')
];
let totalBad = 0;
for (const r of roots) {
  if (fs.existsSync(r)) totalBad += check(r);
  else console.log('Not found:', r);
}
process.exit(totalBad>0?1:0);
