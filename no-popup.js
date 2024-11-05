// ==UserScript==
// @name         No Popup
// @description  阻止各类弹窗
// @run-at       notification
// @reactive     true
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#no-popup
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==
(function() {
    'use strict';
    const debug = false;
    if (location.pathname !== "/renderer/lightWindow.html") return;
    if (!location.hash.startsWith("#/notification/")) return;
    const type = location.hash.slice(15);
    console.log("Notification type:", type);
    if (debug) alert("Notification type: " + type);
    // Known types: ad, email
    window.close();
})();
