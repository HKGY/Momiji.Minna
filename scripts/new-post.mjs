// 用法: npm run new -- <slug> [标题] [--column <专栏 id>] [--tags a,b]
// 生成 src/content/posts/YYYYMMDD-<slug>.md（草稿）
import { existsSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
let column;
const ci = args.indexOf('--column');
if (ci !== -1) [, column] = args.splice(ci, 2);
let tags;
const ti = args.indexOf('--tags');
if (ti !== -1) [, tags] = args.splice(ti, 2);

const [slug, ...rest] = args;
if (!slug || !/^[a-z0-9-]+$/.test(slug) || (ci !== -1 && !column) || (ti !== -1 && !tags)) {
	console.error('用法: npm run new -- <slug> [标题] [--column <专栏 id>] [--tags a,b]   (slug 只能用小写字母、数字和 -)');
	process.exit(1);
}
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ymd = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())];
const file = new URL(`../src/content/posts/${ymd.join('')}-${slug}.md`, import.meta.url);
if (existsSync(file)) {
	console.error(`已存在: ${file.pathname}`);
	process.exit(1);
}
const title = rest.join(' ') || slug;
const frontmatter = [
	`title: ${JSON.stringify(title)}`,
	`date: ${ymd.join('-')}`,
	'description: ""',
	...(column ? [`column: ${column}`] : []),
	`tags: [${(tags ?? '').split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).join(', ')}]`,
	'draft: true',
];
writeFileSync(file, `---\n${frontmatter.join('\n')}\n---\n\n`);
console.log(`已创建 ${file.pathname}\n网址会是 /${column ?? 'posts'}/${slug}/ ，写完后删掉 draft: true 即可发布。`);
