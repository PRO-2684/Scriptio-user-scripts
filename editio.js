// ==UserScript==
// @name         Editio
// @description  给编辑器添加一些额外的功能
// @run-at       main, chat
// @reactive     true
// @version      0.1.0
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#editor-plus
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(async function () {
    const log = console.log.bind(console, "[Editio]");
    // Use timer & Promise to wait for the editor to be ready
    const editorPromise = new Promise((resolve) => {
        const timer = setInterval(() => {
            const editorElement = document.querySelector(".ck.ck-content.ck-editor__editable");
            const editor = editorElement?.ckeditorInstance;
            if (editor) {
                log("Editor is ready");
                clearInterval(timer);
                resolve([editorElement, editor]);
            } else {
                log("Waiting for the editor...");
            }
        }, 500);
    });
    const [editorElement, editor] = await editorPromise;
    window.editor = editor;

    // Paring brackets and quotes
    /**
     * Pairs of characters we should consider.
     * @type {Record<string, string>}
     */
    const pairs = {
        "(": ")",
        "[": "]",
        "{": "}",
        "<": ">",
        '"': '"',
        "'": "'",
        "`": "`",
    };
    /**
     * Handle the InputEvent of type "insertText", so as to auto close brackets and quotes
     * @param {InputEvent} e The InputEvent.
     */
    function onInsertText(e) {
        const other = pairs[e.data];
        if (other) {
            e.preventDefault();
            e.stopImmediatePropagation();
            editor.model.change(writer => {
                for (const range of editor.model.document.selection.getRanges()) {
                    const { start, end } = range;
                    if (start.isEqual(end)) { // No selection
                        writer.insertText(e.data + other, start);
                        writer.setSelection(writer.createRange(start.getShiftedBy(1))); // Move cursor inside the brackets
                    } else {
                        writer.insertText(e.data, start);
                        writer.insertText(other, end.getShiftedBy(1));
                    }
                }
            });
        }
    }
    /**
     * Handle the InputEvent of type "deleteContentBackward", so as to auto delete the adjacent right bracket or quote
     * @param {InputEvent} e The InputEvent.
     */
    function onBackspace(e) {
        for (const range of editor.model.document.selection.getRanges()) {
            const { start, end } = range;
            if (start.isEqual(end) && !start.isAtStart && !start.isAtEnd) { // No selection and not on the edges
                const text = start.textNode?.data;
                if (!text) continue; // No text node
                const charBefore = text.charAt(start.offset - 1);
                const charAfter = text.charAt(start.offset);
                if (pairs[charBefore] === charAfter) { // The cursor is between a pair of brackets or quotes
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    editor.model.change(writer => {
                        writer.remove(writer.createRange(start.getShiftedBy(-1), end.getShiftedBy(1)));
                    });
                }
            }
        }
    }
    /**
     * Handlers for different types of InputEvent.
     * @type {Record<string, (e: InputEvent) => void>}
     */
    const inputHandlers = {
        "insertText": onInsertText,
        "deleteContentBackward": onBackspace,
    }
    /**
     * Handle the InputEvent.
     * @param {InputEvent} e The InputEvent.
     */
    function onInput(e) {
        if (e.isComposing) return;
        const handler = inputHandlers[e.inputType];
        if (handler) handler(e);
    }
    editorElement.addEventListener("beforeinput", onInput, { capture: true });

    log("Initialized");
})();
