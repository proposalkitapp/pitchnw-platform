const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\danie\\Downloads\\aurora-scroll-studio-main';
const srcDir = path.join(rootDir, 'src');

function fixRouter(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixRouter(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('const navigate = useRouter()') || content.includes('navigate=')) {
        content = content.replace(/const navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
        content = content.replace(/navigate\(([^)]+)\)/g, 'router.push($1)');
        // Fix location.pathname -> location (since usePathname returns string)
        content = content.replace(/location\.pathname/g, 'location');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

fixRouter(srcDir);
console.log("Fixed useRouter and usePathname");
