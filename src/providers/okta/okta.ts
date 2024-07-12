import icon from './okta.svg';

import type { Provider } from '../providers'

export default {
    key: 'okta',
    name: 'Okta',
    btnTextColor: '#58666e',
    btnBackgroundColor: '#ffffff',
    btnBorderColor: '#00000026',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
