# 诗文笺

高中古诗文注释与伴读。

从 [ToolBox](https://github.com/JoshZ-zzx/ToolBox/blob/main/ClassicalChinese.html) 独立拆出的古诗文学习工具。收录 **71 篇课文、2349 条原始注释**，保留搜索、随文注释、同词例句、收藏、自测与阅读位置。

**[在线使用](https://joshz-zzx.github.io/shiwenjian/)** · [域名与部署说明](docs/deployment.md) · [后续扩展方向](docs/roadmap.md)

## 使用

按篇目阅读，点击带点线的词句查看注释；也可搜索词条、原句、释义或篇名，并按册次筛选。收藏、最近查询、自测设置与阅读位置仅存于当前浏览器。

更换域名不会自动迁移本地记录。旧版仍在 ToolBox 保留，切换前可继续从旧站查看原有收藏；新仓库沿用原数据顺序和存储键，但不同域名的浏览器存储相互隔离。本次不自动跳转或删除旧入口。

## 项目结构

```text
index.html                 页面骨架，Pages 的首页
assets/styles.css          响应式样式
src/app.js                 页面交互、路由、收藏与浏览器存储
src/core.js                检索、转义、高亮和文本定位纯函数
data/annotations.js        2349 条注释，当前编号由数组顺序决定
data/lessons.js             册次、篇目目录与注释数量
data/texts.js               71 篇课文原文
data/provenance.json        来源版本、数据数量和校验摘要
scripts/build-offline.mjs   可选：生成离线单文件
tests/core.test.js          数据完整性与核心逻辑检查
docs/                      部署与扩展说明
```

这是无第三方运行依赖的静态站点，不必安装框架或构建即可部署。在线版使用相对资源路径，兼容仓库子路径与独立域名。

## 本地开发与离线版

在线版使用 ES Modules，请通过本地 HTTP 服务预览，不要直接双击 `index.html`：

```sh
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000
```

安装 Node.js 后可以运行：

```sh
npm test
npm run build:offline
```

生成的 `dist/shiwenjian.html` 可以直接双击打开，无需联网；`dist/` 不提交到仓库。拆分维护与单文件离线分发可以同时保留。

## 数据维护

本次只迁移既有内容，不作新的教材校订。教材出版年份、版次、印次尚未确认，详细内容范围与原有校对说明保留在页面页脚。自动校验只检查数据迁移完整性、数量与逻辑，不证明教材释义准确。

注释数组的位置仍用作收藏编号。引入稳定 ID 与迁移规则前，不要随意重排或删除数据；追加或校订时请同步目录数量，并明确更新来源记录和测试基准。

来源文件 Git blob：`045f1accb722ee92c063c9cbd3d4dd01f3ebcb4b`。这是从该版本提取的新项目初始提交，旧仓库的完整提交历史未导入；来源链接和版本信息保留供追溯。

沿用源仓库的 [GPL-3.0 许可证](LICENSE)，保留页面原有版权标识。内容权利与适用范围以原始来源为准。
