import { getCollection } from 'astro:content';

/** 已发布文章，新的在前。草稿只在 dev 下可见。 */
export async function getPosts() {
	const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postUrl = (id: string) => `/${id}.html`;

export const formatDate = (d: Date) => d.toISOString().slice(0, 10);
