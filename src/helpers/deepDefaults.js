import union from 'lodash-es/union';
import isPlainObject from 'lodash-es/isPlainObject';
import isUndefined from 'lodash-es/isUndefined';

export function deepDefaults(object, ...defaults) {
    return defaults.length > 0
        ? deepDefaults(deepDefaultsR(object, defaults[0]), ...defaults.slice(1))
        : object;
}

function deepDefaultsR(object, defaults) {
    return union(
        Object.keys(object),
        Object.keys(defaults)
    ).reduce((acc, key) => {
        if (isPlainObject(object[key]) && isPlainObject(defaults[key])) {
            acc[key] = deepDefaultsR(object[key], defaults[key])
        } else if (isUndefined(object[key])) {
            acc[key] = defaults[key];
        } else {
            acc[key] = object[key];
        }
        return acc;
    }, {});
}
