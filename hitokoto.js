// 获取一言，展现在输入框占位符上
(function () {
    const api = "https://v1.hitokoto.cn/"; // 你可以修改这个参数，指定想要的句子类型，参考 https://developer.hitokoto.cn/sentence/#%E5%8F%A5%E5%AD%90%E7%B1%BB%E5%9E%8B-%E5%8F%82%E6%95%B0
    // const link = "https://hitokoto.cn/?uuid="; // 暂未使用
    const interval = 1000 * 5; // 刷新间隔，单位毫秒 (ms)
    const debug = false; // 是否开启调试模式，开启后会在控制台输出日志
    const log = debug ? console.log.bind(console, "[Hitokoto]") : () => { };

    // 检测是否在主页
    let page = window.location.hash.slice(2).split("/")[0];
    if (page !== "blank") {
        main();
    } else {
        log("Waiting for navigation...");
        navigation.addEventListener("navigatesuccess", main, { once: true });
    }

    // 主函数
    function main() {
        page = window.location.hash.slice(2).split("/")[0];
        if (page !== "main") {
            log("Not in main page, skip");
            return;
        }
        const css = document.createElement("style");
        css.id = "scriptio-hitokoto";
        document.head.appendChild(css);
        let timer = null;
        function shouldUpdate() {
            if (document.hidden) {
                return false; // 页面不可见
            } else { // 检测占位符是否存在及可见
                const placeholder = document.querySelector(".qq-editor .ck-editor__main p.ck-placeholder");
                return placeholder && placeholder.checkVisibility();
            }
        }
        async function trueUpdate() {
            const data = await (await fetch(api)).json();
            const hitokoto = `${data.hitokoto} —— ${data.from_who || data.from}`;
            css.textContent = `.qq-editor .ck-editor__main .ck-placeholder:before { --qq-editor-placeholder: "${hitokoto}"; }`;
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
        function enable() {
            if (!timer) {
                timer = window.setInterval(update, interval);
            }
            css.disabled = false;
            log("Enabled");
        }
        function disable() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = null;
            css.disabled = true;
            log("Disabled");
        }
        window.addEventListener("scriptio-toggle-hitokoto", (event) => {
            log("Toggle hitokoto:", event.detail.enabled);
            if (event.detail.enabled) {
                enable();
            } else {
                disable();
            }
        });
    }
})();