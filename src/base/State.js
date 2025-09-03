import { RouteParams } from "./RouteParams.js";

/**
 * State class. Parent state class. Extend this class for your state logic.
 *
 * @example
 * Create a state called MyState with is executed when the url 'my-state' is called. When executed,
 * it prints 'Hello from MyState' to the console.
 *
 * class MyState extends State
 * {
 *     asnyc enter()
 *     {
 *         console.log( "Hello from MyState" );
 *     }
 * }
 */
class State
{
    /**
     * ID of state. Should be an unique identifier. If not set it will be auto-generated.
     * @type {string|null}
     */
    static ID = null;

    /**
     * Route(s) which trigger this state
     * @type {string|array}
     */
    static ROUTE = "/";

    /**
     *
     * @param {App} app - App instance
     * @param {RouteParams=} routeParams - Current route params
     */
    constructor( app, routeParams )
    {
        this.app = app;
        this.routeParams = null === routeParams ? new RouteParams() : routeParams;
        this._eventListeners = [];
        this._intervals = [];
        this._timeouts = [];
        this._disposed = false;
    }

    /**
     * Return current ID
     *
     * @returns {string}
     */
    getId()
    {
        return this.constructor.ID;
    }

    /**
     * Called before entering state.
     * @returns {boolean}
     */
    canEnter()
    {
        return true;
    }

    /**
     * Called before exiting state.
     * Return false to prevent state transition.
     * @returns {boolean} - True to allow exit, false to prevent exit
     */
    canExit()
    {
        return true;
    }

    /**
     * Called when canEnter() function returns false.
     * @returns {string|null} - Return redirect route.
     */
    getRedirectUrl()
    {
        return null;
    }

    /**
     * Called when entering scene and after canEnter() call returned true.
     * @returns {Promise<void>}
     */
    async enter()
    {
    }

    /**
     * Called when exiting scene and after canExit() call return true.
     * @returns {Promise<void>}
     */
    async exit()
    {
    }

    getParams()
    {
        return this.routeParams.getParams();
    }

    getParam( key, defaultValue = null )
    {
        return this.routeParams.getParam( key, defaultValue );
    }

    getQueries()
    {
        return this.routeParams.getQueries();
    }

    getQuery( key, defaultValue = null )
    {
        return this.routeParams.getQuery( key, defaultValue );
    }

    /**
     * Add event listener with automatic cleanup tracking
     * @param {EventTarget} target - Event target (element, window, document, etc.)
     * @param {string} type - Event type
     * @param {Function} listener - Event listener function
     * @param {boolean|object} options - Event listener options
     */
    addEventListener( target, type, listener, options = false )
    {
        if (this._disposed) {
            console.warn('Cannot add event listener to disposed state');
            return;
        }

        target.addEventListener(type, listener, options);
        this._eventListeners.push({ target, type, listener, options });
    }

    /**
     * Remove specific event listener
     * @param {EventTarget} target - Event target
     * @param {string} type - Event type
     * @param {Function} listener - Event listener function
     * @param {boolean|object} options - Event listener options
     */
    removeEventListener( target, type, listener, options = false )
    {
        target.removeEventListener(type, listener, options);
        
        const index = this._eventListeners.findIndex(item => 
            item.target === target && 
            item.type === type && 
            item.listener === listener
        );
        
        if (index !== -1) {
            this._eventListeners.splice(index, 1);
        }
    }

    /**
     * Set interval with automatic cleanup tracking
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in milliseconds
     * @returns {number} Interval ID
     */
    setInterval( callback, delay )
    {
        if (this._disposed) {
            console.warn('Cannot set interval on disposed state');
            return null;
        }

        const intervalId = setInterval(callback, delay);
        this._intervals.push(intervalId);
        return intervalId;
    }

    /**
     * Clear specific interval
     * @param {number} intervalId - Interval ID to clear
     */
    clearInterval( intervalId )
    {
        clearInterval(intervalId);
        const index = this._intervals.indexOf(intervalId);
        if (index !== -1) {
            this._intervals.splice(index, 1);
        }
    }

    /**
     * Set timeout with automatic cleanup tracking
     * @param {Function} callback - Callback function
     * @param {number} delay - Delay in milliseconds
     * @returns {number} Timeout ID
     */
    setTimeout( callback, delay )
    {
        if (this._disposed) {
            console.warn('Cannot set timeout on disposed state');
            return null;
        }

        const timeoutId = setTimeout(callback, delay);
        this._timeouts.push(timeoutId);
        return timeoutId;
    }

    /**
     * Clear specific timeout
     * @param {number} timeoutId - Timeout ID to clear
     */
    clearTimeout( timeoutId )
    {
        clearTimeout(timeoutId);
        const index = this._timeouts.indexOf(timeoutId);
        if (index !== -1) {
            this._timeouts.splice(index, 1);
        }
    }

    /**
     * Check if state has been disposed
     * @returns {boolean} True if state is disposed
     */
    isDisposed()
    {
        return this._disposed;
    }

    /**
     * Dispose of the state and cleanup all resources
     * Called automatically by StateManager when exiting state
     * Override onDispose() for custom cleanup logic
     * @returns {Promise<void>}
     */
    async dispose()
    {
        if (this._disposed) {
            return;
        }

        // Call custom disposal logic first
        try {
            await this.onDispose();
        } catch (error) {
            console.error('Error in onDispose():', error);
        }

        // Clean up event listeners
        for (const { target, type, listener, options } of this._eventListeners) {
            try {
                target.removeEventListener(type, listener, options);
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        }
        this._eventListeners.length = 0;

        // Clear intervals
        for (const intervalId of this._intervals) {
            try {
                clearInterval(intervalId);
            } catch (error) {
                console.warn('Error clearing interval:', error);
            }
        }
        this._intervals.length = 0;

        // Clear timeouts
        for (const timeoutId of this._timeouts) {
            try {
                clearTimeout(timeoutId);
            } catch (error) {
                console.warn('Error clearing timeout:', error);
            }
        }
        this._timeouts.length = 0;

        // Nullify references
        this.app = null;
        this.routeParams = null;
        
        this._disposed = true;
    }

    /**
     * Override this method for custom cleanup logic
     * Called before automatic resource cleanup in dispose()
     * @returns {Promise<void>}
     */
    async onDispose()
    {
        // Override in subclasses for custom cleanup
    }

}

export { State };
