import React from 'react';

type FormSubmissionContextValue = {
    /** Whether the last submission succeeded. */
    succeeded: boolean;
    /** Sets or releases the submit lock held by `id`. */
    setLock: (id: string, locked: boolean) => void;
};

const FormSubmissionContext = React.createContext<FormSubmissionContextValue | null>(null);

/**
 * Holds a form's submission state: whether the last submission succeeded, and the submit locks
 * set by its descendants.
 */
export function useFormSubmissionState() {
    const [succeeded, setSucceeded] = React.useState(false);
    const [locks, setLocks] = React.useState<ReadonlySet<string>>(new Set());

    const setLock = React.useCallback((id: string, locked: boolean) => {
        setLocks(current => {
            if (current.has(id) === locked) return current;
            const next = new Set(current);
            if (locked) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const value = React.useMemo(() => ({ succeeded, setLock }), [succeeded, setLock]);

    return { locked: locks.size > 0, setSucceeded, value };
}

export const FormSubmissionProvider = FormSubmissionContext.Provider;

/** Whether the last submission of the enclosing form succeeded. `false` outside a form. */
export function useFormSubmissionSucceeded() {
    return React.useContext(FormSubmissionContext)?.succeeded ?? false;
}

/**
 * Locks the submission of the enclosing form while `locked` holds. Does nothing outside a form.
 */
export function useLockFormSubmit(locked: boolean) {
    const context = React.useContext(FormSubmissionContext);
    const setLock = context?.setLock;
    const id = React.useId();

    React.useEffect(() => {
        if (!setLock) return;
        setLock(id, locked);
        return () => setLock(id, false);
    }, [setLock, id, locked]);
}
