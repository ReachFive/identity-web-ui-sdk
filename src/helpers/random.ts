export function randomString({
    length = 8,
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
} = {}) {
    return Array.from({ length }, (_, index) => index)
        .map(() => charset.charAt(Math.floor(Math.random() * charset.length)))
        .join('');
}
