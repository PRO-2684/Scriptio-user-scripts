// 添加一些常用的快捷键
(function () {
    // const data = {
    //     "$shortcuts": {
    //         "F5": () => { window.location.reload(); },
    //     },
    //     "tray-menu": {
    //         "$shortcuts": {
    //             "Escape": () => { window.close(); },
    //         }
    //     },
    //     "main": {
    //         "$shortcuts": {},
    //         "message": {
    //             "$shortcuts": {
    //                 "Enter": () => {
    //                     let editor = document.querySelector(".qq-editor .ck-content");
    //                     if (editor) {
    //                         editor.focus();
    //                     }
    //                 },
    //             }
    //         },
    //         "contact": {
    //             "$shortcuts": {},
    //             "profile": {
    //                 "$shortcuts": {}
    //             },
    //             "notify": {
    //                 "$shortcuts": {}
    //             }
    //         },
    //     },
    //     "setting": {
    //         "$shortcuts": {},
    //         "settings": {
    //             "$shortcuts": {},
    //             // ...
    //         }
    //     }
    // };
    function wrapper(f) {
        document.addEventListener("keydown", function (e) {
            // 输入状态不触发
            if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA"
                || document.activeElement.getAttribute("contenteditable") === "true") {
                return;
            }
            // 输入法下不触发
            if (e.isComposing || e.keyCode === 229) {
                return;
            }
            f(e);
        });
    }
    const page = window.location.hash.slice(2).split("/")[0];
    switch (page) {
        case "main": {
            wrapper(function (e) {
                const p1 = window.location.hash.slice(2).split("/")[1];
                if (e.key === "Enter") {
                    if (p1 === "message") {
                        let editor = document.querySelector(".qq-editor .ck-content");
                        if (editor) {
                            editor.focus();
                        }
                    }
                }
            });
            break;
        }
        case "setting":
            break;
        case "tray-menu":
        case "":
            wrapper(function (e) {
                if (e.key === "Escape") {
                    window.close();
                }
            });
            break;
        default:
            break;
    }
    wrapper(function (e) {
        if (e.key === "F5") {
            window.location.reload();
        }
    });
})();