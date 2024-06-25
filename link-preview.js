// ==UserScript==
// @name         Link Preview
// @description  链接预览：鼠标经过链接时尝试加载浏览，悬浮显示链接的标题和描述，需要 hook-vue.js 的支持
// @run-at       main, chat, record, forward
// @reactive     true
// @version      0.1.0
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const DURATION = 500; // Hover time before fetching link info (ms)
    const MAXLEN = 200; // Maximum length of title and description
    const GRADIENT = "rgba(255, 0, 0, 1), rgba(255, 0, 180, 1), rgba(0, 100, 200, 1)"; // Gradient color for hovered links
    const HEIGHT = "1.3px"; // Height of the underline
    // const log = console.log.bind(console, "[Link Preview]");
    const log = () => {};
    let enabled = false;
    const style = document.head.appendChild(document.createElement("style"));
    style.id = "scriptio-link-preview";
    style.textContent = `
    /* Adapted from https://codepen.io/michellebarker/pen/BapoQNj */
    .text-link {
        text-decoration: none !important;
        background:
            linear-gradient(to right, currentcolor, currentcolor),
            linear-gradient(to right, ${GRADIENT});
        background-size: 100% ${HEIGHT}, 0 ${HEIGHT};
        background-position: 100% 100%, 0 100%;
        background-repeat: no-repeat;
        transition: color ${DURATION}ms, background-size ${DURATION}ms !important;
    }
    .text-link.link-preview-awaiting:hover {
        background-size: 0 ${HEIGHT}, 100% ${HEIGHT};
    }`;
    function truncate(s) { // Truncate a string so it doesn't take too much space
        if (s.length > MAXLEN) {
            return s.slice(0, MAXLEN) + "...";
        }
        return s;
    }
    function getTitle(doc) { // Get the title of a website
        const title = doc.querySelector("title");
        return title?.textContent || "";
    }
    function getDesc(doc) { // Get the description of a website
        const desc = doc.querySelector("meta[name~='description']");
        return desc?.content || "";
    }
    async function getLinkInfo(url) { // Get the title and description of a link
        try {
            const text = await scriptio.fetchText(url, { headers: { "User-Agent": navigator.userAgent } } );
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const l = [];
            const title = truncate(getTitle(doc));
            const desc = truncate(getDesc(doc));
            if (title) l.push(title);
            if (desc) l.push(desc);
            return l.join("\n") || "暂无链接浏览";
        } catch (e) {
            return "链接预览加载失败：" + e;
        }
    }
    async function onHover() {
        const url = this?.__VUE__?.[0]?.props?.content;
        const timer = window.setTimeout(async () => {
            this.style.cursor = "progress";
            this.title = await getLinkInfo(url);
            this.style.cursor = "";
            this.classList.remove("link-preview-awaiting");
            this.removeEventListener("mouseover", onHover);
            log("Link preview fetched for", url);
        }, DURATION);
        log("Set timeout", timer);
        this.addEventListener("mouseout", () => {
            window.clearTimeout(timer);
            log("Clear timeout", timer);
        }, { once: true });
    }
    function processLink(link) {
        const url = link?.__VUE__?.[0]?.props?.content;
        if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) return;
        link.classList.add("link-preview-awaiting");
        link.addEventListener("mouseover", onHover);
    }
    function linkPreview(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("text-element")) {
            return;
        }
        const links = el.querySelectorAll(".text-link");
        links.forEach(processLink);
    }
    function enable() {
        if (enabled) return;
        window.__VUE_MOUNT__.push(linkPreview);
        enabled = true;
        style.disabled = false;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(linkPreview);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
        enabled = false;
        style.disabled = true;
    }
    if (window.__VUE_MOUNT__) {
        enable();
    } else {
        window.addEventListener("vue-hooked", enable, { once: true });
    }
    scriptio_toolkit.listen((enabled) => {
        enabled ? enable() : disable();
    }, false);
})();