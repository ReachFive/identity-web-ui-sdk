export function deepDefaults(object: Record<string, unknown>, ...defaults: Record<string, unknown>[]): Record<string, unknown> {
    return defaults.length > 0
        ? deepDefaults(deepDefaultsR(object, defaults[0]), ...defaults.slice(1))
        : object;
}

function deepDefaultsR(object: Record<string, unknown>, defaults: Record<string, unknown>): Record<string, unknown> {
    return [...new Set([
        ...Object.keys(object),
        ...Object.keys(defaults),
    ])]
        .reduce((acc, key) => {
            if (
                object[key] !== null && typeof object[key] === 'object'
                && defaults[key] !== null && typeof defaults[key] === 'object'
            ) {
                acc[key] = deepDefaultsR(object[key] as Record<string, unknown>, defaults[key] as Record<string, unknown>)
            } else if (object[key] === undefined) {
                acc[key] = defaults[key];
            } else {
                acc[key] = object[key];
            }
            return acc;
        }, {} as Record<string, unknown>);
}
