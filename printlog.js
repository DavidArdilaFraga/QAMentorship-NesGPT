const fs = require('fs');
const files = process.argv.slice(2);
for (const f of files) {
  try {
    const t = fs.readFileSync(f, 'utf16le');
    console.log('=== ' + f + ' (len ' + t.length + ') ===');
    console.log(t.length > 1200 ? t.slice(-1200) : t);
  } catch (e) {
    console.log('ERR ' + f + ': ' + e.message);
  }
}
