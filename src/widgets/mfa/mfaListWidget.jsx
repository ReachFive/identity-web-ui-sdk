import React from 'react';
import compose from '@hypnosphi/recompose/compose';

import { Info } from '../../components/miscComponent';
import { Card } from '../../components/form/cardComponent';
import { createWidget } from "../../components/widget/widget";
import {withConfig, withI18n, withTheme} from '../../components/widget/widgetContext'
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

const dateFormat = (dateString, locales) => (
    (new Date(dateString)).toLocaleDateString(locales, { timeZone: 'UTC' })
)

export const MfaList = compose(withI18n, withConfig)((({ credentials, i18n, config }) => (
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
                    <div>
                        <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                        <time dateTime={createdAt}>{dateFormat(createdAt, config.language)}</time>
                    </div>
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
