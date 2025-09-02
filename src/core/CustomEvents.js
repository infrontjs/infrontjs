/**
 * Events
 * Super simple custom events
 *
 * @example
 * class MyClass {
 *   constructor() {
 *       this.events = new CustomEvents();
 *   }
 *   start() {
 *       this.events.dispatchEvent(new CustomEvent("start", { detail: { myData: '...' } }));
 *   }
 * }
 *
 * const myInstance = new MyClass();
 * myInstance.events.addEventListener("start", e => { console.log(e.detail); });
 *
 */
class CustomEvents {
    static get TYPE() {
        return {
            'READY': 'ready',
            'POPSTATE': 'popstate',
            'BEFORE_STATE_CHANGE': 'beforeStateChange',
            'AFTER_STATE_CHANGE': 'afterStateChange',
            'BEFORE_LANGUAGE_SWITCH': 'beforeLanguageSwitch',
            'AFTER_LANGUAGE_SWITCH': 'afterLanguageSwitch',
            'ON_STATE_NOT_FOUND': 'onStateNotFound'
        };
    }

    constructor() {
        this.listeners = new Map();
    }

    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     */
    addEventListener(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(listener);
    }

    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     */
    removeEventListener(type, listener) {
        if (!this.listeners.has(type)) {
            return;
        }
        const listeners = this.listeners.get(type);
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * @param {Event} event
     */
    dispatchEvent(event) {
        if (!this.listeners.has(event.type)) {
            return true;
        }
        const listeners = this.listeners.get(event.type).slice();
        for (const listener of listeners) {
            listener.call(this, event);
        }
        return !event.defaultPrevented;
    }
}

export { CustomEvents };