import icon from './facebook.svg';

import type { Provider } from '../providers'

export default {
    key: 'facebook',
    name: 'Facebook',
    color: '#3b5998',
    icon,
    windowSize: {
        width: 650,
        height: 400
    }
} satisfies Provider;
