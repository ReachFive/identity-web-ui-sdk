import icon from './okta.svg.svg';

import type { Provider } from '../providers'

export default {
    key: 'okta',
    name: 'Okta',
    color: '#4f3d3e',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
