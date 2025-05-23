import { darken } from 'polished';
import styled from 'styled-components';

export const CloseIcon = styled.span`
    position: absolute;
    right: ${({ theme }) => theme.paddingY}px;
    top: ${({ theme }) => theme.paddingY}px;
    width: ${({ theme }) => theme._absoluteLineHeight}px;
    height: ${({ theme }) => theme._absoluteLineHeight}px;
    cursor: pointer;
    box-sizing: border-box;
    overflow: hidden;
    &:hover {
        &::before,
        &::after {
            background: ${props => darken(0.2, props.theme.mutedTextColor)};
        }
    }

    &::before,
    &::after {
        content: '';
        position: absolute;
        height: 3px;
        width: 75%;
        top: 50%;
        left: 0;
        margin-top: -1px;
        background: ${props => props.theme.mutedTextColor};
        background-position: center center;
    }
    &::before {
        transform: rotate(45deg);
    }
    &::after {
        transform: rotate(-45deg);
    }
`;

export const Card = styled.div`
    padding: ${({ theme }) => theme.paddingY}px ${({ theme }) => theme._blockInnerHeight}px;
    border: ${({ theme }) => theme.borderWidth}px solid ${({ theme }) => theme.borderColor};
    color: ${({ theme }) => theme.textColor};
    box-sizing: border-box;
    white-space: nowrap;
    vertical-align: middle;
    position: relative;

    &:only-child {
        border-radius: ${({ theme }) => theme.borderRadius}px;
    }

    &:not(:only-child) {
        &:first-child {
            border-radius: ${({ theme }) => theme.borderRadius}px
                ${({ theme }) => theme.borderRadius}px 0 0;
        }

        &:last-child {
            border-radius: 0 0 ${({ theme }) => theme.borderRadius}px
                ${({ theme }) => theme.borderRadius}px;
        }

        &:not(:last-child) {
            border-bottom-width: 0;
        }
    }
`;
