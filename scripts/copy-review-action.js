const fs = require('fs');
const path = require('path');

// 确保 dist 目录存在
if (!fs.existsSync(path.join(__dirname, '../dist'))) {
  fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
}

// 复制 review.action.js 文件到 dist 目录
fs.copyFileSync(
  path.join(__dirname, '../lib/review.action.js'),
  path.join(__dirname, '../dist/review.action.js')
);

console.log('Successfully copied review.action.js to dist directory');