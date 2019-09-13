import range from 'lodash-es/range';

export function randomString({ length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' } = {}) {
    return range(0, length).map(() => charset.charAt(Math.floor(Math.random() * charset.length))).join('');
}
