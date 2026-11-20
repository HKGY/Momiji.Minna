// 用法: npm run new -- <slug> [标题]
// 生成 src/content/posts/YYYYMMDD-<slug>.md（草稿）
import { existsSync, writeFileSync } from 'node:fs';

const [slug, ...rest] = process.argv.slice(2);
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
	console.error('用法: npm run new -- <slug> [标题]   (slug 只能用小写字母、数字和 -)');
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
writeFileSync(
	file,
	`---\ntitle: ${JSON.stringify(title)}\ndate: ${ymd.join('-')}\ndescription: ""\ndraft: true\n---\n\n`,
);
console.log(`已创建 ${file.pathname}\n写完后删掉 draft: true 即可发布。`);
