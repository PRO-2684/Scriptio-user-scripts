// 为页面间导航添加平滑过渡动画
// @run-at main, setting
(function () {
    const self = document.currentScript?.getAttribute("data-scriptio-script");
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
    window.addEventListener("scriptio-toggle", (event) => {
        const path = event.detail.path;
        if (path !== self) return;
        if (event.detail.enabled) {
            enable();
        } else {
            disable();
        }
    });
})();
