import { type CollectionEntry, getCollection } from 'astro:content';

type Post = CollectionEntry<'posts'>;

/** 已发布文章，新的在前。草稿只在 dev 下可见。 */
export async function getPosts() {
	const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 文件名 20240808-my-slug.md 里的日期只用来在文件夹里排序，网址不带它 */
export const postSlug = (post: Post) => post.id.replace(/^\d{8}-/, '');

/** 专栏文章在 /<专栏>/<slug>/，其余在 /posts/<slug>/ */
export const postUrl = (post: Post) => `/${post.data.column ?? 'posts'}/${postSlug(post)}/`;

export const formatDate = (d: Date) => d.toISOString().slice(0, 10);

/** 文章 → 首页 / 专栏页列表里的一行 */
export const postItem = (post: Post) => ({
	date: formatDate(post.data.date),
	title: post.data.title,
	href: postUrl(post),
	column: post.data.column,
});

/** 给文章页用：每篇文章带上前后篇 */
export async function getPostsWithNeighbors() {
	const posts = await getPosts();
	return posts.map((post, i) => ({ post, newer: posts[i - 1], older: posts[i + 1] }));
}

export const tagUrl = (tag: string) => `/tags/${tag}/`;

/** 所有 tag 及其文章数，文章多的在前 */
export async function getTags() {
	const counts = new Map<string, number>();
	for (const post of await getPosts()) {
		for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
