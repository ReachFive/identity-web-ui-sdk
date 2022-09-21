import React from 'react';
import { Info } from '../../components/miscComponent';
import { Card } from '../../components/form/cardComponent';
import { createWidget } from "../../components/widget/widget";
import { withI18n, withTheme } from '../../components/widget/widgetContext'
import styled from "styled-components";

import { ReactComponent as Envelope } from '../../icons/envelope.svg'
import { ReactComponent as CommentAltDots } from '../../icons/comment-alt-dots.svg'

const iconStyle = props => `
    width: ${props.theme.get('fontSize') * 2}px;
    height: ${props.theme.get('fontSize') * 2}px;
    fill: ${props.theme.get('textColor')};
    flex-shrink: 0;
`

const EmailIcon = withTheme(styled(Envelope)`${props => iconStyle(props)}`);
const SmsIcon = withTheme(styled(CommentAltDots)`${props => iconStyle(props)}`);

const credentialIconByType = type => {
    switch (type) {
        case 'email':
            return <EmailIcon />
        case 'sms':
            return <SmsIcon />
    }
}

const Credential = withTheme(styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${props => props.theme.get('textColor')};
    line-height: 1.5;
`);

const CardContent = withTheme(styled.div`
    margin-left: ${props => props.theme.get('_blockInnerHeight')}px;
    white-space: initial;
`);

export const MfaList = withI18n((({ credentials, i18n }) => (
    <div>
        {(credentials.length === 0) && (
            <Info>{i18n('mfaList.noCredentials')}</Info>
        )}
        {credentials.map(({type, createdAt, friendlyName, email, phoneNumber}, index) => (
            <Credential key={`credential-${index}`}>
                {credentialIconByType(type)}
                <CardContent>
                    <div style={{fontWeight: 'bold'}}>{friendlyName}</div>
                    <div>{email || phoneNumber}</div>
                    <div>{i18n('mfaList.createdAt')}&nbsp;: <time dateTime={createdAt}>{(new Date(createdAt)).toLocaleDateString()}</time></div>
                </CardContent>
            </Credential>
        ))}
    </div>
)));

export default createWidget({
    component: MfaList,
    prepare: (options, { apiClient }) => {
        return apiClient.listMfaCredentials(options.accessToken).then(credentials => ({
            ...options,
            ...credentials,
        }))
    }
});
