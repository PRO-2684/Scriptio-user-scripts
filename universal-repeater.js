// ==UserScript==
// @name         Universal Repeater
// @description  消息复读机，需要开启 LiteLoader Hook Vue
// @run-at       main, chat
// @reactive     true
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#repeater
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const log = console.log.bind(console, "[Repeater]");
    let enabled = false;
    function repeat(msgId, contact) {
        // Ref: https://github.com/WJZ-P/LiteLoaderQQNT-Echo-Message/
        window.scriptio.invokeNative("ns-ntApi", "nodeIKernelMsgService/forwardMsgWithComment", false, {
            msgIds: [msgId],
            msgAttributeInfos: new Map(),
            srcContact: contact,
            dstContacts: [contact],
            commentElements: []
        }, null).then((res) => {
            log("Forwarded message", res);
        }).catch((err) => {
            log("Error forwarding message", err);
        });
    }
    function addIcon(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("message") || el?.hasAttribute("scale")) return;
        if (!enabled) return;
        const { peerUid } = component.props.msgRecord;
        const { msgId, chatType } = component.props.msgRecord;
        const contact = { chatType, peerUid, guildId: "" };
        const icon = document.createElement("i");
        icon.classList.add("universal-repeater");
        icon.textContent = "+1";
        icon.title = "Repeat";
        const parent = el.querySelector(".message-content__wrapper") || el.querySelector(".gray-tip-content.gray-tip-element");
        const position = el.querySelector(".message-container--align-right") ? "afterbegin" : "beforeend";
        parent?.insertAdjacentElement(position, icon);
        icon.addEventListener("click", () => {
            repeat(msgId, contact);
        });
    }
    const vueMount = scriptio.vueMount;
    function enable() {
        if (enabled) return;
        const style = document.createElement("style");
        style.id = "scriptio-universal-repeater";
        // Install https://github.com/PRO-2684/Transitio-user-css/#transition for transition effect
        style.textContent = `
        .message {
            .universal-repeater {
                align-self: end;
                color: var(--on_bg_text);
                opacity: 0.6;
                font-size: var(--font_size_1);
                margin: 0 1em;
                cursor: pointer;
                border-radius: 50%;
                border: 1px solid var(--on_bg_text);
                padding: 0.25em;
                display: none;
            }
            &:hover .universal-repeater {
                display: block;
            }
        }`;
        document.head.appendChild(style);
        vueMount.push(addIcon);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = vueMount.indexOf(addIcon);
        if (index > -1) {
            vueMount.splice(index, 1);
        }
        const style = document.getElementById("scriptio-universal-repeater");
        style?.remove();
        const icons = document.querySelectorAll(".universal-repeater");
        icons.forEach((time) => time.remove());
        enabled = false;
    }
    scriptio.listen((v) => {
        v ? enable() : disable();
    }, true);
})();
