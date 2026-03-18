import React, { ComponentType } from 'react';

import { convert } from 'colorizr';
import styled, { css, StyleSheetManager, ThemeProvider } from 'styled-components';

import type { Client as CoreClient, SessionInfo } from '@reachfive/identity-core';

import { ConfigProvider } from '../../contexts/config';
import { I18nProvider, type I18nMessages } from '../../contexts/i18n';
import { ReachfiveProvider } from '../../contexts/reachfive';
import { RoutingProvider } from '../../contexts/routing';
import { SessionProvider } from '../../contexts/session';
import { buildTheme } from '../../core/theme';
import { Theme, ThemeOptions } from '../../types/styled';
import WidgetContainer, { WidgetContainerProps } from './widgetContainerComponent';

import type { Config, Prettify } from '../../types';

export type I18nProps = { i18n?: I18nMessages };
export type ThemeProps = { theme?: ThemeOptions };

export type PropsWithI18n<P> = Prettify<P & I18nProps>;
export type PropsWithTheme<P> = Prettify<P & ThemeProps>;

function colorToHSL(color: string) {
    return convert(color, 'hsl').replace('hsl(', '').replace(')', '');
}

export const themeVariables = css`
    --primary: ${props => colorToHSL(props.theme.primaryColor)};
    --primary-foreground: ${_ => colorToHSL('#ffffff')};
    --destructive: ${props => colorToHSL(props.theme.dangerColor)};
    --destructive-foreground: ${_ => colorToHSL('#ffffff')};
    --popover: ${props => colorToHSL(props.theme.backgroundColor)};
    --popover-foreground: ${props => colorToHSL(props.theme.textColor)};
    --background: ${props => colorToHSL(props.theme.backgroundColor)};
    --border: ${props => colorToHSL(props.theme.borderColor)};
    --text: ${props => colorToHSL(props.theme.textColor)};
    --accent: ${props => colorToHSL(props.theme.primaryColor)};
    --muted: ${props => colorToHSL(props.theme.mutedTextColor)};
    --input: ${props => colorToHSL(props.theme.input.borderColor)};
    --ring: ${props => colorToHSL(props.theme.input.focusBorderColor)};

    --spacing-padding-y: ${props => props.theme.paddingY}px;
    --spacing-padding-x: ${props => props.theme.paddingX}px;
    --spacing: ${props => props.theme.spacing}px;

    --font-size: ${props => props.theme.fontSize}px;
    --leading: ${props => props.theme.lineHeight};

    --border-width: ${props => props.theme.borderWidth};
    --radius: ${props => props.theme.borderRadius}px;

    --button-border: ${props => props.theme.button.borderColor};
    --button-border-width: ${props => props.theme.button.borderWidth};
    --button-height: ${props => props.theme.button.height}px;
    --button-leading: ${props => props.theme.button.lineHeight};
    --button-padding-x: ${props => props.theme.button.paddingX}px;
    --button-padding-y: ${props => props.theme.button.paddingY}px;
    --button-radius: ${props => props.theme.button.borderRadius}px;
    --button-text-size: ${props => props.theme.button.fontSize}px;

    --input-background: ${props => props.theme.input.background};
    --input-border: ${props => props.theme.input.borderColor};
    --input-border-width: ${props => props.theme.input.borderWidth};
    --input-disabled-background: ${props => props.theme.input.disabledBackground};
    --input-height: ${props => props.theme.input.height}px;
    --input-leading: ${props => props.theme.input.lineHeight};
    --input-padding-x: ${props => props.theme.input.paddingX}px;
    --input-padding-y: ${props => props.theme.input.paddingY}px;
    --input-placeholder: ${props => props.theme.input.placeholderColor};
    --input-radius: ${props => props.theme.input.borderRadius}px;
    --input-shadow: ${props => props.theme.input.boxShadow};
    --input-text-color: ${props => props.theme.input.color};
    --input-text-size: ${props => props.theme.input.fontSize}px;
`;

