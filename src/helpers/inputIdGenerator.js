import { randomString } from './random';

export default function generateId(key) {
    return process.env.NODE_ENV !== 'test'
        ? randomString({ length: 6, charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' })
        : key;
}
