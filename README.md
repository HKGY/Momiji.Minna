# 椛とみんな

Kaguya Hana 的博客，<https://椛.みんな>。基于 [Astro](https://astro.build)，部署在 Cloudflare Pages。

## 写作

```sh
npm install
npm run new -- my-slug "文章标题"   # 生成 src/content/posts/YYYYMMDD-my-slug.md（草稿）
npm run dev                          # 本地预览，草稿在这里可见
```

写完后删掉 frontmatter 里的 `draft: true`，`git push` 到 `main` 即自动发布。

### 网址

| 内容 | 源文件 | 网址 |
| --- | --- | --- |
| 普通文章 | `src/content/posts/20240808-my-slug.md` | `/posts/my-slug/` |
| 专栏文章（`column: kancolle`） | 同上 | `/kancolle/my-slug/` |
| 专栏页 | `src/columns.ts` | `/kancolle/` |
| 合集文档 | `src/content/kancolle/2026summer/…/概览.md` + `slug: e1` | `/kancolle/2026summer/e1/` |
| Tag | 自动生成 | `/tags/Kancolle/` |
| 独立页面 | `src/pages/about.md` | `/about/` |

文件名里的日期只用来在文件夹里排序，网址不带它；文章日期以 frontmatter 的 `date` 为准。

### Hashtag

在 frontmatter 里写 `tags: [Kancolle, 工具]`（不用带 `#`，不能含空格和 `/`），或者新建时带 `--tags Kancolle,工具`。文章页标题下会显示 `#Kancolle #工具`，点击进入该 tag 的文章列表；全部 tag 在 `/tags/`。tag 页是自动生成的，不需要登记。

### 专栏

在文章 frontmatter 里加 `column: kancolle`（或新建时带 `--column kancolle`）就归入 Kancolle 专栏：

```sh
npm run new -- my-slug "文章标题" --column kancolle
```

专栏页汇总该专栏的文章，以及 `src/links.ts` 里标了同一专栏的合集和工具。归入专栏的文章、合集和工具只在专栏页列出，首页只保留专栏入口；文章仍然会进 RSS 和 tag 页。要开新专栏，在 `src/columns.ts` 里加一项即可。

注意专栏文章、合集和工具共用 `/kancolle/` 这一层，文章的 slug 不要和合集名（`2026summer`）或工具页（`calculator-2026`）重名。

### 攻略合集

`src/content/kancolle/<合集>/` 是一棵纯 Markdown 目录树，文件和文件夹可以用中文、带序号。

- 每篇文档开头写 `slug`，决定它在合集里的网址；`README.md` 是合集目录页，不用写：
  ```yaml
  ---
  slug: sorties/e1
  ---
  ```
  没写 `slug` 的文档会退回用文件路径当网址。
- 页面标题取正文第一个 `#` 标题。
- 文档之间直接用相对路径链接 `.md` 文件（在 GitHub 上也能点），构建时自动换成对应网址。
- 图片放在文档旁边用相对路径引用，自动压缩；`_` 开头的目录（如 `_模板`）不发布。
- 新合集要露出，在 `src/links.ts` 里加一行（带 `column` 的进专栏页，不带的进首页）。

### 其他

- 文章图片：放 `src/assets/`，在 Markdown 里用相对路径引用，构建时自动压缩成 webp
- 原样发布的静态文件：`public/`（MUG、ttcg、red.html，以及合集里供下载的 csv 等）
- 站点标题、域名：`src/consts.ts`；样式：`src/styles/global.css`
- 分享卡片（X / Telegram 等的链接预览）：标题和摘要取自文章的 `title`、`description`，图片是 `public/og.png`；换头像后跑 `node scripts/make-og.mjs` 重新生成

## 旧网址

改版前的网址（`/20240808-data.html`、`/kancolle/2026summer/02-海域攻略/E1/概览.html` 等）都会跳转到新网址：

- `legacy-redirects.json`：构建时为每一条生成一个静态跳转页
- `public/_redirects`：`/about.html`、`/friends.html` 这两条走 Cloudflare 的重定向（它们的跳转页会和新目录重名）

以后给页面改名时，把旧网址加进 `legacy-redirects.json` 就不会断链。

## 部署（Cloudflare Pages）

Settings → Builds & deployments：

| 项 | 值 |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |

Node 版本由 `.node-version` 指定。
