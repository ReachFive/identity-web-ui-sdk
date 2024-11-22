import React, { ComponentType } from 'react';
import { ThemeProvider } from 'styled-components'
import type { SessionInfo, Client as CoreClient } from '@reachfive/identity-core'
import { createMemoryRouter, Navigate, RouterProvider } from 'react-router-dom';

import type { Config, Prettify } from '../../types'
import type { I18nMessages } from '../../core/i18n';

import { ConfigProvider } from '../../contexts/config';
import { I18nProvider } from '../../contexts/i18n'
import { ReachfiveProvider } from '../../contexts/reachfive'
import { RoutingProvider } from '../../contexts/routing'
import { SessionProvider } from '../../contexts/session'

import { Theme, ThemeOptions } from '../../types/styled'
import { buildTheme } from '../../core/theme'

import WidgetContainer, { WidgetContainerProps } from './widgetContainerComponent';

export type I18nProps = { i18n?: I18nMessages }
export type ThemeProps = { theme?: ThemeOptions }

export type PropsWithI18n<P> = Prettify<P & I18nProps>
export type PropsWithTheme<P> = Prettify<P & ThemeProps>

export type Context = {
    config: Config
    apiClient: CoreClient
    defaultI18n: I18nMessages
    session?: SessionInfo
}

type PrepareFn<P, U> = (options: PropsWithI18n<PropsWithTheme<P>>, context: Context) => PropsWithI18n<PropsWithTheme<U>> | PromiseLike<PropsWithI18n<PropsWithTheme<U>>>

type CreateWidget<P, U> = {
    component: ComponentType<Omit<U, 'theme'>>
    prepare?: PrepareFn<P, U>
} & WidgetContainerProps

export function createWidget<P, U = P>({
    component,
    prepare = (options: PropsWithI18n<PropsWithTheme<P>>) => options as unknown as PropsWithI18n<PropsWithTheme<U>>,
    ...widgetAttrs
}: CreateWidget<P, U>) {
    return (options: PropsWithTheme<PropsWithI18n<P>>, context: Context) => {
        return Promise.resolve(prepare(options, context)).then(({ theme: customTheme, ...preparedOptions }) => {
            const Component = component

            const theme: Theme = buildTheme(customTheme)

            return (
                <ConfigProvider config={context.config}>
                    <ReachfiveProvider client={context.apiClient}>
                        <SessionProvider session={context.session}>
                            <ThemeProvider theme={theme}>
                                <I18nProvider defaultMessages={context.defaultI18n} messages={preparedOptions.i18n}>
                                    <WidgetContainer {...widgetAttrs}>
                                        <Component {...preparedOptions} />
                                    </WidgetContainer>
                                </I18nProvider>
                            </ThemeProvider>
                        </SessionProvider>
                    </ReachfiveProvider>
                </ConfigProvider>
            );
        });
    }
}

export interface CreateMultiViewWidgetProps<P, U> extends MultiViewWidgetProps<P, U> {}

export function createMultiViewWidget<P, U = P>({ prepare, ...params }: MultiViewWidgetProps<P, U>) {
    return createWidget<P, U>({
        component: multiViewWidget<P, U>(params),
        prepare,
        noIntro: true
    });
}

export interface MultiViewWidgetProps<P, U> {
    initialView: ((props: Omit<U, 'theme'>) => string) | string
    views: Record<string, ComponentType<Omit<U, 'theme'>>>
    initialState?: MultiWidgetState
    prepare?: PrepareFn<P, U>
}

export type MultiWidgetState = Record<string, unknown> & {
    activeView: string
}

function multiViewWidget<P, U>({ initialView, views, initialState = {} as MultiWidgetState }: MultiViewWidgetProps<P, U>) {
    return class MultiViewWidget extends React.Component<Omit<U, 'theme'>, MultiWidgetState> {

        state = {
            ...initialState,
            activeView: typeof initialView === 'function' ? initialView(this.props) : initialView
        };

        // _goTo = <View extends keyof typeof views, S extends ComponentProps<(typeof views)[View]>>(view: View, props?: S) => this.setState({
        _goTo = <S extends Record<string, unknown>>(view: keyof typeof views, params?: S) => this.setState({
            activeView: view as MultiWidgetState['activeView'],
            ...params
        });

        render() {
            const { activeView, ...state } = this.state
            const ActiveComponent = views[activeView];

            return (
                <RoutingProvider goTo={this._goTo} params={state}>
                    <ActiveComponent {...this.props} />
                </RoutingProvider>
            )
        }
    }
}

export interface RouterWidgetProps<P, U> {
    fallbackElement?: React.ReactNode
    initialView: ((props: Omit<U, 'theme'>) => string) | string
    prepare?: PrepareFn<P, U>
    routes: Record<string, React.ComponentType<Omit<U, 'theme'>>>
}

export function createRouterWidget<P, U = P>({ fallbackElement, initialView, prepare, routes }: RouterWidgetProps<P, U>) {
    console.log(window.location)
    return createWidget<P, U>({
        component: (props: Omit<U, 'theme'>) => {
            const initialRoute = typeof initialView === 'function' ? initialView(props) : initialView
            const router = createMemoryRouter([
                ...Object.entries(routes).map(([path, RouteComponent]) => ({
                    path,
                    element: <RouteComponent {...props} />,
                    index: true,
                })),
                { path: '*', element: <Navigate to={initialRoute} replace /> }
            ])
            console.log(router)
            return (
                <RouterProvider
                    router={router}
                    fallbackElement={fallbackElement}
                />
            )
        },
        prepare: prepare,
        noIntro: true
    });
}
