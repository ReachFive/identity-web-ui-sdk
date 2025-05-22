/** The social provider keys. */
export const providerKeys = [
    'facebook',
    'google',
    'apple',
    'linkedin',
    'microsoft',
    'twitter',
    'paypal',
    'amazon',
    'vkontakte',
    'weibo',
    'wechat',
    'qq',
    'line',
    'yandex',
    'mailru',
    'kakaotalk',
    'franceconnect',
    'oney',
    'bconnect',
    'naver',
] as const;
export type ProviderId = (typeof providerKeys)[number];

/**
 * The widget’s initial screen.
 * @enum {('login' | 'login-with-web-authn' | 'signup' | 'forgot-password')}
 */
export type InitialScreen =
    | 'login'
    | 'login-with-web-authn'
    | 'signup'
    | 'signup-with-password'
    | 'signup-with-web-authn'
    | 'forgot-password';
