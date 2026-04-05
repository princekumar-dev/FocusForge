import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const targetDir = path.join(__dirname, 'src');
const files = walk(targetDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(/min-h-screen/g, 'min-h-[100dvh]');
  newContent = newContent.replace(/h-screen([\s"])/g, 'h-[100dvh]$1');
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated ' + f);
  }
});
