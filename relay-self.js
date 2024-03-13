// 允许接龙自己的消息，需要 hook-vue.js 的支持
// @run-at main, chat

(function () {
    let enabled = false;
    function relaySelf(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("receive-button") || component.props.isSelf === undefined) {
            return; // Not what we're looking for
        }
        function update() {
            if (!enabled) return;
            if (component.props.isSelf === true) {
                component.props.isSelf = false;
            }
        }
        component.proxy.$watch("$props.isSelf", update, { immediate: true, flush: "post" });
    }
    function enable() {
        if (enabled) return;
        window.__VUE_MOUNT__.push(relaySelf);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(relaySelf);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
        enabled = false;
    }
    if (window.__VUE_MOUNT__) {
        enable();
    } else {
        window.addEventListener("vue-hooked", enable, { once: true });
    }
    scriptio_toolkit.listen((v) => {
        v ? enable() : disable();
    }, false);
})();
