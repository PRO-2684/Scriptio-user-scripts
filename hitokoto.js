// 获取一言，展现在输入框占位符上
// @run-at main
(function () {
    // 参数
    const api = "https://v1.hitokoto.cn/"; // 你可以修改这个参数，指定想要的句子类型，参考 https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0
    // const link = "https://hitokoto.cn/?uuid="; // 暂未使用
    const interval = 10; // 刷新间隔，单位秒 (s)
    const animation_duration = 0.5; // 动画持续时间，单位秒 (s)
    const debug = false; // 是否开启调试模式，开启后会在控制台输出日志
    const log = debug ? console.log.bind(console, "[Hitokoto]") : () => { };

    // 主逻辑
    const sel = `.qq-editor[style$='"";'] .ck-editor__main .ck-placeholder:before`;
    const css_word = document.createElement("style");
    css_word.id = "scriptio-hitokoto";
    css_word.textContent = sel + ' { --qq-editor-placeholder: "一言载入中..."}';
    document.head.appendChild(css_word);
    const css_opa = document.createElement("style");
    css_opa.id = "scriptio-hitokoto-opacity";
    css_opa.textContent = sel + " { opacity: 0; }";
    document.head.appendChild(css_opa);
    const css_trans = document.createElement("style");
    css_trans.id = "scriptio-hitokoto-transition";
    css_trans.textContent = sel + ` { transition: opacity ${animation_duration}s ease-in-out; }`;
    document.head.appendChild(css_trans);
    let timer = null;
    function shouldUpdate() {
        if (document.hidden) {
            return false; // 页面不可见
        } else { // 检测占位符是否存在及可见
            const placeholder = document.querySelector(sel.slice(0, -7)); // 去掉 ":before"
            return placeholder && placeholder.checkVisibility();
        }
    }
    async function trueUpdate() {
        const data = await (await fetch(api)).json();
        const hitokoto = `${data.hitokoto} —— ${data.from_who || data.from}`;
        css_opa.disabled = false; // 使占位符透明
        window.setTimeout(() => {
            css_word.textContent = `${sel} { --qq-editor-placeholder: "${hitokoto}"; }`;
            css_opa.disabled = true;
        }, animation_duration * 1000);
        log("Update hitokoto:", hitokoto);
        return true;
    }
    async function update() {
        if (!shouldUpdate()) {
            log("Skip update");
            return false;
        }
        return await trueUpdate();
    }
    trueUpdate(); // 一开始就更新一次
    function toggle(enabled) {
        if (!timer && enabled) {
            timer = window.setInterval(update, interval * 1000);
        } else if (timer && !enabled) {
            window.clearInterval(timer);
            timer = null;
        }
        css_word.disabled = !enabled;
        css_opa.disabled = true;
        css_trans.disabled = !enabled;
        log("Toggle hitokoto:", enabled);
    }
    window.addEventListener("scriptio-toggle", (event) => {
        const path = event.detail.path;
        const self = "hitokoto.js";
        if (path === self || path.endsWith("/" + self))
            toggle(event.detail.enabled);
    });
    toggle(true);
})();