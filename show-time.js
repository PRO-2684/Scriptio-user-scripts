// * 消息显示时间，需要 hook-vue.js 的支持
// @run-at main, chat

(function () {
    function main() {
        function addTime(component) {
            const el = component.vnode.el;
            if (!el.classList.contains("message")) return;
            const props = component.props;
            const timestamp = props?.msgRecord?.msgTime * 1000 || 0;
            const date = new Date(timestamp);
            el.title = timestamp ? date.toLocaleString("zh-CN") : "未知时间";
            el.setAttribute("data-time", timestamp ? date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "未知时间");
        }
        window.__VUE_MOUNT__.push(addTime);
    }
    if (window.__VUE_ELEMENTS__) {
        main();
    } else {
        window.addEventListener("vue-hooked", main);
    }
})();
