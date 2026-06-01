const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/MST Blockchain Grant Program/MST SaralChain/frontend-portal/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:5000')) {
    // Replace hardcoded url with dynamic env variable, ensuring we use backticks if the original was double quotes,
    // or just construct the string carefully.
    
    // Instead of complex template literal logic, just replace the literal string
    // "http://localhost:5000" with (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    // Wait, some places use backticks: `http://localhost:5000/api/batch/${batchId}`
    // If we replace http://localhost:5000 with ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'} it works inside backticks.
    // If it's inside double quotes, it breaks if we just inject ${...}.
    
    // Let's just do a smart regex replacement:
    // Replace "http://localhost:5000/api..." with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api...`
    
    content = content.replace(/"http:\/\/localhost:5000([^"]*)"/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}$1`");
    content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}$1`");
    content = content.replace(/`http:\/\/localhost:5000([^`]*)`/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}$1`");
    
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
  }
});
