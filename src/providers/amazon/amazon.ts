import icon from './amazon.svg';

import type { Provider } from '../providers';

export default {
    key: 'amazon',
    name: 'Amazon',
    color: '#ff9900',
    icon,
    windowSize: {
        width: 715,
        height: 525,
    },
} satisfies Provider;
