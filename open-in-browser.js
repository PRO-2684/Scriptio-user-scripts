// ==UserScript==
// @name         Open in Browser
// @description  小程序若可行则浏览器打开
// @run-at       main, chat
// @reactive     true
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#open-in-browser
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const canOpenInBrowser = ["com_tencent_miniapp_01"];
    function randomPos(ele) {
        const rect = ele.getBoundingClientRect();
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        return {x: x, y: y};
    }
    // Adapted from https://stackoverflow.com/a/52878847
    function rightClick(ele) {
        const pos = randomPos(ele);
        const evt = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: 2,
            buttons: 0,
            clientX: pos.x,
            clientY: pos.y
        });
        ele.dispatchEvent(evt);
    }
    function openWithBrowser() {
        const menu = document.querySelector("div.q-context-menu");
        if (menu && menu.children) {
            for (const child of menu.children) {
                if (child.textContent === "使用浏览器打开") {
                    child.click();
                    console.log("Open with browser");
                    return true;
                }
            }
        }
        console.log("No option found");
        return false;
    }
    function handleClick(e) {
        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
        const ele = e.target;
        if (ele.tagName === "CANVAS" && ele.classList.contains("ark-view-message") && canOpenInBrowser.includes(ele.getAttribute("appmanagerid")) && !ele.classList.contains("no-browser-support")) {
            e.stopImmediatePropagation();
            console.log("Stopped");
            rightClick(ele.parentElement.parentElement.parentElement.parentElement);
            let max = 10;
            const timer = window.setInterval(() => {
                if (openWithBrowser()) {
                    window.clearInterval(timer);
                }
                max--;
                if (max <= 0) {
                    window.clearInterval(timer);
                    ele.classList.add("no-browser-support");
                    ele.click();
                    console.log("Click");
                }
            }, 100);
        }
    }
    let listening = false;
    function toggle(enabled) {
        if (enabled && !listening) {
            document.addEventListener("click", handleClick, {capture: true});
        } else if (!enabled && listening) {
            document.removeEventListener("click", handleClick, {capture: true});
        }
        listening = enabled;
    }
    scriptio.listen(toggle, true);
})();
