import icon from './wechat.svg';

import type { Provider } from '../providers';

export default {
    key: 'wechat',
    name: 'WeChat',
    color: '#44b549',
    icon,
    windowSize: {
        width: 450,
        height: 400,
    },
} satisfies Provider;
