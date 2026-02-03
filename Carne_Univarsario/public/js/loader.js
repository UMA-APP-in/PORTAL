(function () {
    // Prevent duplicate injection
    if (window.LoaderInjected) return;
    window.LoaderInjected = true;

    // 1. Inject Lottie Scripts if not present
    if (!document.querySelector('script[src*="dotlottie-wc"]')) {
        const script = document.createElement('script');
        script.type = "module";
        script.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.6.2/dist/dotlottie-wc.js";
        document.head.appendChild(script);
    }
    if (!document.querySelector('script[src*="lottie-player"]')) {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
        document.head.appendChild(script);
    }

    // 2. Inject CSS
    // Adjust path if needed, usually 'css/loader.css' works relative to public root
    if (!document.querySelector('link[href*="loader.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/loader.css';
        document.head.appendChild(link);
    }

    // 3. Inject HTML
    function injectHtml() {
        if (!document.getElementById('global-loader')) {
            const div = document.createElement('div');
            div.id = 'global-loader';
            div.className = 'loading-overlay';
            div.innerHTML = `
                <div class="loading-content">
                    <dotlottie-wc src="https://lottie.host/5a9c4467-dd56-41ee-9a40-6d62dda81d54/ZcE9bNMdwI.lottie"
                                style="width: 200px; height: 200px;" speed="1" autoplay loop></dotlottie-wc>
                    <div class="loading-text" id="loader-text-el">Cargando...</div>
                </div>
            `;
            document.body.appendChild(div);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHtml);
    } else {
        injectHtml();
    }

    // 4. Global API
    window.showLoader = function (text) {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            injectHtml();
            loader = document.getElementById('global-loader');
        }
        if (loader) {
            const txt = document.getElementById('loader-text-el');
            if (txt) txt.textContent = text || 'Cargando...';
            loader.classList.remove('hidden');
            loader.classList.add('active');
            window.__LOADING_ACTIVE__ = true;
        }
    };

    window.hideLoader = function () {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.remove('active');
            window.__LOADING_ACTIVE__ = false;
        }
    };
})();
