// ==UserScript==
// @name         Privacio
// @description  保护你的隐私：阻止 QQ 的一些追踪行为，需要 hook-fetch.js 的支持
// @reactive     true
// @version      0.2.1
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
        if (!URL.canParse(resource)) {
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
    async function enable() {
        if (enabled) return;
        const hooks = await scriptio.wait("fetchHooksBefore");
        hooks.push(privacioFilter);
        enabled = true;
    }
    async function disable() {
        if (!enabled) return;
        const hooks = await scriptio.wait("fetchHooksBefore");
        const index = hooks.indexOf(privacioFilter);
        if (index !== -1) {
            hooks.splice(index, 1);
        }
        enabled = false;
    }
    scriptio.listen((v) => {
        v ? enable() : disable();
    }, false);
})();
