// ==UserScript==
// @name         Toast
// @description  允许其它脚本调用 scriptio_toolkit.toast，需要 hook-vue.js 的支持
// @run-at       main
// @reactive     false
// @version      0.1.0
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const $ = document.querySelector.bind(document);
    const log = console.log.bind(console, "[Toast]");
    // const log = () => {};
    let toastEl = $(".q-toast");
    let toastFunc = null;
    async function waitToastToShow() {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mut) => {
                for (const m of mut) {
                    log("Mutation", m);
                }
                // Check if toast is created
                toastEl = $(".q-toast");
                if (toastEl) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(document.body, { childList: true, subtree: false, attributes: false });
        });
    }
    async function waitToastToHide() {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                // Check if toast is removed
                if (!toastEl.querySelector(".q-toast-item")) {
                    log("Toast removed");
                    observer.disconnect();
                    resolve();
                }
            });
            log("toastEl", toastEl);
            observer.observe(toastEl, { childList: true, subtree: false, attributes: false });
        });
    }
    async function initToast() {
        if (toastEl) {
            toastFunc = toastEl?.__VUE__?.[1]?.proxy?.setNewToast;
            if (!toastFunc) {
                log("Failed to get toast function - try installing hook-vue.js first");
                return false;
            }
            return true;
        }
        const btn = $(".version-tip-button");
        if (!btn) {
            log("Version button not found");
            return false;
        }
        const style = document.head.appendChild(document.createElement("style"));
        style.id = "scriptio-toast";
        style.textContent = `
            .q-toast > .q-toast-item {
                display: none;
            }
        `;
        promise = waitToastToShow();
        btn.dispatchEvent(new MouseEvent("dblclick"), { bubbles: true });
        log("Version button double clicked");
        await promise;
        log("Toast created");
        toastFunc = toastEl?.__VUE__?.[1]?.proxy?.setNewToast;
        await waitToastToHide();
        log("Toast removed");
        style.remove();
        if (!toastFunc) {
            log("Failed to get toast function - try installing hook-vue.js first");
            return false;
        }
        return true;
    }
    async function toast(message, duration = 1500, type = "default") {
        // type: default, success, error
        if (!await initToast()) {
            return false;
        }
        toastFunc({
            content: message,
            duration: duration,
            type: type,
            noRepeat: true,
        });
    };
    scriptio_toolkit.register("toast", toast);
    // Example usage:
    // scriptio_toolkit.wait("toast").then(toast => toast("Hello, world!"));
})();
