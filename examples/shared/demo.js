/* eslint-env browser */
/* global reach5Widgets */

/**
 * Shared harness for the reCAPTCHA Enterprise examples.
 *
 * Every page needs the same three things — somewhere to put the account settings, a widget, and a
 * view of what actually went over the wire — so only the captcha options themselves differ between
 * the demos. Those are supplied by each page through `Demo.start()`.
 */
(function (global) {
    const STORAGE_KEY = 'reachfive-recaptcha-demo';

    const FIELDS = [
        { key: 'clientId', label: 'ReachFive client ID' },
        { key: 'domain', label: 'ReachFive domain (e.g. my-account.reach5.net)' },
        { key: 'siteKey', label: 'reCAPTCHA Enterprise site key' },
    ];

    function readSettings() {
        const stored = (() => {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
            } catch (_) {
                return {};
            }
        })();

        // URL parameters win, so a tester can share a preconfigured link.
        const params = new URLSearchParams(location.search);
        const settings = { ...stored };
        FIELDS.forEach(({ key }) => {
            const value = params.get(key);
            if (value) settings[key] = value;
        });
        return settings;
    }

    function writeSettings(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function log(kind, message, detail) {
        const panel = document.getElementById('log');
        if (!panel) return;

        const entry = document.createElement('div');
        entry.className = 'entry';

        const tag = document.createElement('span');
        tag.className = `tag t-${kind}`;
        tag.textContent = `[${new Date().toLocaleTimeString()}]`;
        entry.appendChild(tag);
        entry.appendChild(document.createTextNode(` ${message}`));

        if (detail !== undefined) {
            const pre = document.createElement('div');
            pre.textContent = typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2);
            pre.style.opacity = '0.75';
            pre.style.paddingLeft = '100px';
            entry.appendChild(pre);
        }

        panel.appendChild(entry);
        panel.scrollTop = panel.scrollHeight;
    }

    /**
     * Reports what the SDK actually sent. The captcha token reaches the API as `captcha_token` in
     * the JSON body on the manual paths; with AutoExecute the reCAPTCHA library instead attaches an
     * `X-Recaptcha-Token` header to the requests it intercepts, and the body carries no token at
     * all. Watching both is the only way to tell the two apart from the browser.
     */
    function instrumentNetwork() {
        const originalFetch = global.fetch.bind(global);

        global.fetch = async function (input, init) {
            const request = new Request(input, init);
            const url = request.url;

            if (url.includes('/identity/') || url.includes('/oauth/')) {
                const headerToken = request.headers.get('X-Recaptcha-Token');
                let body;
                try {
                    body = await request.clone().json();
                } catch (_) {
                    body = undefined;
                }

                const bodyToken = body && body.captcha_token;
                const provider = body && body.captcha_provider;

                log('info', `${request.method} ${new URL(url).pathname}`);

                if (headerToken) {
                    log('ok', 'X-Recaptcha-Token header present', `${headerToken.slice(0, 32)}…`);
                }
                if (bodyToken) {
                    log('ok', 'captcha_token in body', `${String(bodyToken).slice(0, 32)}…`);
                }
                if (provider) {
                    log('ok', 'captcha_provider', provider);
                }
                // Only submissions are expected to carry a token; config reads never do.
                if (!headerToken && !bodyToken && request.method !== 'GET') {
                    log('warn', 'no captcha token on this request');
                }
            }

            const response = await originalFetch(request);

            if (url.includes('/identity/') || url.includes('/oauth/')) {
                const kind = response.ok ? 'ok' : 'err';
                log(kind, `↳ ${response.status} ${response.statusText}`);
                if (!response.ok) {
                    try {
                        log('err', 'error body', await response.clone().json());
                    } catch (_) {
                        /* not JSON — the status alone is the signal */
                    }
                }
            }

            return response;
        };
    }

    function renderSettingsForm(settings, onSubmit) {
        const host = document.getElementById('settings');
        const form = document.createElement('form');

        FIELDS.forEach(({ key, label }) => {
            const wrap = document.createElement('div');
            wrap.className = 'field';

            const lab = document.createElement('label');
            lab.setAttribute('for', key);
            lab.textContent = label;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = key;
            input.name = key;
            input.value = settings[key] || '';
            input.placeholder = key === 'domain' ? 'my-account.reach5.net' : '';

            wrap.append(lab, input);
            form.appendChild(wrap);
        });

        const row = document.createElement('div');
        row.className = 'row';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'Load widget';

        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'secondary';
        clear.textContent = 'Clear log';
        clear.onclick = () => {
            document.getElementById('log').textContent = '';
        };

        row.append(submit, clear);
        form.appendChild(row);

        form.onsubmit = event => {
            event.preventDefault();
            const next = {};
            FIELDS.forEach(({ key }) => {
                next[key] = form.elements[key].value.trim();
            });
            writeSettings(next);
            onSubmit(next);
        };

        host.appendChild(form);
        return form;
    }

    function start({ captchaOptions, describe }) {
        instrumentNetwork();

        const settings = readSettings();

        const boot = current => {
            const missing = FIELDS.filter(({ key }) => !current[key]).map(({ key }) => key);
            if (missing.length) {
                log('warn', `fill in ${missing.join(', ')} to load the widget`);
                return;
            }

            const container = document.getElementById('widget');
            container.innerHTML = '';

            const options = captchaOptions(current);
            log('info', 'widget options', options);
            if (describe) log('info', describe);

            try {
                const client = reach5Widgets.createClient({
                    clientId: current.clientId,
                    domain: current.domain,
                });

                client.showAuth({
                    container: 'widget',
                    auth: { redirectUri: location.href },
                    ...options,
                    onError: error => log('err', 'widget error', error),
                    onSuccess: result => log('ok', 'widget success', result),
                });

                log('ok', 'widget mounted');
            } catch (error) {
                log('err', 'failed to create the client', String(error));
            }
        };

        const form = renderSettingsForm(settings, boot);

        // Only boot unprompted when the page already has everything it needs.
        if (FIELDS.every(({ key }) => settings[key])) {
            boot(settings);
        } else {
            log('info', 'enter your account settings above, then press “Load widget”');
        }

        return { form, log };
    }

    global.Demo = { start, log };
})(window);
