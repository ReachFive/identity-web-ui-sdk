import React from 'react'

import { parseQueryString } from '../../helpers/queryString';

import { Heading, Info, Link } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { PasswordEditorForm, PasswordEditorFormData } from '../passwordEditor/passwordEditorWidget';

import type { OnError, OnSuccess } from '../../types'

interface MainViewProps {
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
}

const MainView = ({
    authentication,
    canShowPassword = false,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
    showLabels = false,
}: PropsWithAuthentication<MainViewProps>) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    const handleSubmit = ({ password }: PasswordEditorFormData) => {
        return coreClient.updatePassword({
            password,
            ...authentication,
        });
    };

    const handleSuccess = () => {
        onSuccess({ name: 'password_reset' })
        goTo('success')
    }

    return (
        <div>
            <Heading>{i18n('passwordReset.title')}</Heading>
            <Info>{i18n('passwordReset.intro')}</Info>
            <PasswordEditorForm
                handler={handleSubmit}
                canShowPassword={canShowPassword}
                showLabels={showLabels}
                onSuccess={handleSuccess}
                onError={onError}
            />
        </div>
    );
};

interface SuccessViewProps {
    loginLink?: string;
}

const SuccessView = ({ loginLink }: SuccessViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('passwordReset.successTitle')}</Heading>
            <Info>{i18n('passwordReset.successMessage')}</Info>
            {loginLink && (
                <Info>
                    <Link href={loginLink}>
                        {i18n('passwordReset.loginLink')}
                    </Link>
                </Info>
            )}
        </div>
    );
};

const resolveCode = () => {
    const qs = window.location.search.substring(1);
    const { verificationCode, email } = parseQueryString(qs);
    return { authentication: { verificationCode, email } as Authentication };
};

type Authentication = { verificationCode: string; email: string };
type PropsWithAuthentication<P> = P & { authentication?: Authentication };

export interface PasswordResetWidgetProps
    extends MainViewProps,
        SuccessViewProps {}

export default createMultiViewWidget<
    PasswordResetWidgetProps,
    PropsWithAuthentication<PasswordResetWidgetProps>
>({
    initialView: 'main',
    views: {
        main: MainView,
        success: SuccessView,
    },
    prepare: (options) => ({
        ...options,
        ...resolveCode(),
    }),
});
