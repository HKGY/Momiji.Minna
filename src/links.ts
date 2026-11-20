import type { ColumnId } from './columns';

// 合集 / 游戏 / 工具是手工维护的入口，新增时在这里加一行。
// 带 column 的条目只出现在对应专栏页，不在首页重复列出。
export interface SiteLink {
	date: string;
	title: string;
	href: string;
	note?: string;
	column?: ColumnId;
}

export const collections: SiteLink[] = [
	{
		date: '2026-07',
		title: '舰これ 2026夏活 全甲攻略合集',
		href: '/kancolle/2026summer/',
		note: '反撃！第三十一戦隊の戦い ＋ フランス艦隊の躍動 · 五图全甲 · 攻略／捞船／出击总账',
		column: 'kancolle',
	},
];

export const games: SiteLink[] = [
	{
		date: '2026-08',
		title: 'TTCG 推特头像卡牌对战',
		href: '/ttcg/index.html',
		note: '100 位网友头像重绘卡牌 · 与 AI 对战 · 绘画千人斩企划',
	},
];

export const tools: SiteLink[] = [
	{
		date: '2026',
		title: 'Multiplier Calculator 2026',
		href: '/kancolle/calculator-2026/',
		note: '2026夏活倍卡 · 多舰娘同时计算',
		column: 'kancolle',
	},
	{
		date: '2024',
		title: 'Multiplier Calculator 2024',
		href: '/kancolle/calculator-2024/',
		column: 'kancolle',
	},
];
