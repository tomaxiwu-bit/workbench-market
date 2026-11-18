/**
 * 工作台市集 · 零依赖 Node 服务
 * 功能：静态页托管 + 市集列表 API + 投稿 + 审核后台
 * 启动：node server.js      （默认 http://localhost:8686）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const CFG_FILE = path.join(ROOT, 'config.json');
const PORT = Number(process.env.PORT || 8686);

const SCENES = ['金融投研', '医疗健康', '教育教学', '创意设计', '营销增长', '写作出版',
  '人力资源', '财务行政', '求职发展', '法律事务', '数据分析', '科研学术', '电商运营', '其他'];

const LIMITS = {
  name: 30, summary: 200, audience: 80, usage: 1000,
  author: 20, contact: 60, skill: 24, skills: 12, link: 300
};

// ---------- 存储 ----------
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readConfig() {
  if (fs.existsSync(CFG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); } catch (e) { }
  }
  const cfg = { adminToken: crypto.randomBytes(12).toString('base64url'), createdAt: new Date().toISOString() };
  fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  return cfg;
}
function loadDB() {
  ensureDirs();
  if (fs.existsSync(DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { }
  }
  const db = { items: seedItems(), nextId: 1, reports: [] };
  db.nextId = db.items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
  saveDB(db);
  return db;
}
function saveDB(db) {
  ensureDirs();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

const now = () => new Date().toISOString();
function item(o) {
  return Object.assign({
    id: 0, name: '', author: '', scene: '其他', summary: '', audience: '',
    skills: [], plugins: [], usage: '', shareUrl: '', contact: '',
    source: 'user', status: 'approved', note: '', copies: 0, likes: 0,
    createdAt: now(), approvedAt: now(), reports: 0
  }, o);
}

function seedItems() {
  const off = (name, scene, summary, audience, skills, plugins, usage) => item({
    name, scene, summary, audience, skills, plugins, usage,
    author: '豆包工作 · 官方预置', source: 'official', status: 'approved', shareUrl: ''
  });
  return [
    off('高校学生工作台', '教育教学',
      '围绕课业、竞赛、升学与实习准备，把学生阶段高频任务收在一个空间里。',
      '本科生 / 研究生',
      ['论文精读', '文献综述', '竞赛方案', '简历润色', '课程笔记整理'],
      ['本地电脑', '云盘'],
      '豆包工作电脑版 → 左侧「工作台」入口切到该工作台即可，无需导入链接。'),
    off('求职发展工作台', '求职发展',
      '从岗位调研、简历改写、面试题库到 offer 对比，一条链路走完。',
      '应届生 / 转岗人群',
      ['岗位调研', '简历定制', '模拟面试', 'offer 对比', '面试复盘'],
      ['企业知识', '招聘网站连接器'],
      '电脑版切到该工作台后，先在输入框上方补一句目标岗位与年限，命中率更高。'),
    off('金融投研工作台', '金融投研',
      '公告解读、业绩分析、市场简报、公司研究等投研常用入口预置好，接专业数据插件。',
      '研究员 / 投资从业者',
      ['公告解读', '业绩分析', '市场简报', '公司研究', '估值建模'],
      ['万得', '同花顺', '国泰海通'],
      '涉及专业数据时需先按提示授权数据终端账号，否则只能读公开资料。'),
    off('营销工作台', '营销增长',
      '从人群洞察到内容排期、投放素材、活动复盘，营销全链路任务模板。',
      '市场 / 运营 / 增长',
      ['人群洞察', '内容日历', '投放素材', '活动策划', '复盘报告'],
      ['创意视频', '海报设计'],
      '投放素材建议先给品牌调性与禁用词清单，生成结果可直接进画布批量延展。'),
    off('创意设计工作台', '创意设计',
      '海报、社媒配图、品牌视觉、种草视频等创意任务，自动建画布统一管理。',
      '设计师 / 内容创作者',
      ['海报设计', '社媒配图', '品牌视觉', '种草视频', '图片生成'],
      ['创意视频', '图片生成'],
      '任务开启后系统会自动建画布，同一套创意可延展成系列物料。'),
    off('教师工作台', '教育教学',
      '输入课题、教材与教学要求即可生成教案课件，还能把题目做成可交互演示。',
      '中小学 / 高校教师',
      ['教案生成', '课件制作', '互动实验', '试题解析', '班主任助手'],
      ['学科网连接器'],
      '生成课件前说明学段、课时与教学目标，结果更贴近课堂实际。'),
    off('医生工作台', '医疗健康',
      '临床指南查找、文献检索解读、科普与患者沟通材料、科研汇报材料。',
      '临床医生 / 医学科研',
      ['临床指南查找', '文献解读', '科普材料', '患者沟通', '科研汇报'],
      ['医学文献库'],
      '所有输出仅作为循证参考，不能替代临床判断与正式诊疗文书。'),
    off('数据分析工作台', '数据分析',
      '数据清洗、指标拆解、可视化看板与业务复盘，一套流程跑完。',
      '分析师 / 业务负责人',
      ['数据清洗', '指标拆解', '图表生成', '看板搭建', '复盘报告'],
      ['本地电脑', '多维表格'],
      '把原始表放进项目文件夹再让 AI 读取，比直接贴文本更稳。')
  ];
}

// ---------- 工具 ----------
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}
function clean(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
function cleanMulti(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
}
function allowHost(u) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    const ok = ['doubao.com', 'www.doubao.com', 'doubao.link', 'www.doubao.link',
      'feishu.cn', 'www.feishu.cn', 'larksuite.com'];
    return ok.some(d => h === d || h.endsWith('.' + d));
  } catch (e) { return false; }
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > 128 * 1024) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const t = Date.now();
  const arr = (buckets.get(key) || []).filter(x => t - x < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return false; }
  arr.push(t); buckets.set(key, arr);
  return true;
}
function clientIp(req) {
  const f = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(f) ? f[0] : (f || '').split(',')[0]) || req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

// ---------- 路由 ----------
async function handle(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;
  const method = req.method.toUpperCase();

  if (p === '/api/health') return json(res, 200, { ok: true, time: now() });

  const db = loadDB();
  const cfg = readConfig();

  // 公开列表
  if (p === '/api/meta' && method === 'GET') {
    const pub = db.items.filter(i => i.status === 'approved');
    return json(res, 200, {
      ok: true,
      scenes: SCENES,
      stats: {
        total: pub.filter(i => i.source === 'user').length,
        official: pub.filter(i => i.source === 'official').length,
        authors: new Set(pub.filter(i => i.source === 'user').map(i => i.author)).size,
        copies: pub.reduce((s, i) => s + (i.copies || 0), 0)
      }
    });
  }

  if (p === '/api/items' && method === 'GET') {
    const scene = u.searchParams.get('scene') || '';
    const q = (u.searchParams.get('q') || '').toLowerCase().slice(0, 40);
    const sort = u.searchParams.get('sort') || 'new';
    const source = u.searchParams.get('source') || '';
    let list = db.items.filter(i => i.status === 'approved');
    if (scene) list = list.filter(i => i.scene === scene);
    if (source) list = list.filter(i => i.source === source);
    if (q) list = list.filter(i => (i.name + i.summary + i.author + i.skills.join('')).toLowerCase().includes(q));
    list.sort((a, b) => sort === 'hot'
      ? (b.copies || 0) - (a.copies || 0) || String(b.approvedAt).localeCompare(a.approvedAt)
      : String(b.approvedAt).localeCompare(a.approvedAt));
    return json(res, 200, { ok: true, total: list.length, items: list.slice(0, 200) });
  }

  const mItem = p.match(/^\/api\/items\/(\d+)(?:\/(copy|report))?$/);
  if (mItem) {
    const id = Number(mItem[1]);
    const act = mItem[2];
    const it = db.items.find(i => i.id === id && i.status === 'approved');
    if (!it) return json(res, 404, { ok: false, error: '条目不存在' });
    if (!act && method === 'GET') return json(res, 200, { ok: true, item: it });
    if (act === 'copy' && method === 'POST') {
      it.copies = (it.copies || 0) + 1;
      saveDB(db);
      return json(res, 200, { ok: true, copies: it.copies });
    }
    if (act === 'report' && method === 'POST') {
      if (!rateLimit('report:' + clientIp(req), 10, 3600e3))
        return json(res, 429, { ok: false, error: '举报过于频繁，请稍后再试' });
      const body = await readBody(req).catch(() => ({}));
      it.reports = (it.reports || 0) + 1;
      db.reports.push({ id: it.id, reason: clean(body.reason, 100), at: now(), ip: clientIp(req) });
      saveDB(db);
      return json(res, 200, { ok: true });
    }
    return json(res, 405, { ok: false, error: 'method not allowed' });
  }

  // 投稿
  if (p === '/api/items' && method === 'POST') {
    if (!rateLimit('submit:' + clientIp(req), 5, 3600e3))
      return json(res, 429, { ok: false, error: '提交过于频繁，请一小时后再试' });
    let body;
    try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: '数据格式错误' }); }

    const name = clean(body.name, LIMITS.name);
    const summary = clean(body.summary, LIMITS.summary);
    const scene = SCENES.includes(body.scene) ? body.scene : '其他';
    const shareUrl = clean(body.shareUrl, LIMITS.link);
    const skills = Array.isArray(body.skills)
      ? body.skills.map(s => clean(s, LIMITS.skill)).filter(Boolean).slice(0, LIMITS.skills)
      : String(body.skills || '').split(/[,，、;；\n]/).map(s => clean(s, LIMITS.skill)).filter(Boolean).slice(0, LIMITS.skills);

    if (name.length < 2) return json(res, 400, { ok: false, error: '工作台名称至少 2 个字' });
    if (summary.length < 6) return json(res, 400, { ok: false, error: '简介至少 6 个字，说清它是做什么的' });
    if (!shareUrl) return json(res, 400, { ok: false, error: '请填写工作台的分享链接' });
    if (!allowHost(shareUrl)) return json(res, 400, { ok: false, error: '链接需为豆包 / 飞书域名下的分享链接' });
    if (body.agree !== true) return json(res, 400, { ok: false, error: '请先确认投稿须知' });

    const rec = item({
      id: db.nextId++,
      name, scene, summary,
      author: clean(body.author, LIMITS.author) || '匿名贡献者',
      audience: clean(body.audience, LIMITS.audience),
      skills,
      plugins: String(body.plugins || '').split(/[,，、;；\n]/).map(s => clean(s, LIMITS.skill)).filter(Boolean).slice(0, 8),
      usage: cleanMulti(body.usage, LIMITS.usage),
      shareUrl,
      contact: clean(body.contact, LIMITS.contact),
      source: 'user', status: 'pending',
      copies: 0, likes: 0, createdAt: now(), approvedAt: null
    });
    db.items.push(rec);
    saveDB(db);
    return json(res, 201, { ok: true, id: rec.id, status: 'pending', message: '已提交，审核通过后展示' });
  }

  // 管理接口
  if (p === '/api/admin/items' && method === 'GET') {
    if (req.headers['x-admin-token'] !== cfg.adminToken) return json(res, 401, { ok: false, error: '口令错误' });
    const st = u.searchParams.get('status') || 'pending';
    const list = db.items.filter(i => i.status === st).sort((a, b) => String(b.createdAt).localeCompare(a.createdAt));
    return json(res, 200, { ok: true, items: list, counts: {
      pending: db.items.filter(i => i.status === 'pending').length,
      approved: db.items.filter(i => i.status === 'approved').length,
      rejected: db.items.filter(i => i.status === 'rejected').length
    } });
  }

  const mAdmin = p.match(/^\/api\/admin\/items\/(\d+)$/);
  if (mAdmin) {
    if (req.headers['x-admin-token'] !== cfg.adminToken) return json(res, 401, { ok: false, error: '口令错误' });
    const id = Number(mAdmin[1]);
    const idx = db.items.findIndex(i => i.id === id);
    if (idx < 0) return json(res, 404, { ok: false, error: '条目不存在' });
    if (method === 'DELETE') {
      db.items.splice(idx, 1);
      saveDB(db);
      return json(res, 200, { ok: true });
    }
    if (method === 'POST') {
      const body = await readBody(req).catch(() => ({}));
      const it = db.items[idx];
      if (body.action === 'approve') { it.status = 'approved'; it.approvedAt = now(); it.note = clean(body.note, 60); }
      else if (body.action === 'reject') { it.status = 'rejected'; it.note = clean(body.note, 60) || '不符合投稿要求'; }
      else return json(res, 400, { ok: false, error: '未知操作' });
      saveDB(db);
      return json(res, 200, { ok: true });
    }
  }

  // 静态资源
  if (method === 'GET') return serveStatic(p, res);
  return json(res, 404, { ok: false, error: 'not found' });
}

function serveStatic(p, res) {
  let rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
  if (rel === 'admin' || rel === 'submit') rel = 'index.html';
  if (rel.includes('..')) return json(res, 400, { ok: false, error: 'bad path' });
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR) || !fs.existsSync(file) || !fs.statSync(file).isFile())
    return json(res, 404, { ok: false, error: 'not found' });
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

ensureDirs();
loadDB();
const cfg = readConfig();
http.createServer((req, res) => {
  handle(req, res).catch(err => {
    console.error('[error]', err.message);
    if (!res.headersSent) json(res, 500, { ok: false, error: 'server error' });
  });
}).listen(PORT, () => {
  console.log(`工作台市集已启动：http://localhost:${PORT}`);
  console.log(`管理口令：${cfg.adminToken}   （写在 config.json，改完重启生效）`);
});
