#!/usr/bin/env node
// build.js — 站点构建脚本，接替 modify.sh
//
// 依赖: marked（npm i marked 或 npm i -g marked 后设 NODE_PATH）
//
// 用法:
//   node build.js <file.md> [标题]   单篇文章：生成同名 .html，居中大标题（原 modify.sh 行为）
//   node build.js --tree <目录>      合集：递归转换目录下所有 .md（README.md → index.html），
//                                    标题取正文第一个 # 标题，页首加返回导航
//
// 生成页面统一使用绝对路径引用 /styles.css /script.js，因此任意深度的子目录都能正常工作。

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;

function readTemplate(name) {
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}

// 模板里对 styles.css / script.js 的相对引用改为绝对路径，子目录页面才能找到
function absolutize(html) {
  return html
    .replace('href="styles.css"', 'href="/styles.css"')
    .replace('src="script.js"', 'src="/script.js"');
}

// GitHub 风格标题锚点：去标点（保留各语言文字/数字/空格/连字符），空格转连字符，转小写
function githubSlug(text, seen) {
  let slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/ /g, '-');
  if (seen) {
    let base = slug, n = 0;
    while (seen.has(slug)) slug = `${base}-${++n}`;
    seen.add(slug);
  }
  return slug;
}

function renderMarkdown(src) {
  const seen = new Set();
  const renderer = {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = text.replace(/<[^>]+>/g, '');
      return `<h${depth} id="${githubSlug(plain, seen)}">${text}</h${depth}>\n`;
    },
  };
  marked.use({ renderer });
  let html = marked.parse(src);
  // 站内相对链接 .md → .html；README.md → index.html
  html = html.replace(/href="(?!https?:\/\/|\/\/|#)([^"]+?)\.md(#[^"]*)?"/g,
    (m, p, hash) => {
      const base = p.replace(/(^|\/)README$/, '$1index');
      return `href="${base}.html${hash || ''}"`;
    });
  return html;
}

function buildPage({ title, bodyHtml, banner, nav }) {
  const t1 = absolutize(readTemplate('template1.html'));
  const t2 = readTemplate('template2.html');
  const t3 = absolutize(readTemplate('template3.html'));
  const parts = [t1, title, '\n', t2];
  if (nav) parts.push(nav, '\n');
  if (banner) parts.push(`<p class="display-4 text-center">${banner}</p>\n`);
  parts.push(bodyHtml, t3);
  return parts.join('');
}

function firstHeading(src) {
  const m = src.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function convertOne(mdPath, banner) {
  const src = fs.readFileSync(mdPath, 'utf8');
  const outPath = mdPath.replace(/\.md$/, '.html');
  const html = buildPage({
    title: banner || firstHeading(src) || path.basename(mdPath, '.md'),
    bodyHtml: renderMarkdown(src),
    banner,
  });
  fs.writeFileSync(outPath, html);
  console.log(`built ${path.relative(ROOT, outPath)}`);
}

function convertTree(dir) {
  const treeRoot = path.resolve(dir);
  const indexUrl = '/' + path.relative(ROOT, treeRoot).split(path.sep).join('/') + '/index.html';
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('_') && entry.name !== 'assets') walk(p); // _模板、assets 不参与构建
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;
      const src = fs.readFileSync(p, 'utf8');
      const isIndex = p === path.join(treeRoot, 'README.md');
      const outPath = isIndex ? path.join(treeRoot, 'index.html') : p.replace(/\.md$/, '.html');
      const nav = `<p><a href="/">« 椛とみんな</a>${isIndex ? '' : ` · <a href="${indexUrl}">合集目录</a>`}</p>`;
      const html = buildPage({
        title: firstHeading(src) || path.basename(p, '.md'),
        bodyHtml: renderMarkdown(src),
        nav,
      });
      fs.writeFileSync(outPath, html);
      console.log(`built ${path.relative(ROOT, outPath)}`);
    }
  };
  walk(treeRoot);
}

const args = process.argv.slice(2);
if (args[0] === '--tree' && args[1]) {
  convertTree(args[1]);
} else if (args[0]) {
  convertOne(args[0], args[1]);
} else {
  console.log('用法: node build.js <file.md> [标题] | node build.js --tree <目录>');
  process.exit(1);
}
