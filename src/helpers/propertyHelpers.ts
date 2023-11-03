export function getValue<T extends Record<string, unknown>>(object: T = {} as T, path: string): unknown {
    return path.split('.').reduce<Record<string, unknown> | unknown>((acc, field) => {
        if (acc && typeof acc === 'object' && field in acc) {
            return (acc as Record<string, unknown>)[field];
        }
    }, object);
}

function _setValueR<T extends Record<string, unknown>, V>(object: T = {} as T, path: string[], index: number, value: V): T | V {
    if (index < path.length) {
        const subObject = (object[path[index]] || {}) as Record<string, unknown> ;

        return {
            ...object,
            [path[index]]: _setValueR(subObject, path, index + 1, value)
        };
    } else {
        return value;
    }
}

export function setValue<T extends Record<string, unknown>, V>(object: T = {} as T, path: string, value: V) {
    return _setValueR(object, path.split('.'), 0, value);
}