export const ThemeVariablesContainer = styled.div`
    ${themeVariables}
`;

export const WidgetContainerThemeVariables = styled(WidgetContainer)`
    ${themeVariables}
`;

export type Context = {
    config: Config;
    apiClient: CoreClient;
    defaultI18n: I18nMessages;
    session?: SessionInfo;
};

type PrepareFn<P, U> = (
    options: PropsWithI18n<PropsWithTheme<P>>,
    context: Context
) => PropsWithI18n<PropsWithTheme<U>> | PromiseLike<PropsWithI18n<PropsWithTheme<U>>>;

type CreateWidget<P, U> = {
    component: ComponentType<Omit<U, 'theme'>>;
    prepare?: PrepareFn<P, U>;
} & WidgetContainerProps;

export function createWidget<P, U = P>({
    component,
    prepare = (options: PropsWithI18n<PropsWithTheme<P>>) =>
        options as unknown as PropsWithI18n<PropsWithTheme<U>>,
    ...widgetAttrs
}: CreateWidget<P, U>) {
    return (options: PropsWithTheme<PropsWithI18n<P>>, context: Context) => {
        return Promise.resolve(prepare(options, context)).then(
            ({ theme: customTheme, ...preparedOptions }) => {
                const Component = component;

                const theme: Theme = buildTheme(customTheme);

                return (
                    <ConfigProvider config={context.config}>
                        <ReachfiveProvider client={context.apiClient}>
                            <SessionProvider session={context.session}>
                                <StyleSheetManager>
                                    <ThemeProvider theme={theme}>
                                        <I18nProvider
                                            defaultMessages={context.defaultI18n}
                                            messages={preparedOptions.i18n}
                                            locale={context.config.language}
                                        >
                                            <WidgetContainerThemeVariables
                                                {...widgetAttrs}
                                                className="r5-widget"
                                            >
                                                <Component {...preparedOptions} />
                                            </WidgetContainerThemeVariables>
                                        </I18nProvider>
                                    </ThemeProvider>
                                </StyleSheetManager>
                            </SessionProvider>
                        </ReachfiveProvider>
                    </ConfigProvider>
                );
            }
        );
    };
}

export interface CreateMultiViewWidgetProps<P, U> extends MultiViewWidgetProps<P, U> {}

export function createMultiViewWidget<P, U = P>({
    prepare,
    ...params
}: MultiViewWidgetProps<P, U>) {
    return createWidget<P, U>({
        component: multiViewWidget<P, U>(params),
        prepare,
        noIntro: true,
    });
}

export interface MultiViewWidgetProps<P, U> {
    initialView: ((props: Omit<U, 'theme'>) => string) | string;
    views: Record<string, ComponentType<Omit<U, 'theme'>>>;
    initialState?: MultiWidgetState;
    prepare?: PrepareFn<P, U>;
}

export type MultiWidgetState = Record<string, unknown> & {
    activeView: string;
};

function multiViewWidget<P, U>({
    initialView,
    views,
    initialState = {} as MultiWidgetState,
}: MultiViewWidgetProps<P, U>) {
    return class MultiViewWidget extends React.Component<Omit<U, 'theme'>, MultiWidgetState> {
        state = {
            ...initialState,
            activeView: typeof initialView === 'function' ? initialView(this.props) : initialView,
        };

        // _goTo = <View extends keyof typeof views, S extends ComponentProps<(typeof views)[View]>>(view: View, props?: S) => this.setState({
        _goTo = <S extends Record<string, unknown>>(view: keyof typeof views, params?: S) =>
            this.setState({
                activeView: view,
                ...params,
            });

        render() {
            const { activeView, ...state } = this.state;
            const ActiveComponent = views[activeView];

            return (
                <RoutingProvider goTo={this._goTo} params={state}>
                    <ActiveComponent {...this.props} />
                </RoutingProvider>
            );
        }
    };
}
