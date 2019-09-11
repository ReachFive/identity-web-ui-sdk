export function log(msg) {
    if (window.console && window.console.log) window.console.log(msg);
}

export function logError(messageOrException, exception) {
    if (window.console) {
        if (window.console.error) {
            if (exception) {
                window.console.error(messageOrException, exception);
            } else {
                window.console.error(messageOrException);
            }
        } else if (window.console.log) {
            window.console.log(messageOrException);
        }
    }
}
