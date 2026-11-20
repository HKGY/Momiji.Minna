// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { defineMdastPlugin } from 'satteri';
import { SITE_URL } from './src/consts.ts';

/**
 * 让合集里的 Markdown 保持“在 GitHub 上也能直接点”的写法：
 * 站内相对链接 foo.md → foo.html、README.md → index.html。
 *
 * 注意：改了这个插件后要删掉 .astro/ 和 node_modules/.astro/ 再构建，否则会用到旧的渲染缓存。
 */
const mdLinks = defineMdastPlugin({
	name: 'md-links',
	link(node, ctx) {
		// [![图](a.png)](a.png) 这种“点图看原图”的自链接：去掉外层链接，
		// 图片交给 Astro 压缩，点击放大由 Doc.astro 里的脚本统一处理
		const [only] = node.children;
		if (node.children.length === 1 && only.type === 'image' && only.url === node.url) {
			ctx.replaceNode(node, { type: 'image', url: only.url, alt: only.alt, title: only.title });
			return;
		}
		if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(node.url)) return;
		const url = node.url
			.replace(/\.md(#.*)?$/, (_, hash = '') => `.html${hash}`)
			.replace(/(^|\/)README\.html/, '$1index.html');
		if (url !== node.url) ctx.setProperty(node, 'url', url);
	},
});

export default defineConfig({
	site: SITE_URL,
	// 按源文件结构输出：about.md → /about.html，目录下的 index → /dir/index.html，保持旧链接不失效
	build: { format: 'preserve' },
	integrations: [sitemap()],
	markdown: {
		shikiConfig: {
			themes: { light: 'github-light', dark: 'github-dark' },
		},
		processor: satteri({ mdastPlugins: [mdLinks] }),
	},
});
