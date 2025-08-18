import { ProfileAddress } from '@reachfive/identity-core';
import { getValue, setValue } from '../helpers/propertyHelpers';

export interface PathMapping {
    bind<T extends Record<string, unknown>>(model: T): unknown;
    unbind<T extends Record<string, unknown>, V>(model: T, value: V): T | V;
}

export class DefaultPathMapping implements PathMapping {
    protected readonly modelPath: string;

    constructor(modelPath: string) {
        this.modelPath = modelPath;
    }

    bind<T extends Record<string, unknown>>(model: T) {
        return getValue(model, this.modelPath);
    }

    unbind<T extends Record<string, unknown>, V>(model: T, value: V) {
        return setValue(model, this.modelPath, value);
    }
}

export class AddressPathMapping implements PathMapping {
    protected readonly property: string;

    constructor(property: string) {
        this.property = property;
    }

    private defaultIndex(model: { addresses?: ProfileAddress[] }) {
        const defaultIndex = (model.addresses ?? []).findIndex(address => address.isDefault);
        return defaultIndex > -1 ? defaultIndex : 0;
    }

    bind<T extends { addresses?: ProfileAddress[] }>(model: T) {
        return getValue(model, `addresses.${this.defaultIndex(model)}.${this.property}`);
    }

    unbind<T extends { addresses?: ProfileAddress[] }, V>(model: T, value: V) {
        return setValue(model, `addresses.${this.defaultIndex(model)}.${this.property}`, value);
    }
}
