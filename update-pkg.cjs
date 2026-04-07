const fs = require('fs');
const pkgPath = 'c:\\Users\\danie\\Downloads\\aurora-scroll-studio-main\\package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

delete pkg.dependencies['react-router-dom'];
delete pkg.devDependencies['vite'];
delete pkg.devDependencies['@vitejs/plugin-react-swc'];
delete pkg.devDependencies['vitest'];
delete pkg.devDependencies['eslint-plugin-react-refresh'];

pkg.dependencies['next'] = '^14.2.3';
pkg.dependencies['lucide-react'] = '^0.263.1';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('package.json dependencies updated.');
