// ==UserScript==
// @name         Hook Fetch
// @description  Hook `window.fetch`, providing before and after hooks for requests and responses
// @reactive     false
// @version      0.2.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#hook-fetch
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(function () {
    const name = "[Hook Fetch]";
    const debug = false;
    const log = debug ? console.log.bind(console, name) : () => { };
    window._fetch = window.fetch;
    const fetchHooksBefore = []; // (resource, options) => true / [resource, options] / void/null/undefined/false (keep request / modify request / block request)
    const fetchHooksAfter = []; // (response) => true / response (keep response / modify response)
    // Overwrite `window.fetch` method
    window.fetch = function (resource, options) {
        let newResource = resource;
        let newOptions = options;
        log("Fetching", resource, options);
        for (const hook of fetchHooksBefore) {
            try {
                const result = hook(newResource, newOptions);
                if (result === true) { // Keep request
                    continue;
                } else if (result) { // Modify request
                    [newResource, newOptions] = result;
                } else { // Block request
                    log("Blocked", resource, options);
                    return Promise.reject(new TypeError("Failed to fetch"));
                }
            } catch (error) {
                console.error(name, hook, error);
                continue;
            }
        }
        log("Finished applying before hooks", newResource, newOptions);
        return window._fetch(newResource, newOptions).then((response) => {
            try {
                for (const hook of fetchHooksAfter) {
                    const result = hook(response);
                    if (result === true) { // Keep response
                        continue;
                    } else if (result) { // Modify response
                        response = result;
                    }
                }
            } catch (error) {
                console.error(name, hook, error);
            }
            log("Finished applying after hooks", response.url, response);
            return response;
        });
    };
    log("Hooked `window.fetch`");
    scriptio.register("fetchHooksBefore", fetchHooksBefore);
    scriptio.register("fetchHooksAfter", fetchHooksAfter);
    // Examples - log all requests and responses
    // scriptio.wait("fetchHooksBefore").then(
    //     hooks => hooks.push((resource, options) => {
    //         console.log("Fetching", resource);
    //         return true;
    //     })
    // );
    // scriptio.wait("fetchHooksAfter").then(
    //     hooks => hooks.push((response) => {
    //         console.log("Fetched", response.url, response);
    //         return true;
    //     })
    // );
    // Examples - domain-specific blacklist: See privacio.js
})();
