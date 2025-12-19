import { useEffect, useMemo, useRef } from 'react';

import { debounce } from './utils';

export const useDebounceCallback = <T extends unknown[]>(
    callback: (...args: T) => void,
    delay: number
) => {
    const ref = useRef(callback);

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        // pass arguments to callback function
        const func = (...arg: T) => {
            ref.current(...arg);
        };

        return debounce(func, delay);
    }, [delay]);

    return debouncedCallback;
};
