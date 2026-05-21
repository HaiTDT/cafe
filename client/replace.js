const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.json')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const newContent = content
        .replace(/Hasaki\.vn/g, 'Haulecoffee.vn')
        .replace(/hasaki\.vn/g, 'haulecoffee.vn')
        .replace(/Hasaki/g, 'Hậu Lê Coffee')
        .replace(/HASAKI/g, 'HẬU LÊ COFFEE')
        .replace(/hasaki/g, 'haulecoffee');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
console.log('Done!');
