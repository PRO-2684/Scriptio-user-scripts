// ==UserScript==
// @name         Show Time
// @description  消息显示时间，鼠标悬停显示详细时间与消息序列号，双击复制时间戳，需要开启 LiteLoader Hook Vue
// @run-at       main, chat, record, forward
// @reactive     true
// @version      0.2.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#show-time
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    let enabled = false;
    function addTime(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("message") || el?.hasAttribute("scale")) return;
        function update() {
            if (!enabled) return;
            const props = component.props;
            const timestamp = props?.msgRecord?.msgTime * 1000 || 0; // String implicitly converted to number
            const date = new Date(timestamp);
            const fullTime = timestamp ? date.toLocaleString("zh-CN") : "未知时间";
            const simpleTime = timestamp ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "未知时间";
            el.querySelector(".message-time")?.remove();
            const seq = props?.msgRecord?.msgSeq;
            const timeEl = document.createElement("span");
            timeEl.classList.add("message-time");
            timeEl.textContent = simpleTime;
            timeEl.title = fullTime + (seq ? `\n#${seq}` : "");
            const parent = el.querySelector(".message-content__wrapper") || el.querySelector(".gray-tip-content.gray-tip-element");
            const position = el.querySelector(".message-container--align-right") ? "afterbegin" : "beforeend";
            parent?.insertAdjacentElement(position, timeEl);
            timeEl.addEventListener("dblclick", () => {
                navigator?.clipboard?.writeText(String(timestamp));
            });
        }
        component.proxy.$watch("$props.msgRecord.msgTime", update, { immediate: true, flush: "post" });
    }
    const vueMount = scriptio_toolkit.vueMount;
    function enable() {
        if (enabled) return;
        const style = document.createElement("style");
        style.id = "scriptio-show-time";
        style.textContent = `
        .message .message-time {
            align-self: end;
            color: var(--on_bg_text);
            opacity: 0.6;
            font-size: var(--font_size_1);
            margin: 0 1em;
        }
        .message .gray-tip-message .message-time::before {
            content: "(";
        }
        .message .gray-tip-message .message-time::after {
            content: ")";
        }`;
        document.head.appendChild(style);
        vueMount.push(addTime);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = vueMount.indexOf(addTime);
        if (index > -1) {
            vueMount.splice(index, 1);
        }
        const style = document.getElementById("scriptio-show-time");
        style?.remove();
        const times = document.querySelectorAll(".message-time");
        times.forEach((time) => time.remove());
        enabled = false;
    }
    scriptio_toolkit.listen((v) => {
        v ? enable() : disable();
    }, true);
})();
