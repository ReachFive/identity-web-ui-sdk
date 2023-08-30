import styled from 'styled-components';
import { darken } from 'polished';

import { withTheme } from '../../components/widget/widgetContext';

export const CloseIcon = withTheme(styled.span`
    position: absolute;
    right: ${({ theme }) => theme.get('paddingY')}px;
    top: ${({ theme }) => theme.get('paddingY')}px;
    width: ${({ theme }) => theme.get('_absoluteLineHeight')}px;
    height: ${({ theme }) => theme.get('_absoluteLineHeight')}px;
    cursor: pointer;
    box-sizing: border-box;
    overflow: hidden;
    &:hover {
        &::before, &::after {
            background: ${props => darken(0.2, props.theme.get('mutedTextColor'))};
        }
    }

    &::before, &::after {
        content: '';
        position: absolute;
        height: 3px;
        width: 75%;
        top: 50%;
        left: 0;
        margin-top: -1px;
        background: ${props => props.theme.get('mutedTextColor')};
        background-position: center center;
    }
    &::before {
        transform: rotate(45deg);
    }
    &::after {
        transform: rotate(-45deg);
    }
`);

export const Card = withTheme(styled.div`
    padding: ${({ theme }) => theme.get('paddingY')}px ${({ theme }) => theme.get('_blockInnerHeight')}px;
    border: ${({ theme }) => theme.get('borderWidth')}px solid ${({ theme }) => theme.get('borderColor')};
    color: ${({ theme }) => theme.get('textColor')};
    box-sizing: border-box;
    white-space: nowrap;
    vertical-align: middle;
    position: relative;

    &:only-child {
        border-radius: ${({ theme }) => theme.get('borderRadius')}px;
    }

    &:not(:only-child) {
        &:first-child {
            border-radius: ${({ theme }) => theme.get('borderRadius')}px ${({ theme }) => theme.get('borderRadius')}px 0 0;
        }

        &:last-child {
            border-radius: 0 0 ${({ theme }) => theme.get('borderRadius')}px ${({ theme }) => theme.get('borderRadius')}px;
        }

        &:not(:last-child) {
            border-bottom-width: 0;
        }

    }
`);
