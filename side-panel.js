// ==UserScript==
// @name         Side Panel
// @description  侧栏管理：允许隐藏不可隐藏的项目 (重载后失效)
// @run-at       main, chat, record, forward
// @reactive     false
// @version      0.1.0
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const tabConfig = document.getElementById("app")?.__vue_app__?._context?.provides?.store?.state?.sidebar_Nav?.tabConfig;
    const log = console.log.bind(console, "[Side Panel]");
    if (!tabConfig) {
        log("未找到侧栏配置信息");
        return;
    }
    tabConfig.forEach((config, i) => {
        config.isFixed = false;
        // tabConfig[i] = new Proxy(config, {
        //     set: (obj, prop, value) => {
        //         log(`tabConfig[${i}].${prop} = ${value}`);
        //         return Reflect.set(obj, prop, value);
        //     },
        //     get: (obj, prop) => {
        //         log(`tabConfig[${i}].${prop}`);
        //         return Reflect.get(obj, prop);
        //     }
        // });
    });
})();
