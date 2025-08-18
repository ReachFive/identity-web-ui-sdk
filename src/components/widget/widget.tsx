import { useSuspenseQuery } from '@tanstack/react-query';
import React, { type ComponentType } from 'react';
import styled, { StyleSheetManager, ThemeProvider, css } from 'styled-components';

import type { I18nNestedMessages } from '../../core/i18n';
import { buildTheme } from '../../core/theme';
import type { Prettify } from '../../types';
import { Theme, ThemeOptions } from '../../types/styled';

import { I18nProvider } from '../../contexts/i18n';
import { useReachfive, type ReachfiveContext } from '../../contexts/reachfive';
import { RoutingProvider } from '../../contexts/routing';
import { PropsWithSession, useSession } from '../../contexts/session';

import WidgetContainer, { WidgetContainerProps } from './widgetContainerComponent';

export type I18nProps = { i18n?: I18nNestedMessages };
export type ThemeProps = { theme?: ThemeOptions };

export type PropsWithI18n<P> = Prettify<P & I18nProps>;
export type PropsWithTheme<P> = Prettify<P & ThemeProps>;

export const themeVariables = css`
    --color-primary: ${props => props.theme.primaryColor};
    --color-destructive: ${props => props.theme.dangerColor};
    --color-background: ${props => props.theme.backgroundColor};
    --color-text: ${props => props.theme.textColor};
    --color-border: ${props => props.theme.borderColor};

    --spacing-padding-y: ${props => props.theme.paddingY};
    --spacing-padding-x: ${props => props.theme.paddingX};
    --spacing-block-inner-height: ${props => props.theme._blockInnerHeight};
    --spacing: ${props => props.theme.spacing};

    --font-generic: ${props => props.theme.fontSize};

    --border-width: ${props => props.theme.borderWidth};
    --radius: ${props => props.theme.borderRadius};
`;

export const ThemeVariablesContainer = styled.div`
    ${themeVariables}
`;

export const WidgetContainerThemeVariables = styled(WidgetContainer)`
    ${themeVariables}
`;

type PrepareFn<P, U> = (
    options: PropsWithI18n<PropsWithTheme<P>>,
    context: PropsWithSession<ReachfiveContext>
) => PropsWithI18n<PropsWithTheme<U>> | Promise<PropsWithI18n<PropsWithTheme<U>>>;

type CreateWidget<P, U> = {
    component: ComponentType<U>;
    prepare?: PrepareFn<P, U>;
} & WidgetContainerProps;

/**
 * Create Widget component.
 * @param {object} widget - Widget configuration
 * @example
 * type WidgetProps = { username: string }
 * type ComponentProps = { greeting: string }
 * const Greeting = createWidget<WidgetProps, ComponentProps>({
 *     component: ({ greeting }: ComponentProps) => <p>{greeting}</p>,
 *     prepare: ({ username }: WidgetProps) => Promise.resolve({ greeting: `Hello ${username}!` })
 * })
 * const root = createRoot(document.getElementById("root")!)
 * root.render(<Greeting username="Alice" />);
 */
export function createWidget<P extends {}, U extends {} = P>({
    component,
    prepare,
    ...widgetAttrs
}: CreateWidget<P, U>) {
    return function Widget(options: PropsWithTheme<PropsWithI18n<P>>) {
        const context = useReachfive();
        const session = useSession();

        const resolve = async () => {
            if (prepare) {
                return await Promise.resolve(prepare(options, { ...context, session }));
            } else {
                return options as unknown as PropsWithTheme<PropsWithI18n<U>>;
            }
        };

        const { data: resolved } = useSuspenseQuery({
            queryFn: resolve,
            queryKey: ['prepare'],
        });

        const { theme: customTheme, i18n, ...props } = resolved;

        const Component = component;
        const theme: Theme = buildTheme(customTheme);
        return (
            <StyleSheetManager>
                <ThemeProvider theme={theme}>
                    <I18nProvider defaultMessages={context.i18n} messages={i18n}>
                        <WidgetContainerThemeVariables {...widgetAttrs} className="r5-widget">
                            <Component {...(props as U)} />
                        </WidgetContainerThemeVariables>
                    </I18nProvider>
                </ThemeProvider>
            </StyleSheetManager>
        );
    };
}

export interface CreateMultiViewWidgetProps<P, U> extends MultiViewWidgetProps<P, U> {}

export function createMultiViewWidget<P extends {}, U extends {} = P>({
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
    initialView: ((props: U) => string) | string;
    views: Record<string, ComponentType<U>>;
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
    return class MultiViewWidget extends React.Component<U, MultiWidgetState> {
        state = {
            ...initialState,
            activeView: typeof initialView === 'function' ? initialView(this.props) : initialView,
        };

        // _goTo = <View extends keyof typeof views, S extends ComponentProps<(typeof views)[View]>>(view: View, props?: S) => this.setState({
        _goTo = <S extends Record<string, unknown>>(view: keyof typeof views, params?: S) =>
            this.setState({
                activeView: view as MultiWidgetState['activeView'],
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
