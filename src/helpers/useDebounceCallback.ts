import { useEffect, useMemo, useRef } from 'react';

import { debounce } from './utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDebounceCallback = <T extends unknown[], S>(callback: (...args: T) => S, delay: number) => {
    const ref = useRef(callback);
  
    useEffect(() => {
      ref.current = callback;
    }, [callback]);
  
    const debouncedCallback = useMemo(() => {
        // pass arguments to callback function
        const func = (...arg: T) => {
          return ref.current(...arg)
        }
    
        return debounce(func, delay)
        // or just debounce(ref.current, delay)
      }, [delay])
  
    return debouncedCallback;
};
