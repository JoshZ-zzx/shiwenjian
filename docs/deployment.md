# GitHub Pages 与独立域名

## 默认入口

仓库：`JoshZ-zzx/ClassicalChinese`。在 Settings → Pages 选择 **Deploy from a branch**，分支 `main`、目录 `/(root)`，保存。部署完成后默认访问：

https://joshz-zzx.github.io/ClassicalChinese/

本项目不需要服务器端程序或构建步骤。`.nojekyll` 禁用不需要的 Jekyll 处理。页面使用相对资源路径与 hash 路由，刷新课文链接时无需服务器重写。

## 以后绑定子域名

域名尚未确定，因此仓库目前不带 `CNAME`。例如将来选择 `gushi.joshzhangzzx.top`：

1. 先在该仓库的 Settings → Pages → Custom domain 填入完整域名并保存。按分支发布时，GitHub 会在发布源创建 `CNAME` 文件。
2. 在域名服务商添加 DNS 记录：类型 `CNAME`，主机 `gushi`，目标 `joshz-zzx.github.io`。目标不带 `https://`，也不带 `/ClassicalChinese/`。
3. 等待 GitHub 的 DNS 检查和证书签发完成，然后启用 Enforce HTTPS。不要提前假定证书已经可用。
4. 打开子域名检查目录、课文、搜索和手机布局。

独立项目仓库可以绑定自己的子域名，ToolBox 原有站点可以继续使用原域名。无需修改 ToolBox 的域名设置。

参考：[GitHub 官方自定义域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。

## 旧入口与本地记录

旧版 `ToolBox/ClassicalChinese.html` 本次保留，避免中断旧用户的阅读与收藏。以后正式切换入口时，可先加学习记录导入导出，再更新 ToolBox 导航，最后考虑将旧页面改成迁移提示。

浏览器存储按来源隔离：`joshzhangzzx.top`、`joshz-zzx.github.io`、新的子域名和离线文件不应视为共享存储。相同的存储键并不能跨域读取旧收藏。更换域名前请安排导出／导入流程；当前版本尚无导入导出按钮。
