// ==UserScript==
// @name         Relay Self
// @description  允许接龙自己的消息，需要开启 LiteLoader Hook Vue
// @run-at       main, chat
// @reactive     true
// @version      0.2.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#relay-self
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

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
    const vueMount = scriptio_toolkit.vueMount;
    function enable() {
        if (enabled) return;
        vueMount.push(relaySelf);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = vueMount.indexOf(relaySelf);
        if (index > -1) {
            vueMount.splice(index, 1);
        }
        enabled = false;
    }
    scriptio_toolkit.listen((v) => {
        v ? enable() : disable();
    }, true);
})();
