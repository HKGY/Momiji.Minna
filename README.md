# 椛とみんな

Kaguya Hana 的博客，<https://椛.みんな>。基于 [Astro](https://astro.build)，部署在 Cloudflare Pages。

## 写作

```sh
npm install
npm run new -- my-slug "文章标题"   # 生成 src/content/posts/YYYYMMDD-my-slug.md（草稿）
npm run dev                          # 本地预览，草稿在这里可见
```

写完后删掉 frontmatter 里的 `draft: true`，`git push` 到 `main` 即自动发布。

- 文章：`src/content/posts/*.md`，文件名即网址（`20240808-data.md` → `/20240808-data.html`）
- 图片：放 `src/assets/`，在 Markdown 里用相对路径引用，构建时自动压缩成 webp
- 攻略合集：`src/content/kancolle/<合集>/`，纯 Markdown 目录树，不需要 frontmatter
  - `README.md` → `/kancolle/<合集>/index.html`，其余 `a/b.md` → `/kancolle/<合集>/a/b.html`
  - 页面标题取正文第一个 `#` 标题；文档之间直接用相对路径链接 `.md`，构建时自动改成 `.html`
  - 图片放在文档旁边用相对路径引用，自动压缩；`_` 开头的目录（如 `_模板`）不发布
  - 新合集要在首页露出，在 `src/pages/index.astro` 顶部的列表里加一行
- 独立页面：`src/pages/`（about、friends、计算器）
- 原样发布的静态文件：`public/`（MUG、ttcg、red.html，以及合集里供下载的 csv 等）
- 站点标题、域名：`src/consts.ts`；样式：`src/styles/global.css`

## 部署（Cloudflare Pages）

Settings → Builds & deployments：

| 项 | 值 |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |

Node 版本由 `.node-version` 指定。
