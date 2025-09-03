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
     * @param {State=} parentState - Parent state for sub-states
     */
    constructor( app, routeParams, parentState = null )
    {
        this.app = app;
        this.routeParams = null === routeParams ? new RouteParams() : routeParams;
        this.parentState = parentState;
        this.subStateManager = null;
        this.currentSubState = null;
        this._stateData = null;
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
     * Also checks if sub-states can exit.
     * @returns {boolean} - True to allow exit, false to prevent exit
     */
    canExit()
    {
        // Check if current sub-state can exit
        if (this.currentSubState && !this.currentSubState.canExit()) {
            return false;
        }
        
        // Override in subclasses for custom logic
        return this.onCanExit();
    }

    /**
     * Override this method for custom exit validation logic
     * @returns {boolean} - True to allow exit, false to prevent exit
     */
    onCanExit()
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
        await this.onEnter();
    }

    /**
     * Override this method for custom enter logic
     * @returns {Promise<void>}
     */
    async onEnter()
    {
        // Override in subclasses
    }

    /**
     * Called when exiting scene and after canExit() call return true.
     * Also handles sub-state cleanup.
     * @returns {Promise<void>}
     */
    async exit()
    {
        // Exit sub-state first if exists
        if (this.currentSubState) {
            await this.currentSubState.exit();
            await this.currentSubState.dispose();
            this.currentSubState = null;
        }

        // Clear sub-state manager current state
        if (this.subStateManager) {
            this.subStateManager.currentState = null;
        }

        await this.onExit();
    }

    /**
     * Override this method for custom exit logic
     * @returns {Promise<void>}
     */
    async onExit()
    {
        // Override in subclasses
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
     * Set data for this state (used for data transfer between states)
     * @param {*} data - Data to set
     */
    setStateData( data )
    {
        this._stateData = data;
    }

    /**
     * Get data for this state
     * @returns {*} - State data
     */
    getStateData()
    {
        return this._stateData;
    }

    /**
     * Create a sub-state manager for nested states
     * @returns {Promise<StateManager>} Sub-state manager instance
     */
    async createSubStateManager()
    {
        if (!this.subStateManager) {
            // Import StateManager here to avoid circular dependency
            const { StateManager } = await import('../core/StateManager.js');
            this.subStateManager = new StateManager(this.app, this);
        }
        return this.subStateManager;
    }

    /**
     * Switch to a sub-state
     * @param {string} subStateId - Sub-state ID to switch to
     * @param {*} stateData - Data to pass to sub-state
     * @returns {Promise<boolean>}
     */
    async switchToSubState( subStateId, stateData = null )
    {
        if (!this.subStateManager) {
            throw new Error('No sub-state manager exists. Call createSubStateManager() first.');
        }

        const subStateInstance = this.subStateManager.create(subStateId, this.routeParams);
        if (!subStateInstance) {
            throw new Error(`Sub-state ${subStateId} could not be created.`);
        }

        if (stateData !== null) {
            subStateInstance.setStateData(stateData);
        }

        const success = await this.subStateManager.switchTo(subStateInstance);
        if (success) {
            this.currentSubState = subStateInstance;
        }
        
        return success;
    }

    /**
     * Get current sub-state
     * @returns {State|null}
     */
    getCurrentSubState()
    {
        return this.currentSubState;
    }

    /**
     * Check if this state has sub-states
     * @returns {boolean}
     */
    hasSubStates()
    {
        return this.subStateManager !== null;
    }

    /**
     * Check if this state has an active sub-state
     * @returns {boolean}
     */
    hasActiveSubState()
    {
        return this.currentSubState !== null;
    }

    /**
     * Get the root state (top-level parent)
     * @returns {State}
     */
    getRootState()
    {
        let current = this;
        while (current.parentState) {
            current = current.parentState;
        }
        return current;
    }

    /**
     * Get state path (hierarchy chain)
     * @returns {string[]} Array of state IDs from root to current
     */
    getStatePath()
    {
        const path = [];
        let current = this;
        
        while (current) {
            path.unshift(current.getId());
            current = current.parentState;
        }
        
        return path;
    }

    /**
     * Get full state path including current sub-state
     * @returns {string[]} Complete path including sub-states
     */
    getFullStatePath()
    {
        const path = this.getStatePath();
        
        if (this.currentSubState) {
            const subPath = this.currentSubState.getFullStatePath();
            // Remove the first element (this state) from subPath to avoid duplication
            path.push(...subPath.slice(1));
        }
        
        return path;
    }

    /**
     * Find a state in the hierarchy by ID
     * @param {string} stateId - State ID to find
     * @returns {State|null} Found state or null
     */
    findStateInHierarchy( stateId )
    {
        // Check this state
        if (this.getId() === stateId) {
            return this;
        }
        
        // Check current sub-state
        if (this.currentSubState) {
            const found = this.currentSubState.findStateInHierarchy(stateId);
            if (found) {
                return found;
            }
        }
        
        // Check parent
        if (this.parentState) {
            return this.parentState.findStateInHierarchy(stateId);
        }
        
        return null;
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
     * Handles hierarchical cleanup of sub-states
     * Override onDispose() for custom cleanup logic
     * @returns {Promise<void>}
     */
    async dispose()
    {
        if (this._disposed) {
            return;
        }

        // Dispose sub-states first (depth-first cleanup)
        if (this.currentSubState) {
            await this.currentSubState.dispose();
            this.currentSubState = null;
        }

        // Dispose all states in sub-manager
        if (this.subStateManager) {
            // Clean up any remaining states in the sub-state manager
            if (this.subStateManager.currentState && this.subStateManager.currentState !== this.currentSubState) {
                await this.subStateManager.currentState.dispose();
            }
            
            // Clean up the sub-state manager itself
            this.subStateManager.currentState = null;
            this.subStateManager = null;
        }

        // Call custom disposal logic
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
        this.parentState = null;
        this._stateData = null;
        
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
