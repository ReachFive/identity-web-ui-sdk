import icon from './line.svg';

import type { Provider } from '../providers';

export default {
    key: 'line',
    name: 'Line',
    color: '#00c300',
    icon,
    windowSize: {
        width: 440,
        height: 550,
    },
} satisfies Provider;
