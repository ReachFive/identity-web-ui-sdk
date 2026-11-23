import type { CaptchaFoxInstance } from '@captchafox/react';
import { describe, expect, jest, test } from '@jest/globals';

import CaptchaFox from '@/components/captchaFox';

function fakeWidget({ response = '', executeToken = 'executed-token' } = {}) {
    return {
        getResponse: jest.fn<CaptchaFoxInstance['getResponse']>().mockReturnValue(response),
        execute: jest.fn<CaptchaFoxInstance['execute']>().mockResolvedValue(executeToken),
        reset: jest.fn<CaptchaFoxInstance['reset']>(),
        remove: jest.fn<CaptchaFoxInstance['remove']>(),
    };
}

/**
 * CA-7339: in `inline` mode the user passes the check by ticking the widget. Running `execute()`
 * on submit starts a second check.
 */
describe('CaptchaFox.handle', () => {
    test('sends the token the widget already holds, without a second check', async () => {
        const widget = fakeWidget({ response: 'inline-token' });
        const callback = jest.fn((data: object) => Promise.resolve(data));

        await CaptchaFox.handle({ email: 'jane@example.com' }, widget, callback);

        expect(widget.execute).not.toBeCalled();
        expect(callback).toBeCalledWith({
            email: 'jane@example.com',
            captchaToken: 'inline-token',
            captchaProvider: 'captchafox',
        });
    });

    test('runs the check when the widget holds no token', async () => {
        const widget = fakeWidget({ response: '', executeToken: 'executed-token' });
        const callback = jest.fn((data: object) => Promise.resolve(data));

        await CaptchaFox.handle({}, widget, callback);

        expect(widget.execute).toBeCalledTimes(1);
        expect(callback).toBeCalledWith(
            expect.objectContaining({ captchaToken: 'executed-token' })
        );
    });

    test('resets the widget once the token is sent, since a token is valid only once', async () => {
        const widget = fakeWidget({ response: 'inline-token' });

        await CaptchaFox.handle({}, widget, () => Promise.resolve());

        expect(widget.reset).toBeCalledTimes(1);
    });

    test('resets the widget and passes the error on when the request fails', async () => {
        const widget = fakeWidget({ response: 'inline-token' });
        const requestError = new Error('signup failed');

        await expect(
            CaptchaFox.handle({}, widget, () => Promise.reject(requestError))
        ).rejects.toBe(requestError);
        expect(widget.reset).toBeCalledTimes(1);
    });

    test('reports a captcha error and sends nothing when the check fails', async () => {
        const widget = fakeWidget();
        widget.execute.mockRejectedValue(new Error('challenge-aborted'));
        const callback = jest.fn(() => Promise.resolve());

        await expect(CaptchaFox.handle({}, widget, callback)).rejects.toMatchObject({
            isUserError: true,
            message: 'CaptchaFox Error',
        });
        expect(callback).not.toBeCalled();
    });
});
