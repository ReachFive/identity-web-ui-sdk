import icon from './twitter.svg';

import type { Provider } from '../providers'

export default {
    key: 'twitter',
    name: 'Twitter',
    color: '#55acee',
    icon,
    windowSize: {
        width: 800,
        height: 440
    }
} satisfies Provider;
