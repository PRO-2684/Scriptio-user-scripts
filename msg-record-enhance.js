// ==UserScript==
// @name         Message Record Enhance
// @description  查看转发的聊天记录中已知的和引用消息发送者 QQ，需要开启 LiteLoader Hook Vue
// @run-at       forward
// @reactive     false
// @version      0.2.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#msg-record-enhance
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const censoredUins = ["0", "1094950020"];
    function setTitle(el, title, copy) {
        if (!el) return;
        el.title = title;
        if (copy) {
            el.addEventListener("dblclick", () => {
                navigator?.clipboard?.writeText(copy);
            });
        }
    }
    function addHint(component) {
        const el = component?.vnode?.el;
        if (!el) return;
        let sender;
        if (el?.classList?.contains("reply-element")) { // 引用消息查看发送者
            console.log("reply-element");
            sender = component?.props?.msgElement?.replyElement?.senderUid;
            const text = sender ? `发送者 QQ: ${sender} (双击复制)` : "未知发送者";
            setTitle(el.querySelector(".reply-info"), text, sender);
        } else if (el?.classList?.contains("message")) { // 已知发送者的消息
            console.log("message");
            const givenSender = component?.props?.msgRecord?.senderUin;
            sender = censoredUins.includes(givenSender) ? null : givenSender;
            if (sender) {
                setTitle(el.querySelector(".avatar-span"), `发送者 QQ (双击复制): ${sender}`, sender);
            } else {
                const info = component?.props?.msgRecord?.multiTransInfo;
                if (!info) return;
                const anonId = info?.fromAnonId;
                const avatarUrl = info?.fromFaceUrl;
                if (anonId && avatarUrl) {
                    const avatar = el.querySelector(".avatar-span");
                    if (avatar) {
                        setTitle(avatar, `未知发送者\nAlt+Click 在浏览器打开头像\n标识 ID (双击复制): ${anonId}`, anonId);
                        avatar.addEventListener("click", (e) => {
                            if (e.altKey) {
                                scriptio.open("link", avatarUrl);
                            }
                        });
                    }
                }
            }
        }
    }
    const vueMount = scriptio.vueMount;
    function main() {
        vueMount.push(addHint);
    }
    main();
})();
