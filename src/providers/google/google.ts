import icon from './google.svg';

import type { Provider } from '../providers';

export default {
    key: 'google',
    name: 'Google',
    color: '#ea4335',
    btnBorderColor: 'rgba(0,0,0,.15)',
    btnTextColor: '#58666e',
    btnBackgroundColor: '#ffffff',
    icon,
    windowSize: {
        width: 560,
        height: 630,
    },
} satisfies Provider;
