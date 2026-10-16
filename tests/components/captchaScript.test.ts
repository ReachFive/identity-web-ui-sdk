import { afterEach, describe, expect, jest, test } from '@jest/globals';

import { importCaptchaScript } from '@/components/captchaScript';

/** Fires the load event on the tag the loader just appended, as the browser would. */
function completeLoad(src: string) {
    const script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    script?.dispatchEvent(new Event('load'));
    // `onload` assigned as a property is not reached by dispatchEvent in every jsdom version.
    script?.onload?.(new Event('load'));
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('importCaptchaScript', () => {
    test('injects the script and resolves once the runtime is ready', async () => {
        const src = 'https://example.test/one.js';
        const whenReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

        const loading = importCaptchaScript({ src, isLoaded: () => false, whenReady });

        expect(document.querySelectorAll(`script[src="${src}"]`)).toHaveLength(1);
        completeLoad(src);
        await loading;

        expect(whenReady).toHaveBeenCalledTimes(1);
    });

    test('loads once per URL, however many widgets ask', async () => {
        const src = 'https://example.test/two.js';
        const whenReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
        const settings = { src, isLoaded: () => false, whenReady };

        const first = importCaptchaScript(settings);
        const second = importCaptchaScript(settings);

        expect(first).toBe(second);
        expect(document.querySelectorAll(`script[src="${src}"]`)).toHaveLength(1);

        completeLoad(src);
        await first;
        expect(whenReady).toHaveBeenCalledTimes(1);
    });

    describe('a tag this module did not inject', () => {
        function existingTag(src: string) {
            const script = document.createElement('script');
            script.src = src;
            document.body.appendChild(script);
        }

        test('resolves straight away when its runtime is already available', async () => {
            const src = 'https://example.test/three.js';
            existingTag(src);

            await importCaptchaScript({
                src,
                isLoaded: () => true,
                whenReady: () => Promise.resolve(),
            });

            expect(document.querySelectorAll(`script[src="${src}"]`)).toHaveLength(1);
        });

        test('waits for it to finish rather than assuming a ready runtime', async () => {
            const src = 'https://example.test/four.js';
            existingTag(src);

            const whenReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
            const loading = importCaptchaScript({ src, isLoaded: () => false, whenReady });

            // Still loading: touching the runtime now would be a TypeError.
            expect(whenReady).not.toHaveBeenCalled();

            completeLoad(src);
            await loading;

            expect(whenReady).toHaveBeenCalledTimes(1);
        });
    });
});

describe('a load that fails', () => {
    test('is retried by a later caller rather than failing forever', async () => {
        const src = 'https://example.test/flaky.js';
        const whenReady = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
        const settings = { src, isLoaded: () => false, whenReady };

        const first = importCaptchaScript(settings);
        document
            .querySelector<HTMLScriptElement>(`script[src="${src}"]`)
            ?.onerror?.(new Event('error'));
        await expect(first).rejects.toThrow();

        // The network hiccup is over; the next submit should get another chance.
        document.body.innerHTML = '';
        const second = importCaptchaScript(settings);
        completeLoad(src);
        await expect(second).resolves.toBeUndefined();
    });
});
