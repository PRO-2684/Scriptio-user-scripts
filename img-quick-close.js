// * 单击关闭图片查看器
// @run-at imageViewer
(function () {
    // 修改自: https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/blob/45c1d7c7fab0dd4c22cc930076036063a8d204b7/src/renderer.js#L397C48-L397C48
    const appEl = document.querySelector("#app");
    const option = { attributes: false, childList: true, subtree: true };
    const setup = () => {
        const img = document.querySelector(".main-area__image");
        const video = document.querySelector("embed");
        if (img) {
            const p = img.parentElement;
            let isMove = false;
            p.addEventListener("mousedown", (event) => {
                if (event.button === 0) {
                    isMove = false;
                }
            });
            p.addEventListener("mousemove", (event) => {
                if (event.button === 0) {
                    isMove = true;
                }
            });
            p.addEventListener("mouseup", (event) => {
                let rightMenu = document.querySelector("#qContextMenu");
                if (!isMove && event.button === 0 && !rightMenu) {
                    document.querySelector(`div[aria-label="关闭"]`).click();
                }
            });
            return true;
        } else if (video) {
            // 判断打开的是视频
            return true;
        }
        return false;
    };
    const callback = (mutationsList, observer) => {
        if (setup()) {
            observer.disconnect();
        }
    };
    if (setup()) {
        return; // 已经加载成功
    }
    const observer = new MutationObserver(callback);
    observer.observe(appEl, option); // 等待加载
})();