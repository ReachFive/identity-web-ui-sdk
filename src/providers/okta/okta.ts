import icon from './okta.svg';

import type { Provider } from '../providers'

export default {
    key: 'okta',
    name: 'Okta',
    color: '#a4a4a491',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
