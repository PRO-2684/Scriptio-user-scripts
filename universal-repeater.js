// ==UserScript==
// @name         Universal Repeater
// @description  消息复读机，需要开启 LiteLoader Hook Vue
// @run-at       main, chat
// @reactive     true
// @version      0.1.3
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#repeater
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const safeMode = true; // Only show on messages that can be forwarded
    const debug = false;
    const log = debug ? console.log.bind(console, "[Repeater]") : () => { };
    let enabled = false;
    /**
     * Repeat a message
     * @param {string} msgId Message ID
     * @param {object} contact Contact object
     * @param {number} contact.chatType Chat type
     * @param {string} contact.peerUid Peer UID
     * @param {string} contact.guildId Guild ID
     */
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
    /**
     * Check if a message can be forwarded
     * @param {HTMLElement} el Message element
     * @returns {boolean} Whether the message can be forwarded
     */
    function canForward(el) {
        const container = el?.querySelector?.(".message-container");
        const component = container?.__VUE__?.[0];
        const supports = component?.ctx?.isSupportedForward;
        return Boolean(supports);
    }
    /**
     * Add repeat icon to message
     * @param {object} component Vue component
     */
    function addIcon(component) {
        const el = component?.vnode?.el;
        if (!el?.classList?.contains("message") || el?.hasAttribute("scale")) return;
        if (!enabled || (safeMode && !canForward(el))) return;
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
                visibility: hidden;
            }
            &:hover .universal-repeater {
                visibility: visible;
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
