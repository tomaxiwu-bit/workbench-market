/**
 * 把本地审核通过的数据导出到静态版（docs/items.json）
 * 用法：node sync-docs.js
 * 之后：git add docs/items.json && git commit -m "update items" && git push
 * Pages 会自动重新构建，约 1 分钟生效。
 */
const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, 'data', 'store.json');
const OUT = path.join(__dirname, 'docs', 'items.json');

if (!fs.existsSync(DB)) {
  console.error('找不到 data/store.json，先在本地跑一次 server.js 并投稿/审核');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const items = db.items
  .filter(i => i.status === 'approved')
  .map(i => ({
    id: i.id, name: i.name, author: i.author, scene: i.scene, summary: i.summary,
    audience: i.audience, skills: i.skills, plugins: i.plugins, usage: i.usage,
    shareUrl: i.shareUrl, source: i.source, approvedAt: i.approvedAt
  }));

const out = { generatedAt: new Date().toISOString().slice(0, 10), items };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

console.log(`已导出 ${items.length} 条到 docs/items.json（用户 ${items.filter(i => i.source === 'user').length} / 官方 ${items.filter(i => i.source === 'official').length}）`);
console.log('下一步：git add docs/items.json && git commit -m "update items" && git push');
