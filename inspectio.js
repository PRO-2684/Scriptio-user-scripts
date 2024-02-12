// 添加各类提示信息，Ctrl+Click 复制，功能细节详见 README，需要 hook-vue.js 的支持
// @run-at main, chat, record, forward

(function () {
    const self = document.currentScript?.getAttribute("data-scriptio-script");
    const state = document.querySelector("#app").__vue_app__.config.globalProperties.$store.state;
    let enabled = false;
    // Helper functions
    function validQQ(qq) {
        return qq && qq !== "0";
    }
    function getCurrentGroup() {
        return parseInt(state?.aio_group?.curGroupCode);
    }
    function uinToQQ(uin) { // Input: uin; Output: qq (Only tries to find in the current group)
        const groupCode = getCurrentGroup();
        if (!groupCode || isNaN(groupCode)) return uin; // Not in a group - return uin as it is
        const group = state?.common_GroupMembersNew?.groupMembersMap?.[groupCode]?.memberListInfo;
        if (!group) return uin; // No group info - return uin as it is
        const res = group.get(uin);
        if (res) {
            return res.uin;
        } else {
            return uin; // Fall back to uin if not found
        }
        // TODO: Also try to find in `common_Contact_buddy`
    }
    function setTip(el, tip) {
        if (!el || !tip) return;
        el.title = tip;
        el.addEventListener("click", (e) => {
            if (e.ctrlKey) {
                e.stopImmediatePropagation();
                navigator?.clipboard?.writeText(tip);
            }
        }, { capture: true });
    }
    // Get description for each element
    function getDesc(msgRecEl, el) { // Input: one of `.props.msgRecord.elements`
        if (!msgRecEl) return "";
        switch (msgRecEl.elementType) {
            case 1: { // textElement
                const data = msgRecEl.textElement;
                if (data.atType === 2) { // mention someone
                    const account = validQQ(data.atUid) ? data.atUid : uinToQQ(data.atNtUid);
                    const content = data.content.startsWith("@") ? data.content.slice(1) : data.content;
                    return `${account} (${content})`;
                } else if (data.atType === 1) { // mention all
                    return data.content;
                }
                return "";
            }
            case 2: { // picElement
                const data = msgRecEl.picElement;
                const dimension = `${data.picWidth} x ${data.picHeight}`;
                const summary = data.summary;
                if (summary) {
                    return `${summary} (${dimension})`;
                } else {
                    return dimension;
                }
            }
            case 3: { // fileElement
                const data = msgRecEl.fileElement;
                const optionalDimension = data.picWidth && data.picHeight ? ` (${data.picWidth} x ${data.picHeight})` : "";
                const optionalPath = data.filePath ? `\nPath: ${data.filePath}` : "";
                const tip = `${data.fileName}${optionalDimension}\nSize: ${data.fileSize} Bytes\nMD5: ${data.fileMd5.toUpperCase()}${optionalPath}`;
                setTip(el.querySelector(".file-element"), tip);
                const fnameEl = el.querySelector(".file-element .file-name");
                if (fnameEl) {
                    fnameEl.removeAttribute("title");
                }
                return "";
            }
            case 4: { // pttElement
                const data = msgRecEl.pttElement;
                return `${data.fileName} (${data.duration}s, ${data.fileSize} Bytes)`;
            }
            case 5: { // videoElement
                const data = msgRecEl.videoElement;
                return `${data.fileName} (${data.fileTime}s, ${data.fileSize} Bytes)`;
            }
            case 6: { // faceElement
                const data = msgRecEl.faceElement;
                const id = data.faceIndex;
                const faceMap = state.common_QQFace?.dataMap;
                if (faceMap) {
                    const face = faceMap[id];
                    if (face && face.name) {
                        return `[${face.name}]`;
                    } else {
                        return face.faceText || `[未知表情#${id}]`;
                    }
                } else {
                    return "";
                }
            }
            case 8: { // grayTipElement
                const data = msgRecEl.grayTipElement;
                const container = el.querySelector(".gray-tip-content.gray-tip-element");
                switch (data.subElementType) {
                    case 1: { // revokeElement
                        const subData = data.revokeElement;
                        const senderUin = subData.origMsgSenderUid;
                        const operatorUin = subData.operatorUid;
                        const sender = `${uinToQQ(senderUin)} (${subData.origMsgSenderMemRemark || subData.origMsgSenderNick})`;
                        if (operatorUin === senderUin) {
                            setTip(container, sender);
                        } else {
                            const operator = `${uinToQQ(operatorUin)} (${subData.operatorMemRemark || subData.operatorNick})`;
                            setTip(container, `发送者: ${sender}\n撤回者: ${operator}`);
                        }
                        return "";
                    }
                    case 4: { // groupElement
                        const subData = data.groupElement;
                        if (subData.adminUid) {
                            const admin = `${uinToQQ(subData.adminUid)} (${subData.adminRemark || subData.adminNick})`;
                            setTip(container, `处理人: ${admin}`);
                        }
                        return "";
                    }
                    case 17: { // jsonGrayTipElement
                        const subData = data.jsonGrayTipElement;
                        const raw = subData.jsonStr;
                        const parts = JSON.parse(raw)?.items;
                        if (!parts) return "";
                        const queue = [];
                        parts.forEach((part) => {
                            if (part.type === "qq") {
                                queue.push([part.nm, validQQ(part.uin) ? part.uin : uinToQQ(part.uid)]);
                            }
                        });
                        if (!container) return "";
                        for (const node of container.childNodes) {
                            if (node.nodeType !== Node.TEXT_NODE) continue;
                            const text = node.textContent;
                            const tuple = queue[0];
                            if (!tuple) break;
                            if (text === tuple[0]) {
                                const span = document.createElement("span");
                                span.textContent = text;
                                setTip(span, `${tuple[1]} (${text})`);
                                node.replaceWith(span);
                                queue.shift();
                            }
                        }
                        return "";
                    }
                }
            }
            case 9: { // walletElement
                const data = msgRecEl.walletElement;
                function format(s) {
                    // "123" -> "1.23"; "12" -> "0.12"; "1" -> "0.01"
                    const l = [...s];
                    while (l.length < 3) {
                        l.unshift("0");
                    }
                    l.splice(-2, 0, ".");
                    return l.join("");
                }
                const state = data.grabState ? (data.grabbedAmount === "0" ? "未抢到" : `已领取 ￥${format(data.grabbedAmount)}`) : "未领取";
                const tip = data.receiver.notice;
                return `${tip} (${state})`
            }
            case 10: { // arkElement
                const raw = msgRecEl.arkElement?.bytesData;
                if (!raw) return "";
                const data = JSON.parse(raw);
                const title = data.meta?.detail_1?.title || data.meta?.news?.tag;
                const desc = data.meta?.detail_1?.desc || data.meta?.news?.title;
                const prompt = data.prompt;
                if (title && desc) {
                    return `[${title}] ${desc}`;
                } else if (prompt) {
                    return prompt;
                } else {
                    return "";
                }
            }
            case 11: { // marketFaceElement
                const data = msgRecEl.marketFaceElement;
                return `${data.faceName} (${data.imageWidth} x ${data.imageHeight})`;
            }
            default: {
                return "";
            }
        }
    }
    // Process message component
    function inspectio(component) {
        const el = component?.vnode?.el;
        if (el?.classList?.contains("message")) {
            const msgRecEls = component?.props?.msgRecord?.elements;
            const container = el.querySelector(".message-content__wrapper > div > div");
            if (!msgRecEls?.length) return;
            for (let i = 0; i < msgRecEls.length; i++) {
                const msgRecEl = msgRecEls[i];
                const desc = getDesc(msgRecEl, el);
                const dom = container?.children[i];
                if (desc && dom) {
                    // dom.title = desc;
                    setTip(dom, desc);
                }
            }
        }
    }
    function enable() {
        if (enabled) return;
        window.__VUE_MOUNT__.push(inspectio);
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(inspectio);
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
    window.addEventListener("scriptio-toggle", (event) => {
        const path = event.detail.path;
        if (path === self) {
            if (event.detail.enabled) {
                enable();
            } else {
                disable();
            }
        }
    });
})();
