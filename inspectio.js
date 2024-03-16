// 🔎 添加各类提示信息，Ctrl+Click 复制，功能细节详见 README，需要 hook-vue.js 的支持
// @run-at main, chat, record, forward

(function () {
    const state = document.querySelector("#app").__vue_app__.config.globalProperties.$store.state;
    const MAXLEN = 100;
    let enabled = false;
    // Helper functions
    function truncate(s) {
        if (s.length > MAXLEN) {
            return s.slice(0, MAXLEN) + "...";
        }
        return s;
    }
    function b64decode(s) {
        return s ? decodeURIComponent(escape(window.atob(s))) : "";
    }
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
    function clickHandler(e) {
        if (e.ctrlKey) {
            e.stopImmediatePropagation();
            navigator?.clipboard?.writeText(this.title);
        }
    }
    function setTip(el, tip) {
        const tipAttr = "inspectio-tip";
        if (!el || !tip) return;
        el.title = tip;
        if (el.hasAttribute(tipAttr)) return;
        el.addEventListener("click", clickHandler, { capture: true });
        el.toggleAttribute(tipAttr, true);
    }
    // Get description for each element
    function getDesc(msgRecEl, msgEl, el) { // Input: one of `.props.msgRecord.elements`, `.message` element and current element
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
                const size = `${data.fileSize} Bytes`;
                const info = `${dimension}, ${size}`;
                const summary = data.summary;
                const fileName = data.fileName;
                const url = data.originImageUrl ? "https://gchat.qpic.cn" + data.originImageUrl : "图片已过期";
                if (summary && summary !== "[动画表情]") {
                    el?.setAttribute("data-summary", summary);
                } else {
                    el?.setAttribute("data-summary", "");
                }
                return (summary ? `${truncate(summary)} (${info})` : info) + `\n${fileName}\n${url}`;
            }
            case 3: { // fileElement
                const data = msgRecEl.fileElement;
                const optionalDimension = data.picWidth && data.picHeight ? ` (${data.picWidth} x ${data.picHeight})` : "";
                const optionalPath = data.filePath ? `\nPath: ${data.filePath}` : "";
                const tip = `${data.fileName}${optionalDimension}\nSize: ${data.fileSize} Bytes\nMD5: ${data.fileMd5.toUpperCase()}${optionalPath}`;
                setTip(msgEl.querySelector(".file-element"), tip);
                msgEl.querySelector(".file-element .file-name")?.removeAttribute("title");
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
                let final = "";
                if (faceMap) {
                    const face = faceMap[id];
                    if (face?.name) {
                        final += `[${face.name}]`;
                    } else {
                        final += face?.faceText || `[未知表情#${id}]`;
                    }
                }
                if (data.chainCount) {
                    final += ` (x${data.chainCount})`;
                }
                el?.setAttribute("data-summary", final);
                if (data.randomType === 1 && data.resultId) {
                    final += `\n随机结果: ${data.resultId}`;
                }
                return final;
            }
            case 7: { // replyElement
                const data = msgRecEl.replyElement;
                const srcExpired = data.sourceMsgExpired || data.sourceMsgIdInRecords === "0";
                const start = srcExpired ? "引用消息未找到/已过期\n" : "";
                return `${start}发送者: ${data.senderUid}\n发送时间: ${(new Date(data.replyMsgTime * 1000)).toLocaleString("zh-CN")}`;
            }
            case 8: { // grayTipElement
                const data = msgRecEl.grayTipElement;
                const container = msgEl.querySelector(".gray-tip-content.gray-tip-element");
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
                        const wording = subData.wording.trim();
                        const msgTime = container.querySelector(".message-time");
                        if (wording && !container.querySelector(".revoke-wording")) {
                            const span = document.createElement("span");
                            span.className = "revoke-wording";
                            span.textContent = "，" + wording;
                            if (msgTime) {
                                msgTime.before(span);
                            } else {
                                container.append(span);
                            }
                        }
                        return "";
                    }
                    case 4: { // groupElement
                        const subData = data.groupElement;
                        let adminUin = "";
                        let adminName = "";
                        let extra = "";
                        switch (subData.type) {
                            case 1: { // Add member
                                adminUin = subData.adminUid;
                                adminName = subData.adminRemark || subData.adminNick;
                                break;
                            }
                            case 2: // Disband group
                            case 5: // Rename group
                                break;
                            case 8: { // Shut up someone/all
                                const shutUpData = subData.shutUp;
                                adminUin = shutUpData.admin.uid;
                                adminName = shutUpData.admin.name;
                                const duration = shutUpData.duration;
                                if (duration && duration !== "0") { // duration === "0": unban
                                    extra = `禁言时长: ${duration === "268435455" ? "∞" : duration + "s"}, `;
                                }
                                break;
                            }
                            default: {
                                break;
                            }
                        }
                        if (adminUin) {
                            const admin = `${uinToQQ(adminUin)} (${adminName})`;
                            setTip(container, `${extra}处理人: ${admin}`);
                        }
                        return "";
                    }
                    case 10: { // fileReceiptElement
                        const subData = data.fileReceiptElement;
                        const fname = subData.fileName;
                        if (fname) {
                            setTip(container, `文件名: ${fname}`);
                        }
                        return "";
                    }
                    case 12: { // xmlElement
                        const subData = data.xmlElement;
                        setTip(container, subData.content);
                        return "";
                    }
                    case 15: { // aioOpGrayTipElement
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
                            } else if (part.type === "url" && part.jp === "5") {
                                queue.push([part.txt, part.param[0]]);
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
                    default: {
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
                let final = "";
                const raw = msgRecEl.arkElement?.bytesData;
                if (!raw) return "";
                const data = JSON.parse(raw);
                const container = msgEl.querySelector(".ark-msg-content-container .ark-item-container");
                container?.addEventListener("click", (e) => {
                    if (e.shiftKey) { // Shift+Click to copy raw code
                        e.stopImmediatePropagation();
                        navigator?.clipboard?.writeText(raw);
                    }
                }, { capture: true });
                switch (data.app) {
                    case "com.tencent.structmsg": { // 结构化消息 (链接分享)
                        const detail = data.meta?.news;
                        const from = truncate(detail?.tag);
                        const title = truncate(detail?.title);
                        const desc = truncate(detail?.desc);
                        final = from && title ? `[${from}] ${title}` : data.prompt || "";
                        if (desc) {
                            final += `\n${desc}`;
                        }
                        break;
                    }
                    case "com.tencent.miniapp_01": { // 小程序 1
                        const detail = data.meta?.detail_1;
                        const title = truncate(detail?.title);
                        const desc = truncate(detail?.desc);
                        final = title && desc ? `[${title}] ${desc}` : data.prompt || "";
                        break;
                    }
                    case "com.tencent.miniapp.lua": { // 小程序 2
                        const detail = data.meta?.miniapp;
                        const title = truncate(detail?.source || detail?.tag || "未知小程序");
                        const desc = truncate(detail?.title);
                        final = title && desc ? `[${title}] ${desc}` : data.prompt || "";
                        break;
                    }
                    case "com.tencent.mannounce": { // 群公告
                        const detail = data.meta?.mannounce;
                        const title = b64decode(detail?.title);
                        const desc = b64decode(detail?.text);
                        final = title && desc ? `[${title}]\n${desc}` : data.prompt || "";
                        break;
                    }
                    case "com.tencent.multimsg": { // 转发消息
                        const detail = data.meta?.detail;
                        const fileName = detail?.uniseq;
                        const resId = detail?.resid;
                        const container = msgEl.querySelector(".forward-msg");
                        let final = "";
                        if (fileName) {
                            final += `fileName/uniseq: ${fileName}\n`;
                        }
                        if (resId) {
                            final += `resId: ${resId}\n`;
                        }
                        if (container) {
                            setTip(container, final);
                            for (const child of container.children) {
                                if (child.classList.contains("fwd-content")) {
                                    child.title = child.textContent;
                                }
                            }
                        }
                        return "";
                    }
                    case "com.tencent.qzone.video": // QQ 空间视频
                    case "com.tencent.wezone.share": { // QQ 短视频
                        const detail = data.meta?.data;
                        const feedInfo = detail?.feedInfo;
                        const qq = detail?.userInfo?.uin || "未知 QQ";
                        const title = truncate(data.prompt) || "<无标题>";
                        const desc = truncate(data.desc) || "<无描述>";
                        const statistics = [feedInfo?.likeNum, feedInfo?.commentNum, feedInfo?.shareNum];
                        const mapping = ["赞", "评", "转"];
                        const stats = statistics.map((v, i) => (v !== null && v !== undefined) ? `${v} ${mapping[i]}` : "").filter(Boolean).join(", ") || "<无统计数据>";
                        const url = feedInfo?.jumpUrl;
                        final = `${title} (${qq})\n${stats}\n${desc}`;
                        if (url && container) {
                            final = "**Alt+Click 以在浏览器中打开链接**\n" + final;
                            container.addEventListener("click", (e) => {
                                if (e.altKey) {
                                    e.stopImmediatePropagation();
                                    scriptio.open("link", url);
                                }
                            }, { capture: true });
                        }
                        break;
                    }
                    case "com.tencent.qzone.albumInvite": { // QQ 空间说说
                        const detail = data.meta?.albumData;
                        const url = new URL(detail?.h5Url);
                        const qq = url.searchParams.get("u") || "未知 QQ";
                        final = `[QQ 空间] ${detail?.title} (${qq})\n${detail?.desc}`;
                        break;
                    }
                    case "com.tencent.gamecenter.gameshare": { // 游戏分享
                        final = "[游戏分享] " + data.prompt || "";
                        break;
                    }
                    case "com.tencent.troopsharecard": { // 推荐群聊
                        const subData = data.meta?.contact;
                        const url = subData?.jumpUrl;
                        final = data.prompt;
                        if (url) {
                            const groupName = subData?.nickname;
                            if (groupName) {
                                final += `: ${groupName}`;
                            }
                            const qq = new URL(url).searchParams.get("group_code");
                            if (qq) {
                                final += ` (${qq})`;
                            }
                            if (subData?.contact) {
                                final += `\n${subData.contact}`;
                            }
                            if (container) {
                                final = "**Alt+Click 以复制邀请链接**\n" + final;
                                container.addEventListener("click", (e) => {
                                    if (e.altKey) {
                                        e.stopImmediatePropagation();
                                        navigator?.clipboard?.writeText(url);
                                    }
                                }, { capture: true });
                            }
                        }
                        break;
                    }
                    case "com.tencent.contact.lua": { // 推荐好友
                        const url = data.meta?.contact?.jumpUrl;
                        final = data.prompt;
                        if (url) {
                            const qq = new URL(url).searchParams.get("uin");
                            if (qq) {
                                final += ` (${qq})`;
                                if (container) {
                                    final = "**Alt+Click 以复制 QQ 号**\n" + final;
                                    container.addEventListener("click", (e) => {
                                        if (e.altKey) {
                                            e.stopImmediatePropagation();
                                            navigator?.clipboard?.writeText(qq);
                                        }
                                    }, { capture: true });
                                }
                            }
                        }
                        break;
                    }
                    case "com.tencent.map": { // 位置分享
                        const detail = data.meta?.["Location.Search"];
                        const keyword = detail?.address;
                        const lat = detail?.lat;
                        const lng = detail?.lng;
                        const pos = `${lat},${lng}`;
                        const name = detail?.name || "位置分享";
                        final = `[${name}]\n${keyword}\n(${pos})`;
                        if (container) {
                            final = "**Alt+Click 以在浏览器打开腾讯地图**\n" + final;
                            container.addEventListener("click", (e) => {
                                if (e.altKey) {
                                    e.stopImmediatePropagation();
                                    scriptio.open("link", `https://apis.map.qq.com/uri/v1/marker?marker=coord:${pos};title:${name};addr:${keyword}&referer=qqnt`);
                                }
                            }, { capture: true });
                        }
                        break;
                    }
                    case "com.tencent.forum": { // 频道
                        const detail = data.meta?.detail;
                        const url = detail?.jump_url;
                        const channelInfo = detail?.channel_info;
                        const channel = `${channelInfo?.guild_name} > ${channelInfo?.channel_name}`;
                        const poster = detail?.poster?.nick;
                        final = `${data.prompt}\n频道：${channel}\n楼主：${poster}`;
                        if (url && container) {
                            final = "**Alt+Click 以在浏览器中打开链接**\n" + final;
                            container.addEventListener("click", (e) => {
                                if (e.altKey) {
                                    e.stopImmediatePropagation();
                                    scriptio.open("link", url);
                                }
                            }, { capture: true });
                        }
                        break;
                    }
                    default:
                        final = data.prompt || "";
                        break;
                }
                return "**Shift+Click 以复制卡片消息代码**\n" + final;
            }
            case 11: { // marketFaceElement
                const data = msgRecEl.marketFaceElement;
                el?.setAttribute("data-summary", data.faceName);
                el?.addEventListener("click", (e) => {
                    if (e.altKey) {
                        e.stopImmediatePropagation();
                        scriptio.open("link", data.staticFacePath);
                    }
                });
                return `**Alt+Click 以在外部程序中打开图片**\n${data.faceName} (${data.imageWidth} x ${data.imageHeight})`;
            }
            case 16: { // multiForwardMsgElement
                const data = msgRecEl.multiForwardMsgElement;
                const fileName = data.fileName;
                const resId = data.resId;
                const xml = data.xmlContent;
                const container = msgEl.querySelector(".forward-msg");
                let final = "";
                if (fileName) {
                    final += `fileName/uniseq: ${fileName}\n`;
                }
                if (resId) {
                    final += `resId: ${resId}\n`;
                }
                if (xml && container) {
                    final = "**Shift+Click 以复制 XML 代码**\n" + final;
                    container.addEventListener("click", (e) => {
                        if (e.shiftKey) {
                            e.stopImmediatePropagation();
                            navigator?.clipboard?.writeText(xml);
                        }
                    }, { capture: true });
                    setTip(container, final);
                    for (const child of container.children) {
                        if (child.classList.contains("fwd-content")) {
                            child.title = child.textContent;
                        }
                    }
                }
                return "";
            }
            case 21: { // avRecordElement (通话)
                const data = msgRecEl.avRecordElement;
                const time = parseInt(data.time) / 1000;
                const type = data.mainType === 1 ? "语音" : "视频";
                const status = time ? `通话时长: ${time}s` : "未接听";
                const tip = `${type}通话 (${status})`;
                const container = msgEl.querySelector(".msg-content-container.av-message__container");
                setTip(container, tip);
                return "";
            }
            default: {
                return "";
            }
        }
    }
    // Process component
    function inspectio(component) {
        const el = component?.vnode?.el;
        if (el?.classList?.contains("message")) {
            function updateAbstract() {
                const msgRecEls = component?.props?.msgRecord?.elements;
                const container = el.querySelector(".message-content__wrapper > div > div");
                if (!msgRecEls?.length) return;
                for (let i = 0; i < msgRecEls.length; i++) {
                    const msgRecEl = msgRecEls[i];
                    const subEl = container?.children[i];
                    const desc = getDesc(msgRecEl, el, subEl);
                    if (desc && subEl) {
                        setTip(subEl, desc);
                    }
                }
            }
            component.proxy.$watch("$props.msgRecord.elements", updateAbstract, { immediate: true, flush: "post" });
        } else if (el?.classList?.contains("recent-contact-item") && component?.proxy?.abstractAriaLabel) {
            const container = el.querySelector(".list-item__container");
            container?.classList.remove("item-dragging-over"); // Allow the tip to be shown
            function updateAbstract() {
                const label = component?.proxy?.abstractAriaLabel;
                if (label) {
                    const summary = el.querySelector(".recent-contact-abstract");
                    summary.title = label;
                }
            }
            function updateInfo() {
                const data = component?.proxy?.contactItemData;
                const name = data?.name;
                const optionalUin = (data?.uin && data?.uin !== "0") ? ` (${data.uin})` : "";
                const title = name + optionalUin;
                const info = el.querySelector(".main-info > span");
                info.title = title;
            }
            function updateUnread() {
                const cnt = component?.proxy?.unreadCnt;
                const bubble = el.querySelector(".summary-bubble > div");
                if (cnt) {
                    bubble.title = cnt.toString();
                } else {
                    bubble.removeAttribute("title");
                }
            }
            component.proxy.$watch("abstractAriaLabel", updateAbstract, { immediate: true, flush: "post" });
            component.proxy.$watch("contactItemData", updateInfo, { immediate: true, flush: "post" });
            component.proxy.$watch("unreadCnt", updateUnread, { immediate: true, flush: "post" });
        }
    }
    const style = document.head.appendChild(document.createElement("style"));
    style.id = "scriptio-inspectio";
    style.textContent = `
    .image.pic-element::before, .image.market-face-element::before {
        content: attr(data-summary);
        position: absolute;
        top: 1em;
        left: 0.5em;
        color: var(--on_bg_text);
        opacity: 0.6;
        font-size: var(--font_size_1);
    }
    .lottie::before {
        content: attr(data-summary);
        position: absolute;
        top: 0;
        left: 0.3em;
        color: var(--on_bg_text);
        opacity: 0.6;
        font-size: var(--font_size_1);
    }`;
    function enable() {
        if (enabled) return;
        window.__VUE_MOUNT__.push(inspectio);
        style.disabled = false;
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(inspectio);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
        style.disabled = true;
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
