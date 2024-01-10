import { getValue, setValue } from '../helpers/propertyHelpers';

export class PathMapping {
    protected readonly modelPath: string

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
