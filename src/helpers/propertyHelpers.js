export function getValue(object = {}, path) {
    return path.split('.').reduce((acc, field) => {
        if (acc) {
            return acc[field];
        }
    }, object);
}

function _setValueR(object = {}, path, index, value) {
    if (index < path.length) {
        const subObject = object[path[index]] || {};

        return {
            ...object,
            [path[index]]: _setValueR(subObject, path, index + 1, value)
        };
    } else {
        return value;
    }
}

export function setValue(object = {}, path, value) {
    return _setValueR(object, path.split('.'), 0, value);
}
