import React, { PropsWithChildren } from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import '@testing-library/jest-dom/jest-globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRowRemoval } from '../../../src/components/list/useRowRemoval';

interface Device {
    id: string;
}

const remove = jest.fn<(device: Device) => Promise<void>>();
const onOpen = jest.fn<(key: string) => void>();

const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const renderRemoval = () =>
    renderHook(
        () =>
            useRowRemoval({
                removal: useMutation({ mutationFn: remove, onError: () => {} }),
                onOpen,
            }),
        { wrapper }
    );

beforeEach(() => {
    jest.resetAllMocks();
});

describe('useRowRemoval', () => {
    test('opening a confirmation tells which row and replaces any other one', () => {
        const { result } = renderRemoval();

        act(() => result.current.open('a'));
        expect(result.current.confirmingKey).toBe('a');
        expect(onOpen).toHaveBeenCalledWith('a');

        act(() => result.current.open('b'));
        expect(result.current.confirmingKey).toBe('b');
    });

    test('cancel closes the confirmation without any removal', () => {
        const { result } = renderRemoval();

        act(() => result.current.open('a'));
        act(() => result.current.cancel());

        expect(result.current.confirmingKey).toBeNull();
        expect(remove).not.toHaveBeenCalled();
    });

    test('confirm removes the element and closes the confirmation once it succeeded', async () => {
        remove.mockResolvedValue();
        const { result } = renderRemoval();

        act(() => result.current.open('a'));
        act(() => result.current.confirm({ id: 'a' }));

        await waitFor(() => expect(result.current.confirmingKey).toBeNull());
        expect(remove).toHaveBeenCalledWith({ id: 'a' }, expect.anything());
        expect(result.current.pending).toBe(false);
    });

    test('a failed removal closes the confirmation too', async () => {
        remove.mockRejectedValue(new Error('Forbidden'));
        const { result } = renderRemoval();

        act(() => result.current.open('a'));
        act(() => result.current.confirm({ id: 'a' }));

        await waitFor(() => expect(result.current.confirmingKey).toBeNull());
    });

    test('confirming again while the removal runs is ignored', async () => {
        let settle: () => void = () => {};
        remove.mockReturnValue(
            new Promise<void>(resolve => {
                settle = resolve;
            })
        );
        const { result } = renderRemoval();

        act(() => result.current.open('a'));
        act(() => result.current.confirm({ id: 'a' }));
        await waitFor(() => expect(result.current.pending).toBe(true));
        act(() => result.current.confirm({ id: 'a' }));

        expect(result.current.confirmingKey).toBe('a');
        act(() => settle());
        await waitFor(() => expect(result.current.confirmingKey).toBeNull());
        expect(remove).toHaveBeenCalledTimes(1);
    });
});
