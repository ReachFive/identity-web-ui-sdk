import React, { ComponentType, ReactNode, Suspense, useState } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { createWidget, type PrepareFn } from '@/components/widget/widget';
import { WidgetContainerProps } from '@/components/widget/widgetContainerComponent';
import { useI18n } from '@/contexts/i18n';
import { widgetErrorMessage } from '@/helpers/errors';
import { logError } from '@/helpers/logger';

import type { OnError } from '@/types';

export interface QueryWidgetProps {
    /** Called once with the error when the widget cannot load its data. */
    onError?: OnError;
}

/**
 * One query client per rendered widget, so widgets never share a cache entry.
 * No retry and no refetch on window focus: a token that is expired or lacks rights (401/403)
 * must not be sent again.
 */
const createWidgetQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false },
            mutations: { retry: false },
        },
    });

// Rendered under the widget's I18nProvider, so the API error message key can be translated.
const WidgetErrorFallback = ({ error }: FallbackProps) => {
    const i18n = useI18n();
    return (
        <Alert variant="destructive">
            <AlertTitle className="mb-0">{widgetErrorMessage(error, i18n)}</AlertTitle>
        </Alert>
    );
};

interface WidgetBoundaryProps {
    onError?: OnError;
    onReset?: () => void;
    children: ReactNode;
}

/**
 * Shows the widget error output in place of the content and calls `onError` once.
 * It has no suspense boundary: a pending read suspends up to the parent one. Inside a transition,
 * React keeps the current content on screen until the read completes.
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

/** `WidgetErrorBoundary` plus a spinner while the first read is pending. */
export function WidgetBoundary({ onError, onReset, children }: WidgetBoundaryProps) {
    return (
        <WidgetErrorBoundary onReset={onReset} onError={onError}>
            <Suspense fallback={<LoaderCircle className="animate-spin" />}>{children}</Suspense>
        </WidgetErrorBoundary>
    );
}

/**
 * Creates a `show*` widget from a component that loads its own data with suspense queries.
 * The query client and the boundaries are set up here.
 */
export function createQueryWidget<P extends QueryWidgetProps>({
    component: Component,
    prepare,
    ...widgetAttrs
}: {
    component: ComponentType<Omit<P, 'theme'>>;
    /** Checks the options before rendering, as in `createWidget`. */
    prepare?: PrepareFn<P, P>;
} & WidgetContainerProps) {
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

    return createWidget<P>({ component: QueryWidget, prepare, ...widgetAttrs });
}
