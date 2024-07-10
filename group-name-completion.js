// ==UserScript==
// @name         Group name completion
// @description  给群名称补全各种信息：备注+昵称+QQ号
// @run-at main, chat
// @version      0.1
// @author       Shapaper@126.com
// @license      gpl-3.0
// ==/UserScript==
(function () {
    const self = document.currentScript?.getAttribute("data-scriptio-script");
    let enabled = false;
    function process(component) {
        const el = component?.vnode?.el;
        if (!el || !(el instanceof Element)) {
            return;
        }
        if (!el.querySelector(".user-name .text-ellipsis")) {
            return;
        }
        let user_name = el.querySelector(".user-name .text-ellipsis");
        const senderUin=component?.props?.msgRecord?.senderUin
        if (senderUin !== undefined && !user_name.classList.contains("has-extra-info")){

            let nick = component?.props?.msgRecord?.sendNickName;
            let remark = component?.props?.msgRecord?.sendRemarkName;
            //console.log(nick,remark)
            if (remark){remark=remark+"|";}
            if (nick){nick=nick+"|";}
            user_name.textContent = user_name.textContent+"("+remark+nick+senderUin+")";
            user_name.classList.add("has-extra-info");
        }
    }

    function enable() {
        if (enabled) return;
        if (!window.__VUE_MOUNT__) {
            window.__VUE_MOUNT__ = [];
        }

        enabled = true;
        console.log("群名称补全已开启");
        window.__VUE_MOUNT__.push(process);
    }

    function disable() {
        enabled = false;
        console.log("群名称补全已关闭");
        if (!enabled) return;
        const index = window.__VUE_MOUNT__.indexOf(process);
        if (index > -1) {
            window.__VUE_MOUNT__.splice(index, 1);
        }
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
