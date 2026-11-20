// 攻略合集（src/content/kancolle/）的网址规则，astro.config 的链接插件和内容集合共用。
//
// 源文件可以随便用中文和序号命名；网址由 frontmatter 里的 slug 决定：
//   2026summer/02-海域攻略/E1/概览.md  +  slug: e1   →   /kancolle/2026summer/e1/
//   2026summer/README.md                               →   /kancolle/2026summer/
// 没写 slug 的页面退回用文件路径当网址，不会构建失败。

/** entry 是相对 src/content/kancolle/ 的路径，返回文档 id，例如 2026summer/e1 */
export function docId(entry: string, slug?: unknown) {
	const [collection, ...rest] = entry.replace(/\.md$/, '').split('/');
	let path = typeof slug === 'string' ? slug : rest.join('/');
	if (path === 'README' || path === 'index') path = '';
	path = path.replace(/^\/+|\/+$/g, '');
	return path ? `${collection}/${path}` : collection;
}

export const docUrl = (id: string) => `/kancolle/${id}/`;

/** 从 Markdown 源码里读 frontmatter 的 slug（链接插件用，不想为此引入 YAML 解析） */
export function slugFromSource(source: string) {
	const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
	const slug = frontmatter && /^slug:\s*(.+?)\s*$/m.exec(frontmatter)?.[1];
	return slug ? slug.replace(/^['"]|['"]$/g, '') : undefined;
}
