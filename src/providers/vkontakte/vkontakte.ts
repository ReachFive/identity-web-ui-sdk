import icon from './vkontakte.svg';

import type { Provider } from '../providers';

export default {
    key: 'vkontakte',
    fontKey: 'vk',
    name: 'VKontakte',
    color: '#45668e',
    icon,
    windowSize: {
        width: 655,
        height: 430,
    },
} satisfies Provider;
