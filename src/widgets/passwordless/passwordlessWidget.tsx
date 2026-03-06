import React, { ComponentProps } from 'react';

import { Info } from '@/components/miscComponent';
import { createMultiViewWidget } from '@/components/widget/widget';
import { useI18n } from '@/contexts/i18n';

import { PasswordlessView } from './passwordlessView';
import { VerificationCodeView } from './verificationCodeView';

import type { Prettify } from '@/types';

const EmailSentView = () => {
    const i18n = useI18n();
    return <Info>{i18n('passwordless.emailSent')}</Info>;
};

export type PasswordlessWidgetProps = Prettify<
    ComponentProps<typeof PasswordlessView> & ComponentProps<typeof VerificationCodeView>
>;

export default createMultiViewWidget<PasswordlessWidgetProps>({
    initialView: 'main',
    views: {
        main: PasswordlessView,
        emailSent: EmailSentView,
        verificationCode: VerificationCodeView,
    },
    prepare: (options, { config }) => ({
        socialProviders: config.socialProviders,
        ...options,
    }),
});
