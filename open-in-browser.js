// * 小程序若可行则浏览器打开
// @run-at main
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
    function openWithBrowser(ele) {
        const menu = document.querySelector("div#qContextMenu");
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
        const ele = e.target;
        if (ele.tagName === "CANVAS" && ele.classList.contains("ark-view-message") && canOpenInBrowser.includes(ele.getAttribute("appmanagerid")) && !ele.classList.contains("no-browser-support")) {
            e.stopImmediatePropagation();
            console.log("Stopped");
            rightClick(ele.parentElement.parentElement.parentElement.parentElement);
            let max = 10;
            const timer = window.setInterval(() => {
                if (openWithBrowser(ele)) {
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
    document.addEventListener("click", handleClick, {capture: true});
})();
