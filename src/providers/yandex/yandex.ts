import icon from './yandex.svg';

import type { Provider } from '../providers'

export default {
    key: 'yandex',
    name: 'Yandex',
    color: '#d43b2f',
    icon,
    windowSize: {
        width: 655,
        height: 700
    }
} satisfies Provider;
