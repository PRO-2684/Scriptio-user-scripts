// * Hook `window.fetch`

(function () {
    const name = "[Hook Fetch]";
    const debug = false;
    const log = debug ? console.log.bind(console, name) : () => { };
    window._fetch = window.fetch;
    window.__FETCH_HOOKS_BEFORE__ = []; // (resource, options) => true / [resource, options] / void/null/undefined/false (keep request / modify request / block request)
    window.__FETCH_HOOKS_AFTER__ = []; // (response) => true / response (keep response / modify response)
    // Overwrite `window.fetch` method
    window.fetch = function (resource, options) {
        let newResource = resource;
        let newOptions = options;
        log("Fetching", resource, options);
        for (const hook of window.__FETCH_HOOKS_BEFORE__) {
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
                for (const hook of window.__FETCH_HOOKS_AFTER__) {
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
    window.dispatchEvent(new CustomEvent("fetch-hooked"));
    // Examples - log all requests and responses
    // window.__FETCH_HOOKS_BEFORE__.push((resource, options) => {
    //     console.log("Fetching", resource);
    //     return true;
    // });
    // window.__FETCH_HOOKS_AFTER__.push((response) => {
    //     console.log("Fetched", response.url, response);
    //     return true;
    // });
    // Examples - domain-specific blacklist: See privacio.js
})();
