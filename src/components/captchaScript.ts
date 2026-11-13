/**
 * Loads a captcha provider's script, once per URL, and resolves when the runtime it defines is
 * ready to be called.
 */
const pending = new Map<string, Promise<void>>();

type ScriptSettings = {
    /** The script to inject. Doubles as the cache key, so a differing site key loads separately. */
    src: string;
    /** Whether the runtime is already available, for a script this module did not inject itself. */
    isLoaded: () => boolean;
    /** The provider's own readiness gate, called once the script has run. */
    whenReady: () => Promise<void>;
};

/** How long a tag this module did not inject is given to finish before the load is given up on. */
const EXISTING_SCRIPT_TIMEOUT_MS = 10_000;

function inject({ src, isLoaded }: ScriptSettings): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

        if (existing) {
            // A <script> with our `src` is already present, its load event may already have fired, another would hang.
            // Settle on whether the runtime is actually there.
            if (isLoaded()) {
                resolve();
            } else {
                // Its events may both be over already, in which case nothing here is ever called.
                const timeout = setTimeout(() => {
                    if (isLoaded()) resolve();
                    else reject(new Error(`Timed out waiting for ${src}`));
                }, EXISTING_SCRIPT_TIMEOUT_MS);

                existing.addEventListener(
                    'load',
                    () => {
                        clearTimeout(timeout);
                        resolve();
                    },
                    { once: true }
                );
                existing.addEventListener(
                    'error',
                    () => {
                        clearTimeout(timeout);
                        reject(new Error(`Failed to load ${src}`));
                    },
                    { once: true }
                );
            }
            return;
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => {
            // A failed tag keeps its `src` and never fires again: left in the page, it would make
            // the next lookup wait for events that are already over.
            script.remove();
            reject(new Error(`Failed to load ${src}`));
        };
        document.body.appendChild(script);
    });
}

export function importCaptchaScript(settings: ScriptSettings): Promise<void> {
    const cached = pending.get(settings.src);
    if (cached) return cached;

    const loaded = inject(settings)
        .then(settings.whenReady)
        .catch((error: unknown) => {
            // Don't keep a failure in the cache.
            pending.delete(settings.src);
            throw error;
        });

    pending.set(settings.src, loaded);
    return loaded;
}
