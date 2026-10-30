import React, { ComponentType, ReactNode, Suspense, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

import { ErrorText } from '@/components/miscComponent';
import { createWidget } from '@/components/widget/widget';
import { WidgetContainerProps } from '@/components/widget/widgetContainerComponent';
import { widgetErrorMessage } from '@/helpers/errors';
import { logError } from '@/helpers/logger';

import type { OnError } from '@/types';

export interface QueryWidgetProps {
    /**
     * Called once with the error when the widget cannot load its data.
     */
    onError?: OnError;
}

/**
 * A query client per rendered widget: a key is never shared across widgets.
 *
 * - `retry: false` so an expired or under-privileged token (401/403) is never replayed;
 * - `refetchOnWindowFocus: false` so coming back to the page never silently replays a token that
 *   may have expired in the meantime.
 */
const createWidgetQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false },
            mutations: { retry: false },
        },
    });

const WidgetErrorFallback = ({ error }: FallbackProps) => (
    <ErrorText>{widgetErrorMessage(error)}</ErrorText>
);

interface WidgetBoundaryProps {
    /** Called once with the error that replaced the content. */
    onError?: OnError;
    onReset?: () => void;
    children: ReactNode;
}

/**
 * The error boundary around content read through suspense queries: the widget error output in
 * place of the content, logged like any widget display failure, and the single `onError` call.
 * Without a suspense boundary of its own, a pending read suspends up to an enclosing one: inside
 * a transition, React then keeps the current content on screen until the read completes.
 */
export function WidgetErrorBoundary({ onError, onReset, children }: WidgetBoundaryProps) {
    const handleError = (error: unknown) => {
        logError('ReachFive widget display fails:', error);
        onError?.(error);
    };

    return (
        <ErrorBoundary
            onReset={onReset}
            onError={handleError}
            FallbackComponent={WidgetErrorFallback}
        >
            {children}
        </ErrorBoundary>
    );
}

/**
 * The boundaries around content read through suspense queries: the error boundary of
 * `WidgetErrorBoundary`, and a suspense boundary showing the spinner while the first read is
 * pending.
 */
export function WidgetBoundary({ onError, onReset, children }: WidgetBoundaryProps) {
    return (
        <WidgetErrorBoundary onReset={onReset} onError={onError}>
            <Suspense fallback={<LoaderCircle className="animate-spin" />}>{children}</Suspense>
        </WidgetErrorBoundary>
    );
}

/**
 * Plugs a self-contained component, which loads its own data with suspense queries, into the
 * `show*` widget factory. The adapter owns the query client and the boundaries; the component
 * only reads and mutates. The query error reset boundary lets a future retry button refetch the
 * failed queries.
 */
export function createQueryWidget<P extends QueryWidgetProps>({
    component: Component,
    ...widgetAttrs
}: { component: ComponentType<Omit<P, 'theme'>> } & WidgetContainerProps) {
    const QueryWidget = (props: Omit<P, 'theme'>) => {
        const [queryClient] = useState(createWidgetQueryClient);
        const { onError } = props as QueryWidgetProps;

        return (
            <QueryClientProvider client={queryClient}>
                <QueryErrorResetBoundary>
                    {({ reset }) => (
                        <WidgetBoundary onReset={reset} onError={onError}>
                            <Component {...props} />
                        </WidgetBoundary>
                    )}
                </QueryErrorResetBoundary>
            </QueryClientProvider>
        );
    };

    QueryWidget.displayName = `QueryWidget(${Component.displayName ?? Component.name ?? 'Component'})`;

    return createWidget<P>({ component: QueryWidget, ...widgetAttrs });
}
