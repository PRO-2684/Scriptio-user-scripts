// * 查看转发的聊天记录中已知的和引用消息发送者 QQ，需要 hook-vue.js 的支持
// @run-at forward

(function () {
    const censoredUins = ["0", "1094950020"];
    function addHint(component) {
        const el = component?.vnode?.el;
        if (!el) return;
        let sender, sel;
        if (el?.classList?.contains("reply-element")) { // 引用消息查看发送者
            console.log("reply-element");
            sender = component?.props?.msgElement?.replyElement?.senderUid;
            sel = ".reply-info";
        } else if (el?.classList?.contains("message")) { // 已知发送者的消息
            console.log("message");
            const givenSender = component?.props?.msgRecord?.senderUin;
            sender = censoredUins.includes(givenSender) ? null : givenSender;
            sel = ".avatar-span";
        } else {
            return;
        }
        const text = sender ? `发送者 QQ: ${sender} (双击复制)` : "未知发送者";
        const hintHost = el.querySelector(sel);
        if (!hintHost) return;
        hintHost.title = text;
        if (sender) {
            hintHost.addEventListener("dblclick", () => {
                navigator?.clipboard?.writeText(sender);
            });
        }
    }
    function main() {
        window.__VUE_MOUNT__.push(addHint);
    }
    if (window.__VUE_MOUNT__) {
        main();
    } else {
        window.addEventListener("vue-hooked", main, { once: true });
    }
})();
