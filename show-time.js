// ==UserScript==
// @name         Show Time
// @description  消息显示时间，鼠标悬停显示详细时间与消息序列号，双击复制时间戳，需要开启 LiteLoader Hook Vue
// @run-at       main, chat, record, forward
// @reactive     true
// @version      0.2.2
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#show-time
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    let enabled = false;

    function addTime(component) {
        if (!enabled) return;

        const rootEl = component?.vnode?.el;
        if (!rootEl) return;

        const vueMessageRoot = rootEl.closest?.(".message.vue-component") || rootEl.closest?.(".message");
        if (!vueMessageRoot) return;

        const messageEl = vueMessageRoot.querySelector(".message") || vueMessageRoot;

        function update() {
            if (!enabled) return;

            if (!messageEl || !(messageEl instanceof HTMLElement)) return;
            const scopeEl = (rootEl instanceof HTMLElement ? rootEl : messageEl);

            const seq = component.props.msgRecord.msgSeq;

            const timestamp = component.props.msgRecord.msgTime * 1000 || 0;
            const date = new Date(timestamp);
            const fullTime = timestamp ? date.toLocaleString("zh-CN") : "未知时间";
            const simpleTime = timestamp ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "未知时间";

            messageEl.querySelector(".message-time")?.remove();
            scopeEl.querySelector(".message-time")?.remove();

            const timeEl = document.createElement("span");
            timeEl.classList.add("message-time");
            timeEl.textContent = simpleTime;
            timeEl.title = fullTime + (seq ? `\n#${seq}` : "");

            let retry = 0;
            function placeTimeSpan() {
                const isOwn =
                    messageEl.querySelector(".message-container--align-right") ||
                    scopeEl.querySelector(".message-container--align-right");

                const container =
                    messageEl.querySelector(".message-container") ||
                    scopeEl.querySelector(".message-container");

                if (container) {
                    const bubble =
                        container.querySelector(".message-content__wrapper") ||
                        container.querySelector(".message-content.mix-message__inner") ||
                        container.querySelector(".message-content__inner") ||
                        container.querySelector(".message-content");

                    if (bubble) {
                        bubble.insertAdjacentElement(isOwn ? "afterbegin" : "beforeend", timeEl);
                    } else {
                        container.insertAdjacentElement(isOwn ? "afterbegin" : "beforeend", timeEl);
                    }
                    return;
                }
                if (retry < 5) {
                    retry += 1;
                    requestAnimationFrame(placeTimeSpan);
                } else {
                    messageEl.insertAdjacentElement("beforeend", icon);
                }
            }
            placeTimeSpan();
        }
        component.proxy.$watch("$props.msgRecord.msgTime", update, { immediate: true, flush: "post" });
    }

    function enable() {
        if (enabled) return;

        const style = document.createElement("style");
        style.id = "scriptio-show-time";
        style.textContent = `
        .message {
            .send-time {
                display: none; /* Hide original time */
            }
            .message-time {
                align-self: end;
                color: var(--on_bg_text);
                opacity: 0.6;
                font-size: var(--font_size_1);
                margin: 0 1em;
            }
            .gray-tip-message .message-time {
                &::before {
                    content: "(";
                }
                &::after {
                    content: ")";
                }
            }
        }`;

        document.head.appendChild(style);
        window.scriptio.vueMount.push(addTime);
        enabled = true;
    }

    function disable() {
        if (!enabled) return;

        const index = window.scriptio.vueMount.indexOf(addTime);
        if (index > -1) {
            window.scriptio.vueMount.splice(index, 1);
        }
        const style = document.getElementById("scriptio-show-time");
        style?.remove();

        const times = document.querySelectorAll(".message-time");
        times.forEach((time) => time.remove());

        enabled = false;
    }

    function init() {
        if (!window.scriptio) {
            const timer = setInterval(() => {
                if (window.scriptio) {
                    clearInterval(timer);
                    window.scriptio.listen((v) => {
                        v ? enable() : disable();
                    }, true);
                }
            }, 100);
            setTimeout(() => clearInterval(timer), 10000);
            return;
        }
        window.scriptio.listen((v) => {
            v ? enable() : disable();
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
