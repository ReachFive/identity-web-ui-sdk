import React, { ComponentType, Suspense, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

import { ErrorText } from '@/components/miscComponent';
import { createWidget } from '@/components/widget/widget';
import { WidgetContainerProps } from '@/components/widget/widgetContainerComponent';
import { widgetErrorMessage } from '@/helpers/errors';

import type { OnError } from '@/types';

export interface QueryWidgetProps {
    /**
     * Called once with the error when the widget cannot load its data.
     */
    onError?: OnError;
}

export type CreateQueryWidget<P> = {
    component: ComponentType<Omit<P, 'theme'>>;
} & WidgetContainerProps;

/**
 * A query client per rendered widget: a key is never shared across widgets. `retry: false` so an
 * expired or under-privileged token (401/403) is never replayed.
 */
export const createWidgetQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

export const WidgetSpinner = () => <LoaderCircle className="animate-spin" />;

const WidgetErrorFallback = ({ error }: FallbackProps) => (
    <ErrorText>{widgetErrorMessage(error)}</ErrorText>
);

/**
 * Plugs a self-contained component, which loads its own data with suspense queries, into the
 * `show*` widget factory. The adapter owns the query client and the boundaries; the component
 * only reads and mutates.
 *
 * - suspense boundary: the spinner while the first read is pending;
 * - error boundary: the error output in place of the component, and the single `onError` call;
 * - query error reset boundary: lets a future retry button refetch the failed queries.
 */
export function createQueryWidget<P extends QueryWidgetProps>({
    component: Component,
    ...widgetAttrs
}: CreateQueryWidget<P>) {
    const QueryWidget = (props: Omit<P, 'theme'>) => {
        const [queryClient] = useState(createWidgetQueryClient);
        const { onError } = props as QueryWidgetProps;

        return (
            <QueryClientProvider client={queryClient}>
                <QueryErrorResetBoundary>
                    {({ reset }) => (
                        <ErrorBoundary
                            onReset={reset}
                            onError={error => onError?.(error)}
                            FallbackComponent={WidgetErrorFallback}
                        >
                            <Suspense fallback={<WidgetSpinner />}>
                                <Component {...props} />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </QueryErrorResetBoundary>
            </QueryClientProvider>
        );
    };

    QueryWidget.displayName = `QueryWidget(${Component.displayName ?? Component.name ?? 'Component'})`;

    return createWidget<P>({ component: QueryWidget, ...widgetAttrs });
}
