import React from 'react';
import styled from 'styled-components';

import { parseQueryString } from '../../helpers/queryString';

import { createForm } from '../../components/form/formComponent';
import { Alternative, Heading, Info, Intro, Link, Separator } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

import {
    PasswordEditorForm,
    PasswordEditorFormData,
} from '../passwordEditor/passwordEditorWidget.tsx';

import { ReactComponent as Passkeys } from '../../icons/passkeys.svg';

import type { OnError, OnSuccess } from '../../types';

interface MainViewProps {
    /**
     * Allow an end-user to create a password instead of a Passkey
     * @default true
     */
    allowCreatePassword?: boolean;
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

const DeviceInputForm = createForm<{}, MainViewProps>({
    prefix: 'r5-credentials-reset',
    fields: [],
    submitLabel: 'accountRecovery.passkeyReset.button',
    supportMultipleSubmits: true,
    resetAfterSuccess: true,
});

const iconStyle = `
        width: 60px;
        height: 60px;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 1em;
        display: block;
`;
const PasskeysIcon = styled(Passkeys)`
    ${iconStyle}
`;

const PasskeysExplanation = styled(() => {
    const i18n = useI18n();
    return (
        <ul>
            <li>
                <b>{i18n('accountRecovery.passkeyReset.subtitle1')}</b>
            </li>
            <ul>
                <li>{i18n('accountRecovery.passkeyReset.legend1')}</li>
            </ul>
            <li>
                <b>{i18n('accountRecovery.passkeyReset.subtitle2')}</b>
            </li>
            <ul>
                <li>{i18n('accountRecovery.passkeyReset.legend2')}</li>
            </ul>
        </ul>
    );
})``;

const NewPasskey = ({
    authentication,
    allowCreatePassword = true,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
}: PropsWithAuthentication<MainViewProps>) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    const handleSubmit = () => {
        return coreClient.resetPasskeys({
            email: authentication?.email,
            verificationCode: authentication?.verificationCode,
            clientId: authentication?.clientId,
        });
    };

    const handleSuccess = () => {
        onSuccess();
        goTo('passkey-success');
    };

    return (
        <div>
            <Heading>{i18n('accountRecovery.passkeyReset.title')}</Heading>
            <PasskeysIcon />
            <Intro>
                <b>{i18n('accountRecovery.passkeyReset.intro')}</b>
            </Intro>
            <PasskeysExplanation />
            <DeviceInputForm handler={handleSubmit} onSuccess={handleSuccess} onError={onError} />
            {allowCreatePassword && (
                <Alternative>
                    <Separator text={i18n('or')} />
                    <Intro>
                        <Link target="new-password">{i18n('accountRecovery.password.title')}</Link>
                    </Intro>
                </Alternative>
            )}
        </div>
    );
};

interface SuccessViewProps {
    loginLink?: string;
}

const PasskeySuccessView = ({ loginLink }: SuccessViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('accountRecovery.passkeyReset.successTitle')}</Heading>
            <Info>{i18n('accountRecovery.passkeyReset.successMessage')}</Info>
            {loginLink && (
                <Info>
                    <Link href={loginLink}>{i18n('accountRecovery.passkeyReset.loginLink')}</Link>
                </Info>
            )}
        </div>
    );
};

const PasswordSuccessView = ({ loginLink }: SuccessViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('passwordReset.successTitle')}</Heading>
            <Info>{i18n('passwordReset.successMessage')}</Info>
            {loginLink && (
                <Info>
                    <Link href={loginLink}>{i18n('passwordReset.loginLink')}</Link>
                </Info>
            )}
        </div>
    );
};

export const NewPasswordView = ({
    authentication,
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
        onSuccess();
        goTo('password-success');
    };

    return (
        <div>
            <Heading>{i18n('accountRecovery.password.title')}</Heading>
            <Info>{i18n('passwordReset.intro')}</Info>
            <PasswordEditorForm
                handler={handleSubmit}
                showLabels={showLabels}
                onSuccess={handleSuccess}
                onError={onError}
            />
            <Alternative>
                <Link target="new-passkey">{i18n('back')}</Link>
            </Alternative>
        </div>
    );
};

const resolveCode = () => {
    const qs = window.location.search.substring(1);
    const { verificationCode, email, clientId } = parseQueryString(qs);
    return { authentication: { verificationCode, email, clientId } as Authentication };
};

type Authentication = { verificationCode: string; email: string; clientId: string };
type PropsWithAuthentication<P> = P & { authentication: Authentication };

export interface AccountRecoveryWidgetProps extends MainViewProps, SuccessViewProps {}

export default createMultiViewWidget<
    AccountRecoveryWidgetProps,
    PropsWithAuthentication<AccountRecoveryWidgetProps>
>({
    initialView: 'new-passkey',
    views: {
        'new-passkey': NewPasskey,
        'new-password': NewPasswordView,
        'passkey-success': PasskeySuccessView,
        'password-success': PasswordSuccessView,
    },
    prepare: options => ({
        ...options,
        ...resolveCode(),
    }),
});
