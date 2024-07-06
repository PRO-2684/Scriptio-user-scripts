// ==UserScript==
// @name         Privacio
// @description  保护你的隐私：阻止 QQ 的一些追踪行为，需要 hook-fetch.js 的支持
// @reactive     true
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#privacio
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    let enabled = false;
    const blacklist = new Set([ // Domain-specific blacklist
        "h.trace.qq.com",
        "otheve.beacon.qq.com",
        "tpstelemetry.tencent.com",
    ]);
    function privacioFilter(resource, options) {
        if (typeof resource !== "string") { // Does not consider Request object
            return [resource, options];
        }
        const url = new URL(resource);
        const domain = url.hostname;
        if (blacklist.has(domain)) {
            return null;
        } else {
            return [resource, options];
        }
    }
    function enable() {
        if (enabled) return;
        window.__FETCH_HOOKS_BEFORE__?.push(privacioFilter);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__FETCH_HOOKS_BEFORE__?.indexOf(privacioFilter);
        if (index !== -1) {
            window.__FETCH_HOOKS_BEFORE__?.splice(index, 1);
        }
        enabled = false;
    }
    if (window.__FETCH_HOOKS_BEFORE__) {
        enable();
    } else {
        window.addEventListener("fetch-hooked", enable, { once: true });
    }
    scriptio_toolkit.listen((v) => {
        v ? enable() : disable();
    }, false);
})();
