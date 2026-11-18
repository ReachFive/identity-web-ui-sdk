import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { OnError } from '@/types';

/**
 * Refetches queries after a change. A failed refetch keeps the cached data on screen (a suspense
 * query only throws without data) and is reported once through `onError`.
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
