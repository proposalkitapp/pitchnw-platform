const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\danie\\Downloads\\aurora-scroll-studio-main';
const srcDir = path.join(rootDir, 'src');

function fixEnvVars(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixEnvVars(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('import.meta.env')) {
        content = content.replace(/import\.meta\.env/g, 'process.env');
        fs.writeFileSync(fullPath, content);
      }
      if (content.includes('VITE_')) {
        content = content.replace(/VITE_/g, 'NEXT_PUBLIC_');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

fixEnvVars(srcDir);

// Also update .env and .env.local if they exist
['.env', '.env.local'].forEach(envFile => {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/VITE_/g, 'NEXT_PUBLIC_');
    fs.writeFileSync(envPath, content);
  }
});

console.log("Fixed environment variables");
