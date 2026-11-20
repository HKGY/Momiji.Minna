// @ts-check
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { defineMdastPlugin } from 'satteri';
import { SITE_URL } from './src/consts.ts';
import { docId, docUrl, slugFromSource } from './src/kancolle-docs.ts';

const KANCOLLE_DIR = fileURLToPath(new URL('./src/content/kancolle/', import.meta.url));

/** 合集里指向另一篇 .md 的相对链接 → 那篇文档的网址；不是合集内的 .md 则返回 undefined */
function resolveDocLink(url, fileURL) {
	const [, path, hash = ''] = /^([^#]*\.md)(#.*)?$/.exec(url) ?? [];
	if (!path || !fileURL) return;
	const target = fileURLToPath(new URL(path, fileURL));
	const entry = relative(KANCOLLE_DIR, target).split(sep).join('/');
	if (entry.startsWith('..')) return;
	let source;
	try {
		source = readFileSync(target, 'utf8');
	} catch {
		return; // 目标不存在，原样保留，方便发现死链
	}
	return docUrl(docId(entry, slugFromSource(source))) + hash;
}

/**
 * 让合集里的 Markdown 保持“在 GitHub 上也能直接点”的写法：
 * 文档之间用相对路径链接 .md 文件，构建时换成对应页面的网址。
 *
 * 注意：改了这个插件或某篇文档的 slug 后，要删掉 .astro/ 和 node_modules/.astro/ 再构建，
 * 否则别的文档里指向它的链接会用到旧的渲染缓存。
 */
const mdLinks = defineMdastPlugin({
	name: 'md-links',
	link(node, ctx) {
		// [![图](a.png)](a.png) 这种“点图看原图”的自链接：去掉外层链接，
		// 图片交给 Astro 压缩，点击放大由 Base.astro 里的脚本统一处理
		const [only] = node.children;
		if (node.children.length === 1 && only.type === 'image' && only.url === node.url) {
			ctx.replaceNode(node, { type: 'image', url: only.url, alt: only.alt, title: only.title });
			return;
		}
		if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(node.url)) return;
		const url = resolveDocLink(node.url, ctx.fileURL);
		if (url) ctx.setProperty(node, 'url', url);
	},
});

/**
 * 旧网址（/20240808-data.html 之类）→ 新网址的跳转页，列表在 legacy-redirects.json。
 * 生成的是普通静态 HTML，不依赖托管平台的重定向功能；锚点（#xxx）会带过去。
 * 旧网址去掉 .html 后不能和新目录重名（如 /about.html 与 /about/），那种放 public/_redirects。
 */
function legacyRedirects() {
	return {
		name: 'legacy-redirects',
		hooks: {
			'astro:build:done': ({ dir, logger }) => {
				const redirects = JSON.parse(readFileSync(new URL('./legacy-redirects.json', import.meta.url), 'utf8'));
				for (const [from, to] of Object.entries(redirects)) {
					const file = fileURLToPath(new URL(`.${from}`, dir));
					const href = encodeURI(to);
					mkdirSync(dirname(file), { recursive: true });
					writeFileSync(
						file,
						`<!doctype html><meta charset="utf-8"><title>Redirecting…</title>` +
							`<link rel="canonical" href="${SITE_URL}${href}"><meta name="robots" content="noindex">` +
							`<script>location.replace(${JSON.stringify(href)} + location.hash)</script>` +
							`<meta http-equiv="refresh" content="0;url=${href}"><a href="${href}">${to}</a>\n`,
					);
				}
				logger.info(`${Object.keys(redirects).length} legacy redirect pages`);
			},
		},
	};
}

export default defineConfig({
	site: SITE_URL,
	// 干净网址：/posts/foo/、/kancolle/、/tags/Kancolle/
	trailingSlash: 'always',
	integrations: [sitemap(), legacyRedirects()],
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
		},
		processor: satteri({ mdastPlugins: [mdLinks] }),
	},
});
