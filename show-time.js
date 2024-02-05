// 消息显示时间，需要 hook-vue.js 的支持
// @run-at main, chat, forward

(function () {
    const self = document.currentScript?.getAttribute("data-scriptio-script");
    let enabled = false;
    function addTime(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("message")) return;
        const props = component.props;
        const timestamp = props?.msgRecord?.msgTime * 1000 || 0;
        const date = new Date(timestamp);
        const fullTime = timestamp ? date.toLocaleString("zh-CN") : "未知时间";
        const simpleTime = timestamp ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "未知时间";
        const timeEl = document.createElement("span");
        timeEl.classList.add("message-time");
        timeEl.textContent = simpleTime;
        timeEl.title = fullTime;
        const position = el.querySelector(".message-container--align-right") ? "afterbegin" : "beforeend";
        el.querySelector(".message-content__wrapper")?.insertAdjacentElement(position, timeEl);
    }
    function enable() {
        if (enabled) return;
        const style = document.createElement("style");
        style.id = "scriptio-show-time";
        style.textContent = `
        .message .message-content__wrapper .message-time {
            align-self: end;
            color: var(--on_bg_text);
            font-size: var(--font_size_2);
            margin: 0 0.5em;
        }`;
        document.head.appendChild(style);
        window.__VUE_MOUNT__.push(addTime);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(addTime);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
        const style = document.getElementById("scriptio-show-time");
        style?.remove();
        const times = document.querySelectorAll(".message-time");
        times.forEach((time) => time.remove());
        enabled = false;
    }
    if (window.__VUE_ELEMENTS__) {
        enable();
    } else {
        window.addEventListener("vue-hooked", enable, { once: true });
    }
    window.addEventListener("scriptio-toggle", (event) => {
        const path = event.detail.path;
        if (path === self) {
            if (event.detail.enabled) {
                enable();
            } else {
                disable();
            }
        }
    });
})();
