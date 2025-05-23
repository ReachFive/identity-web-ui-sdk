import icon from './mailru.svg';

import type { Provider } from '../providers';

export default {
    key: 'mailru',
    name: 'Mail.ru',
    color: '#4988c3',
    icon,
    windowSize: {
        width: 450,
        height: 400,
    },
} satisfies Provider;
