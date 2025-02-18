import React from 'react';
import styled, { css } from 'styled-components';
import { MFA } from '@reachfive/identity-core'

import { Info } from '../../components/miscComponent';
import { Card } from '../../components/form/cardComponent';
import { createWidget } from '../../components/widget/widget';

import { UserError } from '../../helpers/errors';

import { ReactComponent as Envelope } from '../../icons/envelope.svg'
import { ReactComponent as CommentAltDots } from '../../icons/comment-alt-dots.svg'

import { useI18n } from '../../contexts/i18n';
import { useConfig } from '../../contexts/config';

import type { OnError, OnSuccess } from '../../types';

const iconStyle = css`
    width: ${props => props.theme.fontSize * 2}px;
    height: ${props => props.theme.fontSize * 2}px;
    fill: ${props => props.theme.textColor};
    flex-shrink: 0;
`

const EmailIcon = styled(Envelope)`${iconStyle}`;
const SmsIcon = styled(CommentAltDots)`${iconStyle}`;

const credentialIconByType = (type: MFA.CredentialsResponse['credentials'][number]['type']) => {
    switch (type) {
        case 'email':
            return <EmailIcon />
        case 'sms':
            return <SmsIcon />
    }
}

const Credential = styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${props => props.theme.textColor};
    line-height: 1.5;
`;

const CardContent = styled.div`
    margin-left: ${props => props.theme._blockInnerHeight}px;
    white-space: initial;
`;

const dateFormat = (dateString: string, locales?: Intl.LocalesArgument) => (
    (new Date(dateString)).toLocaleDateString(locales, { timeZone: 'UTC' })
)

export interface MfaListProps {
    credentials: MFA.CredentialsResponse['credentials']
}

export const MfaList = ({ credentials }: MfaListProps) => {
    const i18n = useI18n()
    const config = useConfig()
    return (
        <div>
            {(credentials.length === 0) && (
                <Info>{i18n('mfaList.noCredentials')}</Info>
            )}
            {credentials.map((credential, index) => (
                <Credential key={`credential-${index}`} data-testid="credential">
                    {credentialIconByType(credential.type)}
                    <CardContent>
                        <div style={{fontWeight: 'bold'}}>{credential.friendlyName}</div>
                        <div>{MFA.isEmailCredential(credential) ? credential.email : MFA.isPhoneCredential(credential) ? credential.phoneNumber : 'N/A'}</div>
                        <div>
                            <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                            <time dateTime={credential.createdAt}>{dateFormat(credential.createdAt, config.language)}</time>
                        </div>
                    </CardContent>
                </Credential>
            ))}
        </div>
    );
}

export type MfaListWidgetProps = {
     /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError
}

export default createWidget<MfaListWidgetProps, MfaListProps>({
    component: MfaList,
    prepare: (options, { apiClient }) =>
        apiClient.listMfaCredentials(options.accessToken)
            .then(({ credentials }) => {
                options.onSuccess?.()
                return {
                    ...options,
                    credentials,
                }
            })
            .catch(error => {
                options.onError?.(error)
                throw UserError.fromAppError(error)
            })
});
