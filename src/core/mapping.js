import { getValue, setValue } from '../helpers/propertyHelpers';

export class PathMapping {
    constructor(modelPath) {
        this.modelPath = modelPath;
    }

    bind(model) {
        return getValue(model, this.modelPath);
    }

    unbind(model, value) {
        return setValue(model, this.modelPath, value);
    }
}
