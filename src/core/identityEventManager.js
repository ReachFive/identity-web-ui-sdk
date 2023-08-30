import { enrichAuthResult } from './authResult'
import EventManager from '../helpers/eventManager'

export function createEventManager() {
    const eventManager = new EventManager();

    return {
        on(eventName, listener) {
            eventManager.on(eventName, listener);
        },

        off(eventName, listener) {
            eventManager.off(eventName, listener)
        },

        fireEvent(eventName, data) {
            if (eventName === 'authenticated') {
                eventManager.fire(eventName, enrichAuthResult(data));
            } else {
                eventManager.fire(eventName, data);
            }
        }
    }
}
