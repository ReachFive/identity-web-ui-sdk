export function getValue<T extends Record<string, unknown>>(
    object: T = {} as T,
    path: string
): unknown {
    return path.split('.').reduce<Record<string, unknown> | unknown>((acc, field) => {
        if (acc && typeof acc === 'object' && field in acc) {
            return (acc as Record<string, unknown>)[field];
        }
    }, object);
}

function _setValueR<T extends Record<string, unknown>, V>(
    object: T = {} as T,
    path: string[],
    index: number,
    value: V
): T | V {
    // Si on a atteint la fin du chemin, on retourne la valeur
    if (index === path.length) {
        return value;
    }

    const key = path[index];
    const currentValue = object[key];

    // Si la clé est un nombre, on traite comme un tableau
    if (!isNaN(Number(key))) {
        const array = Array.isArray(object) ? object : [];
        array[Number(key)] = _setValueR((array[Number(key)] || {}) as T, path, index + 1, value);
        return array as unknown as T;
    }

    // Sinon on traite comme un objet
    return {
        ...object,
        [key]: _setValueR((currentValue || {}) as T, path, index + 1, value),
    };
}

/**
 * @example
 * setValue({}, 'a', 2) => { a: 2 }
 * setValue({ a: 1 }, 'a', 2) => { a: 2 }
 * setValue({ a: 1 }, 'b', 2) => { a: 1, b: 2 }
 * setValue({ a: 1 }, 'b.c', 2) => { a: 1, b: { c: 2 } }
 * setValue({ a: { b: { c: 1 } } }, 'a.b.c', 2) => { a: { b: { c: 2 } } }
 * setValue({ a: { b: { c: 1 } } }, 'a.b.d', 2) => { a: { b: { c: 1, d: 2 } } }
 * setValue({ a: 1 }, 'b.0.c', 2) => { a: 1, b: [{ c: 2 }] }
 * setValue({ a: 1, b: [{ c: 1 }] }, 'b.0.c', 2) => { a: 1, b: [{ c: 2 }] }
 * setValue({ a: 1, b: [{ c: 1 }] }, 'b.0.b', 2) => { a: 1, b: [{ c: 1, d: 2 }] }
 * setValue({ a: 1, b: [{ c: 1 }] }, 'b.1.d', 2) => { a: 1, b: [{ c: 1 }, { d: 2 }] }
 */
export function setValue<T extends Record<string, unknown>, V>(
    object: T = {} as T,
    path: string,
    value: V
) {
    return _setValueR(object, path.split('.'), 0, value);
}
