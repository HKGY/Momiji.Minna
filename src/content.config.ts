import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { COLUMN_IDS } from './columns';
import { docId } from './kancolle-docs';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		// 所属专栏，可选；可用的 id 见 src/columns.ts
		column: z.enum(COLUMN_IDS).optional(),
		// hashtag，不用写 #；不能含 / 和空白，因为会直接用作 /tags/<tag>.html 的文件名
		tags: z.array(z.string().regex(/^[^\s\/#]+$/, 'tag 不能含空白、/ 或 #')).default([]),
		draft: z.boolean().default(false),
	}),
});

// 攻略合集：纯 Markdown 目录树，标题取正文第一个 # 标题。
// 网址由 frontmatter 的 slug 决定（规则见 src/kancolle-docs.ts），源文件名可以保留中文和序号。
// 以 _ 开头的目录（如 _模板）不参与构建。
const kancolle = defineCollection({
	loader: glob({
		base: './src/content/kancolle',
		pattern: ['**/*.md', '!**/_*/**'],
		generateId: ({ entry, data }) => docId(entry, data.slug),
	}),
	schema: z.object({
		slug: z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, 'slug 只能用小写字母、数字、- 和 /').optional(),
	}),
});

export const collections = { posts, kancolle };
