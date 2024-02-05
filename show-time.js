// * 消息显示时间，需要 hook-vue.js 的支持
// @run-at main, chat

(function () {
    function main() {
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
        function addTime(component) {
            const el = component.vnode.el;
            if (!el.classList.contains("message")) return;
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
        window.__VUE_MOUNT__.push(addTime);
    }
    if (window.__VUE_ELEMENTS__) {
        main();
    } else {
        window.addEventListener("vue-hooked", main);
    }
})();
