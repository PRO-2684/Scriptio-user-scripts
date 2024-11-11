// ==UserScript==
// @name         Inspectio 🔎
// @description  添加各类提示信息，Ctrl+Click 复制，功能细节详见 README，需要开启 LiteLoader Hook Vue
// @run-at       main, chat, record, forward, notice, group-essence, group-essence-share
// @reactive     true
// @version      0.3.9
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#inspectio
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

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
    function removePrefix(s, p) {
        return s.startsWith(p) ? s.slice(p.length) : s;
    }
    function trimFace(s) {
        if (s.startsWith("[") && s.endsWith("]")) {
            return s.slice(1, -1);
        } else {
            return removePrefix(s, "/");
        }
    }
    function formatFace(s) {
        return `[${trimFace(s)}]`;
    }
    function b64decode(s) {
        return s ? decodeURIComponent(escape(window.atob(s))) : "";
    }
    function validQQ(qq) {
        return qq && qq !== "0";
    }
    function uinInfo(uin, msgEl) { // Input: uin & `.message` element; Output: {cardName (Group nick), nick, role, qid, uin...} (Only tries to find in the current group)
        return msgEl.__VUE__?.[0]?.props?.getMemberInfoByUid(uin);
    }
    function uinToQQ(uin, msgEl) { // Input: uin & `.message` element; Output: qq (Only tries to find in the current group)
        return uinInfo(uin, msgEl)?.uin || uin;
    }
    function clickHandler(e) {
        if (e.ctrlKey) {
            e.stopImmediatePropagation();
            navigator?.clipboard?.writeText(this.title);
        }
    }
    function setTip(el, tip) {
        const tipAttr = "inspectio-tip";
        if (!el || !tip) return false;
        el.title = tip;
        if (el.hasAttribute(tipAttr)) return;
        el.addEventListener("click", clickHandler, { capture: true });
        el.toggleAttribute(tipAttr, true);
        return true;
    }
    function formatFileSize(bytes) { // By Shapaper@126.com
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    function formatDuration(seconds) { // By Shapaper@126.com
        if (seconds === 0) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        seconds %= 60;
        const parts = [];
        if (hours > 0) parts.push(hours);
        if (minutes > 0) parts.push(minutes);
        if (seconds > 0) parts.push(seconds);
        if (parts.length === 1) {
            return parts[0] + 's';
        } else {
            return parts.join(':');
        }
    }
    // Get description for each element
    function getMsgElementDesc(msgRecEl, msgEl, el) { // Input: one of `.props.msgRecord.elements`, `.message` element and current element
        if (!msgRecEl) return "";
        switch (msgRecEl.elementType) {
            case 1: { // textElement
                const data = msgRecEl.textElement;
                if (data.atType === 2) { // mention someone
                    const account = validQQ(data.atUid) ? data.atUid : uinToQQ(data.atNtUid, msgEl);
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
                const size = formatFileSize(data.fileSize);
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
                const tip = `${data.fileName}${optionalDimension}\nSize: ${formatFileSize(data.fileSize)}\nMD5: ${data.fileMd5.toUpperCase()}${optionalPath}`;
                setTip(msgEl.querySelector(".file-element"), tip);
                msgEl.querySelector(".file-element .file-name")?.removeAttribute("title");
                return "";
            }
            case 4: { // pttElement
                const data = msgRecEl.pttElement;
                const optionalText = data.text ? `\n${data.text}` : "";
                const durationFormatted = formatDuration(data.duration);
                const tip = `${data.fileName} (${durationFormatted}, ${formatFileSize(data.fileSize)})${optionalText}`;
                return tip;
            }
            case 5: { // videoElement
                const data = msgRecEl.videoElement;
                return `${data.fileName} (${formatDuration(data.fileTime)}, ${formatFileSize(data.fileSize)})`;
            }
            case 6: { // faceElement
                const data = msgRecEl.faceElement;
                const id = data.faceIndex;
                const face = state.McEmojiStore?.qqEmojiMap?.[id];
                let final = "";
                if (face) {
                    const faceName = face?.name ?? face?.describe;
                    if (faceName) {
                        final += formatFace(faceName);
                    } else {
                        final += formatFace(`未知表情#${id}`);
                    }
                } else if (data?.faceText) {
                    final += formatFace(data.faceText);
                }
                if (data.chainCount) {
                    final += ` (x${data.chainCount})`;
                }
                el?.setAttribute("data-summary", final);
                if (data.randomType === 1 && data.resultId) {
                    final += `\n随机结果: ${data.resultId}`;
                }
                const observer = new MutationObserver((mutations) => {
                    const img = el.querySelector("img.face-element__icon");
                    if (img) {
                        img.removeAttribute("ondragstart");
                        observer.disconnect();
                    }
                });
                observer.observe(el, { childList: true });
                setTimeout(() => observer.disconnect(), 1000);
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
                        const sender = `${uinToQQ(senderUin, msgEl)} (${subData.origMsgSenderMemRemark || subData.origMsgSenderNick})`;
                        if (operatorUin === senderUin) {
                            setTip(container, sender);
                        } else {
                            const operator = `${uinToQQ(operatorUin, msgEl)} (${subData.operatorMemRemark || subData.operatorNick})`;
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
                            const admin = `${uinToQQ(adminUin, msgEl)} (${adminName})`;
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
                            if (part.type === "qq") { // QQ
                                const info = uinInfo(part.uid, msgEl);
                                const nick = part.nm || info?.cardName || info?.nick || "<未知昵称>";
                                queue.push([nick, `${uinToQQ(part.uid, msgEl)} (${nick})`]);
                            } else if (part.type === "url") {
                                if (part.jp === "5") queue.push([part.txt, `${part.param[0]} (${part.txt})`]); // QQ
                                else if (part.jp?.length > 1) queue.push([part.txt, part.jp]); // Link
                            }
                        });
                        if (!container) return "";
                        for (const node of container.childNodes) {
                            if (node.nodeType !== Node.TEXT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
                            const text = node.textContent;
                            const tuple = queue[0];
                            if (!tuple) break;
                            if (text === tuple[0]) {
                                const span = document.createElement("span");
                                span.textContent = text;
                                setTip(span, tuple[1]);
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
                function altLink(link) {
                    final = "**Alt+Click 以在浏览器中打开链接**\n" + final;
                    container?.addEventListener("click", (e) => {
                        if (e.altKey) {
                            e.stopImmediatePropagation();
                            scriptio.open("link", link);
                        }
                    }, { capture: true });
                }
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
                    case "com.tencent.announce.lua": {
                        if (data?.bizsrc !== "creategroupmsg.groupaio") return; // Not supported yet
                        let qq = null;
                        for (let i = 1; i <= 3; i++) {
                            const url = data?.meta?.announce[`button${i}URL`];
                            const params = new URLSearchParams(url);
                            qq ??= params.get("groupcode") ?? params.get("guin");
                        }
                        final = `${data.prompt}\n源 QQ 群: ${qq}`;
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
                        altLink(url);
                        break;
                    }
                    case "com.tencent.video.lua": { // QQ 短视频 (小世界)
                        const detail = data.meta?.video;
                        const url = detail?.pcJumpUrl;
                        final = `${data.prompt}\n${detail?.title} (${detail?.nickname})`;
                        altLink(url);
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
                    case "com.tencent.qun.invite": { // 邀请加群
                        const subData = data.meta?.news;
                        const url = subData?.jumpUrl;
                        final = subData?.desc;
                        if (url) {
                            const qq = new URL(url).searchParams.get("groupcode");
                            if (qq) {
                                final += ` (${qq})`;
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
                    case "com.tencent.troopsharecard": { // 推荐群聊
                        const subData = data.meta?.contact;
                        const url = subData?.jumpUrl;
                        final = data.prompt;
                        const groupName = subData?.nickname;
                        if (groupName) {
                            final += `: ${groupName}`;
                        }
                        if (url) {
                            const qq = new URL(url).searchParams.get("group_code");
                            if (qq) {
                                final += ` (${qq})`;
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
                        if (subData?.contact) {
                            final += `\n${subData.contact}`;
                        }
                        break;
                    }
                    case "com.tencent.contact.lua": { // 推荐好友
                        const url = data.meta?.contact?.jumpUrl;
                        final = data.prompt;
                        if (url) {
                            const urlObj = new URL(url);
                            const qq = urlObj.searchParams.get("uin") ?? urlObj.searchParams.get("robot_uin");
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
                        if (data.meta?.contact?.contact) {
                            final += `\n${data.meta.contact.contact}`;
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
                        altLink(url);
                        break;
                    }
                    default: { // 尝试通配
                        // com.tencent.channelrobot.smallpic
                        const detail = data.meta?.detail;
                        final = data.prompt || "";
                        final += detail?.title ? `\nTitle: ${detail.title}` : "";
                        final += detail?.subTitle ? `\nSubtitle: ${detail.subTitle}` : "";
                        final += detail?.desc ? `\nDesc: ${detail.desc}` : "";
                        break;
                    }
                }
                return "**Shift+Click 以复制卡片消息代码**\n" + final;
            }
            case 11: { // marketFaceElement
                const data = msgRecEl.marketFaceElement;
                el?.setAttribute("data-summary", formatFace(data.faceName));
                el?.removeAttribute("draggable");
                el?.removeAttribute("ondragstart");
                return `${formatFace(data.faceName)} (${data.imageWidth} x ${data.imageHeight})`;
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
    const actionsMap = new Map([
        ["message", (component, el) => {
            if (component?.proxy?.reply) { // Chat messages
                function updateAbstract() {
                    const avatar = el.querySelector(".message-container > .avatar-span");
                    if (avatar) {
                        let tip = "";
                        const nick = component?.props?.msgRecord?.sendNickName;
                        if (nick) {
                            tip += `昵称: ${nick}`;
                        }
                        const remark = component?.props?.msgRecord?.sendRemarkName;
                        if (remark) {
                            tip += `\n备注: ${remark}`;
                        }
                        const uin = component?.props?.msgRecord?.senderUin;
                        if (validQQ(uin)) {
                            tip += `\nQQ: ${uin}`;
                        }
                        const title = component?.props?.msgRecord?.msgAttrs?.get?.(2)?.groupHonor?.uniqueTitle;
                        if (title) {
                            tip += `\n头衔: ${title}`;
                        }
                        setTip(avatar, tip);
                    }
                    const msgRecEls = component?.props?.msgRecord?.elements;
                    const container = el.querySelector(".message-content__wrapper > div > div");
                    if (!msgRecEls?.length) return;
                    for (let i = 0; i < msgRecEls.length; i++) {
                        const msgRecEl = msgRecEls[i];
                        const subEl = container?.children[i];
                        const desc = getMsgElementDesc(msgRecEl, el, subEl);
                        if (desc && subEl) {
                            setTip(subEl, desc);
                        }
                    }
                }
                component.proxy.$watch("$props.msgRecord", updateAbstract, { immediate: true, flush: "post" });
            } else if (component?.proxy?.message?.share_time) { // Group essence share
                const timestamp = component.proxy.message.share_time * 1000;
                setTip(el.querySelector(".message-time"), timestamp);
            }
        }],
        ["recent-contact-item", (component, el) => {
            if (!component?.proxy?.abstracts) return;
            const container = el.querySelector(".item-dragging-over");
            container?.classList.remove("item-dragging-over"); // Allow the tip to be shown
            function updateAbstract() {
                const data = component?.proxy?.abstracts;
                let label = "";
                for (const part of data) {
                    switch (part.type) {
                        case "text":
                            label += part.content;
                            break;
                        case "face":
                            label += formatFace(part.faceText);
                            break;
                        default:
                            break;
                    }
                }
                if (label) {
                    const summary = el.querySelector(".summary-main") ?? el.querySelector(".recent-contact-abstract");
                    setTip(summary, label);
                }
            }
            function updateInfoOld() {
                const data = component?.proxy?.contactItemData;
                if (!data) return;
                const { name, uin } = data;
                const optionalUin = (uin && uin !== "0" && uin !== "") ? ` (${uin})` : "";
                const title = name + optionalUin;
                const info = el.querySelector(".main-info > span");
                setTip(info, title);
            }
            function updateInfo() {
                const name = component?.proxy?.contactName;
                const uin = component?.proxy?.peerUid;
                const optionalUin = (uin && uin !== "0" && uin !== "") ? ` (${uin})` : "";
                const title = name + optionalUin;
                const info = el.querySelector(".main-info > span");
                setTip(info, title);
            }
            function updateUnread() {
                const cnt = component?.proxy?.unreadCnt;
                const bubble = el.querySelector(".summary-bubble > div");
                if (cnt) {
                    setTip(bubble, cnt.toString());
                } else {
                    bubble?.removeAttribute("title");
                }
            }
            function watch(attr, func) {
                component.proxy.$watch(attr, func, { immediate: true, flush: "post" });
            }
            watch("abstracts", updateAbstract);
            if (component.proxy.contactItemData) {
                watch("contactItemData", updateInfoOld);
            } else {
                watch("contactName", updateInfo);
                watch("peerUid", updateInfo);
            }
            watch("unreadCnt", updateUnread);
        }],
        ["buddy-like-btn", (component, el) => {
            if (!component?.props?.totalLikeLimit) return;
            function showLikes() {
                const likes = component?.props?.totalLikes;
                setTip(el, likes.toString());
            }
            component.proxy.$watch("$props.totalLikes", showLikes, { immediate: true, flush: "post" });
        }],
        ["notice-item", (component, el) => {
            const qq = component?.props?.noticeData?.uin;
            const nameSpan = el.querySelector(".publisher-name");
            if (validQQ(qq) && nameSpan) {
                setTip(nameSpan, `QQ: ${qq}`);
            }
            const timeStamp = component?.props?.noticeData?.publishTime;
            const date = new Date(parseInt(timeStamp) * 1000);
            const exactTime = `${date.toLocaleString("zh-CN")}\n${date.getTime()}`;
            const timeSpan = nameSpan?.nextElementSibling;
            setTip(timeSpan, exactTime);
        }],
        ["message-list", (component, el) => {
            const msgList = component?.proxy?.msgList;
            const headers = el.querySelectorAll(".msg-list > .message-item > .message-item-container > .message-item-container-top > .message-item-container-top-info");
            if (msgList.length !== headers.length || msgList.length === 0) return;
            function timeTip(timestampSeconds) {
                const date = new Date(timestampSeconds * 1000);
                return `${date.toLocaleString("zh-CN")}\n${date.getTime()}`;
            }
            for (let i = 0; i < msgList.length; i++) {
                const msg = msgList[i];
                const header = headers[i];
                const senderNick = header.querySelector(".message-item-container-top-info-nick");
                setTip(senderNick, `发送者 QQ: ${msg.sender_uin}`);
                const [sendTime, _1, _2, addTime, adderNick] = header.querySelector(".message-item-container-top-info-send").children;
                setTip(sendTime, `发送时间: ${timeTip(msg.sender_time)}`);
                setTip(addTime, `加精时间: ${timeTip(msg.add_digest_time)}`);
                setTip(adderNick, `加精者 QQ: ${msg.add_digest_uin}`);
            }
        }],
    ]);
    function inspectio(component) {
        const el = component?.vnode?.el;
        const classList = el?.classList ?? [];
        for (const className of classList) {
            if (actionsMap.has(className)) {
                actionsMap.get(className)(component, el);
                break;
            }
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
    const vueMount = scriptio.vueMount;
    function enable() {
        if (enabled) return;
        vueMount.push(inspectio);
        style.disabled = false;
        enabled = true;
    }
    function disable() {
        if (!enabled) return;
        const index = vueMount.indexOf(inspectio);
        if (index > -1) {
            vueMount.splice(index, 1);
        }
        style.disabled = true;
        enabled = false;
    }
    scriptio.listen((v) => {
        v ? enable() : disable();
    }, true);
})();
