// 添加一些常用的快捷键
(function () {
    const self = document.currentScript?.getAttribute("data-scriptio-script");
    // function log(...args) { console.log("[Shortcutio]", ...args ); }
    function log(...args) { }
    function scriptioWrapper(toggleFunc) {
        window.addEventListener("scriptio-toggle", (event) => {
            const path = event.detail.path;
            if (path === self) {
                toggleFunc(event.detail.enabled);
            }
        });
        toggleFunc(true);
    }
    function keyDownWrapper(f) {
        let listening = false;
        function onKeyDown (e) {
            // 输入状态并且未使用修饰键下不触发
            const ele = document.activeElement;
            if ((ele.tagName === "INPUT" || ele.tagName === "TEXTAREA" || ele.getAttribute("contenteditable") === "true")
                && !e.ctrlKey && !e.altKey && !e.metaKey) {
                return;
            }
            // 输入法下不触发
            if (e.isComposing || e.keyCode === 229) {
                return;
            }
            log(`${e.key}`);
            f(e);
        }
        function toggle(enabled) {
            if (enabled && !listening) {
                document.addEventListener("keydown", onKeyDown);
            } else if (!enabled && listening) {
                document.removeEventListener("keydown", onKeyDown);
            }
            listening = enabled;
        }
        scriptioWrapper(toggle);
    }
    const page = window.location.hash.slice(2).split("/")[0];
    switch (page) {
        case "main": {
            function clickMenuButton() {
                const menu = document.querySelector("div.sidebar__menu div.func-menu-more-component div.sidebar-icon");
                if (menu) {
                    menu.click();
                    return true;
                } else {
                    log("Menu not found");
                    return false;
                }
            }
            let openSettingsInternal = null;
            function getSettingsButton() {
                if (!clickMenuButton()) {
                    return Promise.resolve(null);
                }
                let max = 10;
                return new Promise((resolve) => {
                    const timer = window.setInterval(() => {
                        const menu = document.querySelector("div.q-context-menu.more-menu");
                        if (menu && menu.children) {
                            for (const child of menu.children) {
                                if (child.textContent === "设置") {
                                    window.clearInterval(timer);
                                    log("Settings button found");
                                    const onClick = child?.__VUE__[0]?.vnode?.props?.onClick;
                                    if (onClick) {
                                        log("Got reference to onClick function")
                                        openSettingsInternal = () => {
                                            log("Open settings (internal)");
                                            onClick();
                                        }
                                    }
                                    resolve(child);
                                    return;
                                }
                            }
                        }
                        max--;
                        if (max <= 0) {
                            window.clearInterval(timer);
                            resolve(null);
                        }
                    }, 100);
                });
            }
            function openSettingsLegacy() {
                log("Open settings (legacy)");
                getSettingsButton().then((button) => { button?.click(); });
            }
            function onVueHooked() {
                log("Vue hooked");
                getSettingsButton().then((button) => {
                    clickMenuButton(); // 关闭菜单
                });
            }
            if (window.__VUE_ELEMENTS__) {
                onVueHooked();
            } else {
                window.addEventListener("vue-hooked", onVueHooked, { once: true });
            }
            keyDownWrapper(function (e) {
                const p1 = window.location.hash.slice(2).split("/")[1];
                if (e.key === "Enter") {
                    if (p1 === "message") {
                        const editor = document.querySelector(".qq-editor .ck-content");
                        editor?.focus();
                    }
                } else if (e.key === "," && e.ctrlKey) { // Ctrl + , -> 打开设置
                    (openSettingsInternal || openSettingsLegacy)();
                } else if (e.key === "Tab" && e.ctrlKey) { // Ctrl + Tab -> 聊天与联系人界面切换
                    const current = location.hash;
                    const paths = ["#/main/message", "#/main/contact/"]
                    let idx;
                    for (idx = 0; idx < paths.length; idx++) {
                        if (current.startsWith(paths[idx])) {
                            break;
                        }
                    }
                    if (idx >= 0) {
                        const next = (idx + 1) % paths.length;
                        location.hash = paths[next];
                    } else {
                        log("Unknown path:", current);
                    }
                }
            });
            break;
        }
        case "setting":
            break;
        case "tray-menu":
            keyDownWrapper(function (e) {
                if (e.key === "Escape") {
                    window.close();
                }
            });
            break;
        default:
            break;
    }
    keyDownWrapper(function (e) {
        if (e.key === "F5") {
            location.reload();
        }
    });
    function handleMouseDown(e) {
        log("mouse down", e.button);
        if (e.button === 3 || e.button === 4) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.button === 3) {
                window.history.back();
            } else {
                window.history.forward();
            }
            return false;
        }
    }
    let mouseListening = false;
    function toggleMouseDown(enabled) {
        if (enabled && !mouseListening) {
            document.addEventListener("mousedown", handleMouseDown, { capture: true });
        } else if (!enabled && mouseListening) {
            document.removeEventListener("mousedown", handleMouseDown, { capture: true });
        }
        mouseListening = enabled;
    }
    scriptioWrapper(toggleMouseDown);
})();