export function log(msg: string) {
    if (window.console?.log) window.console.log(msg);
}

export function logError(messageOrException: unknown, exception?: unknown) {
    if (window.console) {
        if (window.console.error) {
            if (exception !== undefined) {
                window.console.error(messageOrException, exception);
            } else {
                window.console.error(messageOrException);
            }
        } else if (window.console.log) {
            window.console.log(messageOrException);
        }
    }
}
