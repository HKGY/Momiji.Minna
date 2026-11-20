// 专栏：在文章 frontmatter 里写 column: <id> 就归入对应专栏。
// 新增专栏在这里加一项，会自动生成 /<id>/ 专栏页并出现在首页。
export const COLUMNS = {
	kancolle: {
		title: 'Kancolle 专栏',
		short: 'Kancolle',
		description: '舰队Collection 的攻略、工具与杂谈',
	},
} as const;

export type ColumnId = keyof typeof COLUMNS;
export const COLUMN_IDS = Object.keys(COLUMNS) as [ColumnId, ...ColumnId[]];
export const columnUrl = (id: ColumnId) => `/${id}/`;
