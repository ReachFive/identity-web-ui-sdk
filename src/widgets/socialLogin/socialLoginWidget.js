import { deepDefaults } from '../../helpers/deepDefaults';

import { createWidget } from '../../components/widget/widget';
import SocialButtons from '../../components/form/socialButtonsComponent';

export default createWidget({
    name: 'social-login',
    standalone: false,
    component: SocialButtons,
    prepare: (options, { config }) => {
        const baseOpts = deepDefaults(
            options,
            {
                socialProviders: config.socialProviders
            }
        );
        return {
            providers: baseOpts.socialProviders,
            ...baseOpts,
            theme: {
                socialButton: options.theme
            }
        };
    }
});
