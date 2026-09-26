import React from 'react';

type FormSubmissionContextValue = {
    /** Whether the last submission succeeded: the handler resolved, or its error was skipped. */
    succeeded: boolean;
    setLock: (id: string, locked: boolean) => void;
};

const FormSubmissionContext = React.createContext<FormSubmissionContextValue | null>(null);

/**
 * The state of a form's submission, shared with its fields.
 *
 * - `succeeded` tells whether the last submission succeeded. React-hook-form's
 *   `isSubmitSuccessful` cannot tell it, since `Form` catches the handler's errors: it only turns
 *   false when the error happens to be set on a field.
 * - Fields may hold locks on the submission, e.g. a verification code which can no longer be used:
 *   while any is held, the form disables its submit button and ignores submissions.
 *   React-hook-form has no equivalent: a disabled field is left out of the submitted values, but
 *   does not prevent the submission.
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
