// 生成分享卡片用的默认图片 public/og.png（头像铺在站点底色上）。
// 头像换了之后重新跑一次: node scripts/make-og.mjs
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const path = (rel) => fileURLToPath(new URL(rel, import.meta.url));

const size = 600;
const avatar = await sharp(path('../src/assets/avatar.png'))
	.resize(440, 440)
	.toBuffer();

await sharp({ create: { width: size, height: size, channels: 3, background: '#fbfaf9' } })
	.composite([{ input: avatar, gravity: 'centre' }])
	.png()
	.toFile(path('../public/og.png'));

console.log('已生成 public/og.png');
