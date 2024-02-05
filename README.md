# Scriptio-user-scripts

我的 [Scriptio](https://github.com/PRO-2684/Scriptio) 用户脚本。

## [hitokoto](./hitokoto.js)

输入框占位符显示[一言](https://hitokoto.cn)，窗口隐藏或占位符不可见时不会刷新。实时响应。

![hitokoto](./images/hitokoto.jpg)

## [hook-vue](./hook-vue.js)

Hook Vue 实例，使得可以通过 `el.__VUE__` 获取此元素所挂载的 Vue 实例。使用方法见代码注释。

**注意：可能与其他插件的类似功能冲突！**

## [img-quick-close](./img-quick-close.js)

查看图片时，单击窗口任意位置 (除功能按钮外) 即可关闭图片查看器。(类似于旧版本 QQ/微信)

## [open-in-browser](./open-in-browser.js)

小程序若可行则浏览器打开。

原理：

- 若点击的小程序是已知可在浏览器打开的，则模拟右键，随后点击“使用浏览器打开”
    - 目前收集到的可在浏览器打开的：`com_tencent_miniapp_01` (Bilibili 分享?)
- 若失败，则退回至左键

## [plugin-icon](./plugin-icon.js)

设置界面展示插件图标（若有）。

## [shortcutio](./shortcutio.js)

添加常用快捷键，包括：

- `F5` 刷新当前页面
- `Esc` 关闭当前页面
- `Enter` 聚焦到输入框（主页面）
- `Ctrl+,` 打开设置页面
- `Ctrl+Tab` 聊天与联系人界面切换

同时，修复鼠标侧键，从而进行前进与后退。（`button` 为 3 时，模拟后退；为 4 时，模拟前进）

## [show-time](./show-time.js)

消息后显示时间，鼠标悬停显示详细时间，需要 hook-vue.js 的支持。

![show-time](./images/show-time.jpg)
