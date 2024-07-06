// ==UserScript==
// @name         Image Quick Close
// @description  单击关闭图片查看器
// @run-at       image-viewer
// @reactive     false
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#img-quick-close
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    // 修改自: https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/blob/4c3f2a532811cacc86372f2acbe652386b9c6e96/src/render_modules/betterImageViewer.js#L7
    let offset = 0;
    document.addEventListener("mousedown", (e) => {
        if (e.buttons === 1) {
            offset = 0;
        } else {
            offset = 3;
        }
    });
    document.addEventListener("mousemove", (e) => {
        if (e.buttons === 1) {
            offset += Math.abs(e.movementX) + Math.abs(e.movementY);
        }
    });
    document.addEventListener("mouseup", (e) => {
        const rightMenu = document.querySelector(".q-context-menu");
        const video = document.querySelector("embed");
        if (offset < 2 && e.buttons === 0 && !rightMenu && !video) {
            if (e.target.closest(".main-area__content")) {
                document.querySelector(`div[aria-label="关闭"]`).click();
            }
        }
    });
})();
