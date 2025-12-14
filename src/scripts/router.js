const BASE_PATH = '';

export const router = (() => {
    const routes = [];

    function add(path, renderFn) {
        const paramNames = [];
        const regexPath = path
            .replace(/:([^/]+)/g, (_, key) => {
                paramNames.push(key);
                return '([^/]+)';
            })
            .replace(/\//g, '\\/');

        const regex = new RegExp(`^${BASE_PATH}${regexPath}$`);
        routes.push({ regex, paramNames, renderFn });
    }

    function match(path) {
        for (const { regex, paramNames, renderFn } of routes) {
            const match = path.match(regex);
            if (match) {
                const params = {};
                paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(match[i + 1]);
                });
                return { renderFn, params };
            }
        }
        return null;
    }

    function navigate(path, push = true) {
        if (!path.startsWith(BASE_PATH)) {
            path = BASE_PATH + (path.startsWith('/') ? '' : '/') + path;
        }

        const [pathname, queryString] = path.split('?');
        const result = match(pathname);

        if (result) {
            if (push) history.pushState({}, '', path);
            result.renderFn(result.params);
            window.dispatchEvent(new CustomEvent('route-changed', { detail: { path } }));
        } else {
            console.warn(`No route found for ${pathname}`);
        }
    }

    function back() {
        history.back();
    }

    function location() {
        return window.location.pathname.replace(BASE_PATH, '') || '/';
    }

    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        navigate(path, false);
    });

    return { add, navigate, back, location };
})();

export async function loadPage(path) {
    try {
        const main = document.getElementById("main");

        main.classList.add("fade-out");

        await new Promise(resolve => setTimeout(resolve, 200));

        const html = await fetch(`/src/pages/${path}.html`).then(r => r.text());
        main.innerHTML = html;

        main.classList.remove("fade-out");
        main.classList.add("fade-in");

        setTimeout(() => {
            main.classList.remove("fade-in");
        }, 200);

    } catch (err) {
        console.error("Page load failed:", err);
    }
}