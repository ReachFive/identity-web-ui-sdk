import pull from 'lodash-es/pull';
import { logError } from './logger';

export default class EventManager {
    constructor() {
        this.listeners = {};
    }

    fire(name, data) {
        getListeners(this.listeners, name).forEach(listener => {
            try {
                listener(data);
            } catch (e) {
                logError(e);
            }
        });
    }

    on(name, listener) {
        getListeners(this.listeners, name).push(listener);
    }

    off(name, listener) {
        pull(getListeners(this.listeners, name), listener);
    }
}

function getListeners(listeners, name) {
    return listeners[name] || (listeners[name] = []);
}
