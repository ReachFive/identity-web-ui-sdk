import icon from './tiktok.svg'

import type { Provider } from '../providers'

export default {
    key: 'tiktok',
    name: 'TikTok',
    color: '#39b6b6',
    icon,
    windowSize: {
        width: 440,
        height: 550
    }
} satisfies Provider;
