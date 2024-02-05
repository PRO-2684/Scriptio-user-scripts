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
            keyDownWrapper(function (e) {
                const p1 = window.location.hash.slice(2).split("/")[1];
                if (e.key === "Enter") {
                    if (p1 === "message") {
                        let editor = document.querySelector(".qq-editor .ck-content");
                        if (editor) {
                            editor.focus();
                        }
                    }
                } else if (e.key === "," && e.ctrlKey) { // Ctrl + , -> 打开设置
                    document.querySelector("div.sidebar__menu div.func-menu-more-component div.sidebar-icon")?.click();
                    let max = 10;
                    const timer = window.setInterval(() => {
                        const menu = document.querySelector("div#qContextMenu.more-menu");
                        if (menu && menu.children) {
                            for (const child of menu.children) {
                                if (child.textContent === "设置") {
                                    child.click();
                                    window.clearInterval(timer);
                                    break;
                                }
                            }
                        }
                        max--;
                        if (max <= 0) {
                            window.clearInterval(timer);
                        }
                    }, 100);
                } else if (e.key === "Tab" && e.ctrlKey) { // Ctrl + Tab -> 聊天与联系人界面切换
                    const vue = document.querySelector("#app")?.__vue_app__;
                    if (!vue) {
                        log("VUE not found");
                        return;
                    }
                    const prop = vue.config.globalProperties;
                    const router = prop.$router;
                    const fullPath = prop.$route.fullPath;
                    const paths = ["/main/message", "/main/contact/profile"]
                    const idx = paths.indexOf(fullPath);
                    if (idx >= 0) {
                        const next = (idx + 1) % paths.length;
                        router.push(paths[next]);
                    } else {
                        log("Unknown path:", fullPath);
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
            window.location.reload();
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