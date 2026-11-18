import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { OnError } from '@/types';

/**
 * Refetches queries after a change. On failure the cached data stays on screen, because a
 * suspense query throws only when it has no data, and the error is passed once to `onError`.
 */
export const useInvalidateQueries = (onError: OnError) => {
    const queryClient = useQueryClient();

    return (...queryKeys: QueryKey[]): Promise<void> =>
        Promise.all(
            queryKeys.map(queryKey =>
                queryClient.invalidateQueries({ queryKey }, { throwOnError: true })
            )
        )
            .then(() => undefined)
            .catch(onError);
};
