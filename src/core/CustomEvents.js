/**
 * CustomEvents
 * Lightweight event system implementation providing DOM-like event API.
 * Used as base class for App and provides centralized event handling.
 *
 * @class
 *
 * @example
 * // Basic usage with custom class
 * class MyService extends CustomEvents {
 *     constructor() {
 *         super();
 *     }
 *
 *     start() {
 *         this.dispatchEvent(new CustomEvent('start', {
 *             detail: { timestamp: Date.now() }
 *         }));
 *     }
 * }
 *
 * const service = new MyService();
 * service.addEventListener('start', (e) => {
 *     console.log('Service started at', e.detail.timestamp);
 * });
 * service.start();
 *
 * @example
 * // Using with InfrontJS App
 * const app = new IF.App(container);
 *
 * // Listen to framework events
 * app.addEventListener(CustomEvents.TYPE.READY, () => {
 *     console.log('App is ready');
 * });
 *
 * app.addEventListener(CustomEvents.TYPE.BEFORE_STATE_CHANGE, (e) => {
 *     console.log('Changing from', e.detail.currentStateId, 'to', e.detail.nextStateId);
 * });
 *
 * @example
 * // Removing event listeners
 * const handler = (e) => console.log('State changed');
 * app.addEventListener(CustomEvents.TYPE.AFTER_STATE_CHANGE, handler);
 * // Later...
 * app.removeEventListener(CustomEvents.TYPE.AFTER_STATE_CHANGE, handler);
 */
class CustomEvents {
    /**
     * Built-in event types used by InfrontJS framework
     *
     * @static
     * @readonly
     * @returns {Object.<string, string>} Object mapping event names to their types
     *
     * @property {string} READY - App initialization complete
     * @property {string} POPSTATE - Browser back/forward navigation
     * @property {string} BEFORE_STATE_CHANGE - Before state transition (cancelable)
     * @property {string} AFTER_STATE_CHANGE - After state transition complete
     * @property {string} BEFORE_LANGUAGE_SWITCH - Before language change
     * @property {string} AFTER_LANGUAGE_SWITCH - After language change complete
     * @property {string} ON_STATE_NOT_FOUND - When no matching state found (404)
     *
     * @example
     * // Using built-in event types
     * app.addEventListener(CustomEvents.TYPE.READY, () => {
     *     console.log('App ready');
     * });
     */
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

    /**
     * Create a new CustomEvents instance
     *
     * @constructor
     */
    constructor() {
        /**
         * Internal map of event type to array of listeners
         * @private
         * @type {Map<string, Array<Function>>}
         */
        this.listeners = new Map();
    }

    /**
     * Add an event listener for a specific event type
     *
     * @param {string} type - Event type to listen for
     * @param {Function|EventListenerOrEventListenerObject} listener - Callback function or event listener object
     *
     * @example
     * // Function listener
     * app.addEventListener('customEvent', (event) => {
     *     console.log('Custom event fired:', event.detail);
     * });
     *
     * @example
     * // Object listener
     * const listener = {
     *     handleEvent(event) {
     *         console.log('Event:', event.type);
     *     }
     * };
     * app.addEventListener('myEvent', listener);
     */
    addEventListener(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(listener);
    }

    /**
     * Remove an event listener for a specific event type
     *
     * @param {string} type - Event type to remove listener from
     * @param {Function|EventListenerOrEventListenerObject} listener - The exact listener function or object to remove
     *
     * @example
     * // Remove specific listener
     * const handler = (e) => console.log('Event fired');
     * app.addEventListener('myEvent', handler);
     * app.removeEventListener('myEvent', handler);
     *
     * @example
     * // One-time event listener pattern
     * const onceHandler = (e) => {
     *     console.log('This runs only once');
     *     app.removeEventListener('myEvent', onceHandler);
     * };
     * app.addEventListener('myEvent', onceHandler);
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
     * Dispatch an event to all registered listeners
     * Executes all listeners in the order they were added.
     *
     * @param {Event|CustomEvent} event - Event object to dispatch. Use CustomEvent for custom data.
     * @returns {boolean} True unless event.preventDefault() was called
     *
     * @example
     * // Dispatch simple event
     * app.dispatchEvent(new Event('refresh'));
     *
     * @example
     * // Dispatch event with data
     * app.dispatchEvent(new CustomEvent('userLogin', {
     *     detail: {
     *         userId: 123,
     *         username: 'john',
     *         timestamp: Date.now()
     *     }
     * }));
     *
     * @example
     * // Cancelable event
     * const event = new CustomEvent('beforeSave', {
     *     detail: { data: formData },
     *     cancelable: true
     * });
     * const allowed = app.dispatchEvent(event);
     * if (!allowed) {
     *     console.log('Save was prevented');
     * }
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