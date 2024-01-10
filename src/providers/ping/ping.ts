import icon from './ping.svg';

import type { Provider } from '../providers'

export default {
    key: 'ping',
    name: 'Ping',
    color: '#c90917',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
