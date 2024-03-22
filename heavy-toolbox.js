// * 🧰 Ctrl + D 来体验重量工具箱
(function () {
    const G = 0.98;
    const INTERVAL = 50;
    function drop() {
        const dist = window.screen.availHeight - (window.screenTop + window.outerHeight);
        // Simulate gravity
        let t = 0;
        let dy, moved;
        const timer = window.setInterval(() => {
            t++;
            dy = G * (2 * t - 1) / 2;
            moved = G * t * t / 2;
            window.moveBy(0, dy);
            if (moved >= dist) {
                window.clearInterval(timer);
                console.log('Dropped');
            }
        }, INTERVAL);
    }
    window.drop = drop; // You can call drop() in the console
    document.addEventListener('keyup', (e) => {
        if (e.key === 'd' && e.ctrlKey) {
            drop();
        }
    });
})();
