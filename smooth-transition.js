// ==UserScript==
// @name         Smooth Transition
// @description  为页面间导航添加平滑过渡动画
// @run-at       main, setting
// @reactive     true
// @version      0.1.0
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const page = location.hash;
    const style = document.createElement("style");
    style.textContent = `
    ::view-transition-old(root),
    ::view-transition-new(root) {
        animation-duration: 0.3s;
    }
    .sidebar {
        view-transition-name: none-exist;
    }`;
    style.id = "scriptio-smooth-transition";
    document.head.appendChild(style);
    const vue = document.querySelector("#app").__vue_app__;
    const router = vue.config.globalProperties.$router;
    let callback = () => { };
    let enabled = false;
    // function mainPageEnable() { }
    // function mainPageDisable() { }
    // function settingPageEnable() { }
    // function settingPageDisable() { }
    function enable() {
        if (enabled) return;
        style.disabled = false;
        const ret = router.beforeResolve((to, from, next) => {
            document.startViewTransition(() => next());
        });
        callback = ret;
        // if (page.startsWith("#/main")) {
        //     mainPageEnable();
        // } else if (page.startsWith("#/setting")) {
        //     settingPageEnable();
        // }
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        style.disabled = true;
        callback();
        callback = () => { };
        enabled = false;
        // if (page.startsWith("#/main")) {
        //     mainPageDisable();
        // } else if (page.startsWith("#/setting")) {
        //     settingPageDisable();
        // }
    }
    enable();
    scriptio_toolkit.listen((v) => {
        v ? enable() : disable();
    }, false);
})();
