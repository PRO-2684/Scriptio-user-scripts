# Scriptio-user-scripts

我的 [Scriptio](https://github.com/PRO-2684/Scriptio) 用户脚本。

## [editio](./editio.js)

给编辑器添加一些额外的功能：

- 匹配括号和引号
    - 自动闭合括号和引号（类似于 VSCode 中的 [`editor.autoClosingBrackets`](https://pro-2684.github.io/?page=redirect&url=vscode%3A%2F%2Fsettings%2Feditor.autoClosingBrackets)）
    - 删除相邻的闭合引号或括号（类似于 VSCode 中的 [`editor.autoClosingDelete`](https://pro-2684.github.io/?page=redirect&url=vscode%3A%2F%2Fsettings%2Feditor.autoClosingDelete)）
    - 覆写闭合括号（类似于 VSCode 中的 [`editor.autoClosingOvertype`](https://pro-2684.github.io/?page=redirect&url=vscode%3A%2F%2Fsettings%2Feditor.autoClosingOvertype)）
        - 输入字符是一个闭合字符且与光标后的字符相同
        - 光标前的字符是相应的开放字符
        - 对于具有相同开放和闭合字符的对子不起作用
    - 跳转到匹配的括号
        - 按 <kbd>Ctrl</kbd> + <kbd>Q</kbd> 跳转到匹配的括号
        - 对于在边界的字符以及具有相同开放和闭合字符的对子不起作用
    - 匹配的字符对：`()`、`[]`、`{}`、`<>`、`""`、`''`、` `` `。
- Tab 键相关的功能
    - 按下 (<kbd>Shift</kbd>+) <kbd>Tab</kbd> 来跳转至下一个 (或上一个) 所指定的字符 (与拓展 [`albert.TabOut`](https://pro-2684.github.io/?page=redirect&url=vscode%3Aextension%2Falbert.TabOut) 相似)
    - 需要 Tab out 的字符：`` ()[]{}<>"'`,:;. ``

你可能也喜欢 [Editio for Tampermonkey](https://greasyfork.org/scripts/519147)。

## [hitokoto](./hitokoto.js)

输入框占位符显示[一言](https://hitokoto.cn)，窗口隐藏或占位符不可见时不会刷新。实时响应。

![hitokoto](./images/hitokoto.jpg)

## [hook-vue](./hook-vue.js)

> [!WARNING]
> 已弃用，请改用 `scriptio.vueMount` & `scriptio.vueUnmount`

Hook Vue 实例，使得可以通过 `el.__VUE__` 获取此元素所挂载的 Vue 实例，使用方法见代码注释。依赖此脚本的常用代码模板：

```javascript
// ==UserScript==
// @name         <脚本名称>
// @description  <脚本的简要说明>，需要 hook-vue.js 的支持
// @run-at       <脚本启用页面>
// @reactive     <false/true>
// @version      <版本号>
// @homepageURL  <脚本的主页>
// @author       <作者>
// @license      <许可证>
// ==/UserScript==

(function () {
    let enabled = false;
    function process(component) {
        const el = component?.vnode?.el;
        // if (!el?.classList?.contains("message")) return; // 若仅需处理消息，可使用此行
        // <处理逻辑>
    }
    function enable() {
        if (enabled) return;
        window.__VUE_MOUNT__.push(process);
        // <启用脚本的额外工作>
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(process);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
        // <禁用脚本的额外工作>
        enabled = false;
    }
    if (window.__VUE_MOUNT__) {
        enable();
    } else {
        window.addEventListener("vue-hooked", enable, { once: true });
    }
    scriptio.listen((v) => {
        v ? enable() : disable();
    }, false);
    // scriptio.listen(toggleFunc: Function, immediate: Boolean)
    // 参见 https://github.com/PRO-2684/Scriptio/wiki/4.-%E7%94%A8%E6%88%B7%E8%84%9A%E6%9C%AC%E5%BC%80%E5%8F%91#%E5%93%8D%E5%BA%94%E6%80%A7%E8%84%9A%E6%9C%AC
})();
```

**注意：可能与其他插件的类似功能冲突！**

## [hook-fetch](./hook-fetch.js)

Hook `fetch` 函数，从而可以通过 `scriptio.wait("fetchHooksBefore")` 和 `scriptio.wait("fetchHooksAfter")` 添加请求前和请求后的处理函数。使用方法见代码注释。

## [img-quick-close](./img-quick-close.js)

查看图片时，单击窗口任意位置 (除功能按钮外) 即可关闭图片查看器。(类似于旧版本 QQ/微信)

## [inspectio](./inspectio.js)

添加各类提示信息，Ctrl+Click 可复制，包括：

- 消息发送者的昵称、备注与 QQ 号
    - 鼠标悬停在头像时显示
    - 由于 QQ 的懒加载机制，可能部分非空字段也不会显示
- 被艾特的 QQ 号
- 表情/表情包/图片的摘要、长宽
    - ![表情包摘要](./images/inspectio-showSummary.jpg)
- 允许保存表情包 (拖拽到保存位置即可)
- 允许拖拽 QQ 表情
- 图片文件名、尺寸、占用大小以及网址
- 视频文件名、时长以及占用大小
- 红包领取信息
- 语音消息的时长、占用大小以及转文字结果（若有）
- 小程序/卡片分享的摘要
    - Shift+Click 可复制小程序/卡片分享的代码
- 群公告展示完整内容
- 建群成功提示中的群号
- 各类灰字提示中的 QQ 号
    - 撤回提示
    - 红包提示
    - 群成员变动提示
    - 禁言提示
- 撤回提示补全“自定义撤回消息”
    - ![撤回提示补全](./images/inspectio-revokeElement.jpg)
- 查看过期的引用消息的发送者与时间
- 通话信息的时长 (精确到毫秒)
- 聊天列表：最近消息的文字内容、完整联系人名与 QQ 号、未读消息数
    - ![聊天列表最近消息](./images/inspectio-recentMessage.jpg)
- 资料卡精确点赞数
- 群公告发送者 QQ 以及详细发送时间
- 群精华消息发送者、加精者 QQ 以及详细发送、加精时间
- 分享的精华消息详细发送时间

需要开启 LiteLoader Hook Vue。

## [link-preview](./link-preview.js)

链接预览：鼠标经过链接时尝试加载浏览，悬浮显示链接的标题和描述，需要开启 LiteLoader Hook Vue。*关闭/打开需要切换一次聊天窗口/重新进入聊天记录才能生效。*

![link-preview](./images/link-preview.jpg)

## [msg-record-enhance](./msg-record-enhance.js)

查看转发的聊天记录中已知的和引用消息发送者 QQ，需要开启 LiteLoader Hook Vue。鼠标悬浮在头像/引用消息的发送者昵称上时显示 QQ 号，双击可复制。*关闭/打开需要重新进入聊天记录才能生效。*

## [no-popup](./no-popup.js)

阻止各类弹窗，目前已知：

- 广告弹窗
- 邮件弹窗

## [open-in-browser](./open-in-browser.js)

小程序若可行则浏览器打开。

原理：

- 若点击的小程序是已知可在浏览器打开的，则模拟右键，随后点击“使用浏览器打开”
    - 目前收集到的可在浏览器打开的：`com_tencent_miniapp_01` (Bilibili 分享?)
- 若失败，则退回至左键

## [pangu](./pangu.js)

编辑框内按下 Ctrl+P 后，自动在中英文、中文与数字之间添加空格，并进行合适的标点符号处理。(改编自 [Pangu.js](https://github.com/vinta/pangu.js/))

## [privacio](./privacio.js)

保护你的隐私：通过拦截对特定域名的请求，从而阻止 QQ 的一些追踪行为，需要 hook-fetch.js 的支持。此脚本仅能阻止渲染层的追踪，无法阻止主进程的追踪。目前已知可以阻止的域名：

- `otheve.beacon.qq.com`
- `tpstelemetry.tencent.com`
- `h.trace.qq.com`
- `report.gamecenter.qq.com`

此脚本仅能拦截前三个，因为最后一个域名通常是主进程请求的。关于如何拦截列出的所有域名，详见 [此 Gist](https://gist.github.com/PRO-2684/4353310541c63fe7aef643d14bc92ff0)。

> [!NOTE]
> 您仍有可能在 chii DevTools 中看到一些 pending 的追踪请求，这是因为 chii DevTools 的工作方式，实际上用 Fiddler 等抓包工具可以得知它们确实被拦截了。

## [relay-self](./relay-self.js)

允许接龙自己的消息，需要开启 LiteLoader Hook Vue

![relay-self](./images/relay-self.jpg)

## [shortcutio](./shortcutio.js)

添加常用快捷键，包括：

- `F5` 刷新当前页面
- `Esc` 关闭当前页面
- `Enter` 聚焦到输入框（主页面）
- `Ctrl+,` 打开设置页面（若开启了 LiteLoader Hook Vue 或其它插件有类似功能，则尝试调用内部的打开设置函数，否则通过模拟点击打开）
- `Ctrl+Tab` 聊天与联系人界面切换

同时，修复鼠标侧键，从而进行前进与后退。（`button` 为 3 时，模拟后退；为 4 时，模拟前进）

## [show-time](./show-time.js)

消息后显示时间，鼠标悬停显示详细时间与消息序列号，双击复制时间戳，同时隐藏 QQ 自带的详细时间，需要开启 LiteLoader Hook Vue。*关闭/打开可能需要切换一次聊天窗口/上下滚动几屏才能生效。*

![show-time](./images/show-time.jpg)

## [smooth-transition](./smooth-transition.js)

为页面间导航添加平滑过渡动画。

## [toast](./toast.js)

允许其它脚本调用 scriptio.toast，需要开启 LiteLoader Hook Vue。

## [universal-repeater](./universal-repeater.js)

消息复读机，需要开启 LiteLoader Hook Vue，基于 [LiteLoaderQQNT-Echo-Message](https://github.com/WJZ-P/LiteLoaderQQNT-Echo-Message/) 修改而来。主要区别：

- 通过 Hook Vue 实现，不再需要 `MutationObserver` 和 `setInterval`，性能更好
- 使用 CSS 实现样式，不再需要 `mouse*` 事件
- 基于 Scriptio 提供的动态监听特性，无需重载/重启即可实现功能开关

请安装 [`transition.css`](https://github.com/PRO-2684/Transitio-user-css/#transition) 以实现过渡动画。
