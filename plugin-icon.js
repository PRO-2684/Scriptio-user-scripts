// * 设置界面展示插件图标
// @run-at setting
(function () {
    const style = document.head.appendChild(document.createElement("style"));
    style.id = "scriptio-plugin-icon";
    style.textContent = "div.setting-tab > div.nav-bar > div.nav-item.liteloader > i.q-icon.icon > img { max-width: 100%; max-height: 100%; }";
    let nameToIcon = {};
    let pluginCount = 0;
    for (const slug in LiteLoader.plugins) {
        const desc = LiteLoader.plugins[slug].manifest;
        const name = desc.name;
        const icon = desc.icon;
        const base = LiteLoader.plugins[slug].path.plugin.replace(":\\", "://").replaceAll("\\", "/");
        const iconUri = `local:///${base}/${icon}`
        if (name && icon) {
            nameToIcon[name] = iconUri;
        }
        pluginCount++;
    }
    function setUp() {
        const navItems = document.querySelectorAll("div.setting-tab > div.nav-bar > div.nav-item.liteloader");
        if (navItems.length < pluginCount) {
            return false;
        }
        navItems.forEach((navItem) => {
            const name = navItem.textContent.trim();
            const icon = navItem.querySelector("i.q-icon.icon");
            const iconUri = nameToIcon[name];
            if (icon && iconUri && !icon.children.length) { // 防止重复添加
                const img = icon.appendChild(document.createElement("img"));
                img.src = iconUri;
            }
        });
        return true;
    }
    let max = 10;
    const timer = window.setInterval(() => {
        if (setUp()) {
            window.clearInterval(timer);
        }
        if (--max <= 0) {
            window.clearInterval(timer);
        }
    }, 100);
})();
