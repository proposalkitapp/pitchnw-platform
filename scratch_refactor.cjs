const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('pages_old')) {
        results = results.concat(walk(file));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(file);
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('./src').concat(walk('./supabase'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/plan === "pro"/g, 'plan === "standard"');
  content = content.replace(/plan === 'pro'/g, "plan === 'standard'");
  content = content.replace(/\bisPro\b/g, 'isStandard');
  content = content.replace(/isProUser/g, 'isStandardUser');
  content = content.replace(/proUsers/g, 'standardUsers');
  content = content.replace(/proUser/g, 'standardUser');
  content = content.replace(/DODO_PRO_PRODUCT_ID/g, 'DODO_STANDARD_PRODUCT_ID');
  content = content.replace(/Upgrade to Pro/g, 'Upgrade to Standard');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
