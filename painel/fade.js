document.addEventListener('DOMContentLoaded', function () {
    const fadeIns = document.querySelectorAll('.fade-left, .fade-right, .fade-top, .fade-bottom');
    let primeira = true
    async function checkFadeIns() {
        for (fadeIn of fadeIns) {
            if (fadeIn.style.display !== 'none' && isInViewport(fadeIn)) {
                if (fadeIn.classList.contains('fade-in')) {

                } else {
                    fadeIn.classList.add('fade-in');
                }
            } else {
                if (fadeIn.classList.contains('fade-in')) {
                    fadeIn.classList.remove('fade-in');
                }
            }
            if (primeira == true) {
                await new Promise(result => setTimeout(result, 100))
            }
        }
        if (primeira == true) {
            primeira = false
        }
    }

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;


        return (
            rect.top >= -rect.height &&
            rect.left >= -rect.width &&
            rect.bottom <= windowHeight + rect.height &&
            rect.right <= windowWidth + rect.width
        );
    }

    checkFadeIns();

    setInterval(checkFadeIns, 100);
});