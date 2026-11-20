import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

// 攻略合集：没有 frontmatter 的纯 Markdown 目录树，标题取正文第一个 # 标题。
// id 保留原始路径（含中文和序号前缀），这样网址和旧站一致；README → index。
// 以 _ 开头的目录（如 _模板）不参与构建。
const kancolle = defineCollection({
	loader: glob({
		base: './src/content/kancolle',
		pattern: ['**/*.md', '!**/_*/**'],
		generateId: ({ entry }) => entry.replace(/\.md$/, '').replace(/(^|\/)README$/, '$1index'),
	}),
});

export const collections = { posts, kancolle };
