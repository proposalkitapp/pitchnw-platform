const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\danie\\Downloads\\aurora-scroll-studio-main';
const srcDirs = ['components', 'hooks', 'lib', 'integrations'].map(d => path.join(rootDir, 'src', d));

function addUseClient(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addUseClient(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('"use client"') && !content.includes("'use client'")) {
        content = '"use client";\n\n' + content;
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

srcDirs.forEach(addUseClient);
console.log("Added use client to all src directories");
