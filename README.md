# Scriptio-user-scripts

我的 [Scriptio](https://github.com/PRO-2684/Scriptio) 用户脚本。

## [hitokoto](./hitokoto.js)

输入框占位符显示[一言](https://hitokoto.cn)，窗口隐藏或占位符不可见时不会刷新。实时响应。

![hitokoto](./images/hitokoto.jpg)

## [img-quick-close](./img-quick-close.js)

查看图片时，单击窗口任意位置 (除功能按钮外) 即可关闭图片查看器。(类似于旧版本 QQ/微信)

## [shortcutio](./shortcutio.js)

添加常用快捷键，包括：

- `F5` 刷新当前页面
- `Esc` 关闭当前页面
- `Enter` 聚焦到输入框（主页面）
- `Ctrl+,` 打开设置页面

## [open-in-browser](./open-in-browser.js)

小程序若可行则浏览器打开。

原理：

- 若点击的小程序是已知可在浏览器打开的，则模拟右键，随后点击“使用浏览器打开”
    - 目前收集到的可在浏览器打开的：`com_tencent_miniapp_01` (Bilibili 分享?)
- 若失败，则退回至左键
