import icon from './tiktok.svg';

import type { Provider } from '../providers';

export default {
    key: 'tiktok',
    name: 'TikTok',
    color: '#000',
    icon,
    windowSize: {
        width: 440,
        height: 550,
    },
} satisfies Provider;
