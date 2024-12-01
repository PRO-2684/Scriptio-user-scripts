// ==UserScript==
// @name         Editio
// @description  给编辑器添加一些额外的功能
// @run-at       main, chat
// @reactive     true
// @version      0.1.3
// @homepageURL  https://github.com/PRO-2684/Scriptio-user-scripts/#editor-plus
// @author       PRO_2684
// @license      gpl-3.0
// ==/UserScript==

(async function () {
    const debug = false;
    const log = debug ? console.log.bind(console, "[Editio]") : () => { };
    const { scriptPath } = scriptio;
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
    if (debug) window.editor = editor; // Expose the editor to the global scope for debugging

    // Pairing
    // Input-related
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
     * Reverse pairs of characters.
     * @type {Record<string, string>}
     */
    const reversePairs = {};
    for (const [left, right] of Object.entries(pairs)) {
        reversePairs[right] = left;
    }
    /**
     * Handle the InputEvent of type "insertText", so as to auto close brackets and quotes
     * @param {InputEvent} e The InputEvent.
     */
    function onInsertText(e) {
        if (e.data in pairs) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const other = pairs[e.data];
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
            })
        } else if (e.data in reversePairs) {
            editor.model.change(writer => {
                let shouldPrevent = false;
                for (const range of editor.model.document.selection.getRanges()) {
                    const { start, end } = range;
                    if (start.isEqual(end)) { // No selection
                        const text = start.textNode?.data;
                        if (!text) continue; // No text node
                        const charBefore = text.charAt(start.offset - 1);
                        const charAfter = text.charAt(start.offset);
                        if (charBefore === reversePairs[e.data] && charAfter === e.data) { // The cursor is between a pair of brackets or quotes
                            writer.setSelection(writer.createRange(start.getShiftedBy(1))); // Move cursor outside (over-write) the brackets
                            shouldPrevent = true;
                        }
                    }
                }
                if (shouldPrevent) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
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
    // Jumping
    /**
     * Find the other character's index in the given text.
     * @param {string} text The text to search in.
     * @param {number} pos The position of the character.
     * @returns {number | null} The position of the other character in the pair, or null if not found.
     */
    function findOtherIndex(text, pos) {
        const char = text.charAt(pos);
        const [isPair, isReversePair] = [char in pairs, char in reversePairs];
        if (isPair === isReversePair) return null; // Either not a pair or with the same opening and closing characters
        const other = isPair ? pairs[char] : reversePairs[char];
        const direction = isPair ? 1 : -1; // Searches forwards for the closing character, or backwards for the opening character
        let count = 0;
        for (let i = pos + direction; i >= 0 && i < text.length; i += direction) {
            if (text.charAt(i) === char) {
                count++;
            } else if (text.charAt(i) === other) {
                if (count === 0) return i;
                count--;
            }
        }
        return null;
    }
    /**
     * Handle shortcuts for jumping between paired brackets.
     * @param {KeyboardEvent} e The KeyboardEvent.
     * @returns {boolean} Whether the event is handled.
     */
    function jumpingHandler(e) {
        // Ctrl + Q
        if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.key !== "q") return;
        // Only consider the first range
        const range = editor.model.document.selection.getFirstRange();
        if (!range) return;
        const { start, end } = range;
        const diff = Math.abs(end.offset - start.offset);
        if (start.textNode !== end.textNode || diff > 1) return; // Only handle the scenario where one or none character is selected and the cursor is inside the element
        const text = start.textNode?.data;
        if (!text) return; // No text node
        const otherIndex = findOtherIndex(text, Math.min(start.offset, end.offset)) // Try pairing the character selected or the one after the cursor
            ?? (diff ? null : findOtherIndex(text, start.offset - 1)); // If not found, try the character before the cursor
        if (otherIndex !== null) {
            e.preventDefault();
            e.stopImmediatePropagation();
            editor.model.change(writer => {
                writer.setSelection(writer.createRange(
                    start.getShiftedBy(otherIndex - start.offset),
                    start.getShiftedBy(otherIndex - start.offset + 1)
                ));
            });
            return true;
        }
        return false;
    }

    // Tabulator
    const tabOutChars = new Set("()[]{}<>\"'`,:;.");
    /**
     * Find the character as the destination of the tab out action.
     * @param {string} text The text to search in.
     * @param {number} pos The position of the cursor.
     * @param {number} direction The direction to search in.
     * @returns {number} The position of the character to tab out of, or -1 if not found.
     */
    function findNextPos(text, pos, direction) {
        // A position is valid if and only if the character at that position OR BEFORE that position is in the tabOutChars
        for (let i = pos + direction; i >= 0 && i <= text.length; i += direction) { // `i <= text.length` is intentional, so as to handle the scenario where the cursor should be moved to the end of the text
            if (tabOutChars.has(text.charAt(i)) || tabOutChars.has(text.charAt(i - 1))) return i;
        }
        return -1;
    }
    /**
     * Handle the tab out action.
     * @param {KeyboardEvent} e The KeyboardEvent.
     * @returns {boolean} Whether the event is handled.
     */
    function tabOutHandler(e) {
        if (e.ctrlKey || e.altKey || e.metaKey || e.key !== "Tab") return;
        // Only consider the first range
        const range = editor.model.document.selection.getFirstRange();
        if (!range) return;
        const { start, end } = range;
        if (!start.isEqual(end)) return; // Only handle the scenario where no character is selected
        const direction = e.shiftKey ? -1 : 1;
        const text = start.textNode?.data;
        if (!text) return; // No text node
        const nextPos = findNextPos(text, start.offset, direction);
        if (nextPos !== -1) {
            e.preventDefault();
            e.stopImmediatePropagation();
            editor.model.change(writer => {
                writer.setSelection(writer.createRange(start.getShiftedBy(nextPos - start.offset)));
            });
            return true;
        }
        return false;
    }
    /**
     * Handle the KeyboardEvent.
     * @param {KeyboardEvent} e The KeyboardEvent.
     */
    function onKeydown(e) {
        jumpingHandler(e) || tabOutHandler(e); // Only handle once at most
    }

    // Reactivity
    let isEnabled = false;
    /**
     * Toggle Editio.
     * @param {boolean} enabled Whether to enable Editio.
     */
    function toggle(enabled) {
        if (enabled && !isEnabled) {
            log("Enabled");
            editorElement.addEventListener("beforeinput", onInput, { capture: true, passive: false });
            editorElement.addEventListener("keydown", onKeydown, { capture: true, passive: false });
        } else if (!enabled && isEnabled) {
            log("Disabled");
            editorElement.removeEventListener("beforeinput", onInput, { capture: true, passive: false });
            editorElement.removeEventListener("keydown", onKeydown, { capture: true, passive: false });
        }
        isEnabled = enabled;
    }
    scriptio.listen(toggle, { immediate: true, scriptPath });

    log("Initialized");
})();
