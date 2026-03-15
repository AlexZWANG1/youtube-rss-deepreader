# YouTube RSS Deep Reader v1.2 — AI 驱动的 YouTube 内容阅读器

## 不看视频也能掌握科技前沿

**GitHub**: https://github.com/AlexZWANG1/youtube-rss-deepreader

---

### 痛点

订阅了 10+ 个科技 YouTube 频道（No Priors、Lex Fridman、All-In Podcast...），每周 20-30 小时的内容根本看不完。但又不想错过关键信息。

### 解决方案

**YouTube RSS Deep Reader** — 一个本地运行的 AI 工具，通过 RSS 监控 YouTube 频道更新，自动拉取视频字幕，然后用 AI 生成：

1. **快速摘要** — 一段话告诉你这期聊了啥、谁在聊、关键结论是什么
2. **深度博文** — 参考 @宝玉 风格的完整长文，带双语引文、事实表格、结论式小标题，可以直接发布
3. **AI 配图** — 通过 Gemini 生成博客封面（可选）

### v1.2 新功能

- **一键批量摘要** — 点一下为所有视频生成摘要，实时进度条显示进度
- **数据持久化** — 生成的摘要和博文不会因为刷新页面丢失
- **OPML 导入/导出** — 可以从其他 RSS 阅读器导入订阅，也可以导出备份
- **搜索 + 快捷键** — `Ctrl+K` 快速搜索，按标题/频道/内容过滤
- **移动端适配** — 手机上也能用，侧边栏可折叠

### 技术栈

- **零构建工具** — 一个 HTML 文件 + 一个 ~190 行的 Node.js 服务
- **兼容任何 OpenAI 接口** — 官方 API、EasyCLI、LiteLLM、Ollama 都行
- **SSE 流式输出** — 实时看到 AI 写文章的过程
- **文件保存系统** — 生成的文章自动保存为 Markdown，带 frontmatter 元数据

### 内置 14 个 AI/科技频道

No Priors (a16z) · a16z · Lex Fridman · Dwarkesh Patel · TheAIGRID · All-In Podcast · Two Minute Papers · AI Explained · Matthew Berman · Andrej Karpathy · Yannic Kilcher · ML Street Talk · Wes Roth · Matt Wolfe

### 快速开始

```bash
git clone https://github.com/AlexZWANG1/youtube-rss-deepreader.git
cd youtube-rss-deepreader
npm install
npm start
# 打开 http://localhost:3001
```

在 Settings 里配置你的 AI API endpoint 和 key 就行。

### 工作流

```
订阅频道 → 刷新 → AI 摘要（一键） → 深度博文 → 保存/复制 → 发布
```

### 适用场景

- **科技博主** — 快速把英文播客转化为中文深度文章
- **投资人/分析师** — 跟踪 AI 行业动态，不用花时间看完整视频
- **内容创作者** — 小红书/公众号素材来源
- **研究者** — 跟踪技术前沿，快速了解最新论文讨论
- **独立开发者** — 保持技术敏锐度，高效获取行业信息

### 博文风格

生成的文章参考 @宝玉 (dotey) 的科技博客风格：
- 开头 Facts 表格总结关键数据
- 要点速览（4-5 条核心判断）
- 结论式小标题（不用问句）
- 双语引文：中文翻译 + 英文原文
- 所有观点归因发言者，保持客观
- 【注：...】解释专业术语

### 开源贡献

MIT License，欢迎 PR！一些可以做的方向：
- 自动摘要（刷新时自动生成）
- 导出到 Notion/Obsidian
- 播客 RSS 支持
- 多语言摘要
- Docker 部署支持
- 浏览器扩展版

---

**#AI #YouTube #RSS #OpenSource #内容创作 #科技 #效率工具 #开源项目**
