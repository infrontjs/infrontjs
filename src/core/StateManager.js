import { Helper } from "../util/Helper.js";
import { DefaultIndexState } from "../base/DefaultIndexState.js";
import { CustomEvents } from "../IF.js";


/**
 * States - The state manager.
 * You can create multiple States instances in your application logic, e.g. for dealing with sub-states etc.
 */
class StateManager
{
    static DEFAULT_INDEX_STATE_ID = 'INFRONT_DEFAULT_INDEX_STATE';
    static DEFAULT_NOT_FOUND_STATE_ID = 'INFRONT_DEFAULT_NOTFOUND_STATE';

    /**
     * Constructor
     * @param {App} appInstance - Instance of app
     * @param {State=} parentState - Parent state for sub-state managers
     */
    constructor( appInstance, parentState = null )
    {
        this.app = appInstance;
        this.parentState = parentState;
        this._states =  {};
        this._currentState = null;
        this._stateNotFoundClass = this.app ? this.app.config.get( 'stateManager.notFoundState' ) : null;
    }

    set currentState( currentState )
    {
        this._currentState = currentState;
    }

    get currentState()
    {
        return this._currentState;
    }

    set stateNotFoundClass( stateNotFoundClass )
    {
        if ( false === Helper.isClass( stateNotFoundClass ) )
        {
            throw new Error( 'States.setNotFoundClass expects a class/subclass of State.' );
        }

        this._stateNotFoundClass = stateNotFoundClass;
    }

    get stateNotFoundClass()
    {
        return this._stateNotFoundClass;
    }

    /**
     * Add state class
     *
     * @param {...DefaultBaseState} stateClasses - State class to be added.
     * @throws {Error}  - Throws an error when adding state is not possible
     * @returns {boolean} - Returns wheter or not adding was successful
     */
    add( ...stateClasses )
    {
        for( const stateClass of stateClasses )
        {
            if ( false === Helper.isClass( stateClass ) )
            {
                throw new Error( 'States.addState expects a class/subclass of State.' );
            }

            // Autogeneratre id in case it is not valid
            if ( false === Helper.isString( stateClass.ID ) )
            {
                console.warn( 'StateClass doesnt have a valid ID.' );
                stateClass.ID = Helper.createUid();
            }

            if ( true === this._states.hasOwnProperty( stateClass.ID ) )
            {
                console.warn( `StateClass not added. ID ${stateClass.ID} already exists.` );
                return false;
            }

            this._states[ stateClass.ID ] = stateClass;

            if ( Helper.isString( stateClass.ROUTE ) )
            {
                this.app.router.addRoute( stateClass.ROUTE, stateClass );
            }
            else if ( Helper.isArray( stateClass.ROUTE ) )
            {
                for ( let route of stateClass.ROUTE )
                {
                    this.app.router.addRoute( route, stateClass );
                }
            }
        }
    }

    /**
     * Create an instance of given state id
     *
     * @param {string} stateId - The state id to be instantiated
     * @param {RouteParams} routeParams - Current RouteParams
     * @returns {State|null} - State instance or null
     */
    create( stateId, routeParams )
    {
        let stateInstance = null;

        if ( this._states.hasOwnProperty( stateId ) )
        {
            // Pass parent state to sub-state constructor
            stateInstance = new this._states[ stateId ]( this.app, routeParams, this.parentState );
        }
        else if ( null !== this.stateNotFoundClass )
        {
            stateInstance = new this.stateNotFoundClass( this.app, routeParams, this.parentState );
        }
        else
        {
            console.error( `State ${stateId} does not exist.` );
        }

        return stateInstance;
    }

    /**
     * Checks if given stateId already exists.
     *
     * @param {string} stateId
     * @return {boolean}
     */
    exists( stateId )
    {
        return this._states.hasOwnProperty( stateId );
    }

    /**
     * Switch to given state
     * @param {DefaultBaseState} newState - Instance of state to switch to
     * @throws {Error} - Throws an error if given state cannot be entered, current state cannot be exited, or if enter()/exit() functions throw an error.
     * @returns {Promise<boolean>}
     */
    async switchTo( newState )
    {
        let previousStateId = null;
        let currentStateId = this.currentState ? this.currentState.getId() : null;

        // Create hierarchy-aware event details
        const eventDetail = {
            currentStateId: currentStateId,
            nextStateId: newState ? newState.getId() : null,
            isSubState: this.parentState !== null,
            parentStateId: this.parentState ? this.parentState.getId() : null
        };

        this.app.dispatchEvent(
            new CustomEvent(CustomEvents.TYPE.BEFORE_STATE_CHANGE, { detail: eventDetail })
        );

        if ( false === newState.canEnter() )
        {
            const redirectUrl = newState.getRedirectUrl();
            if ( redirectUrl )
            {
                // For sub-states, delegate redirect to root state manager
                if (this.parentState) {
                    const rootState = newState.getRootState();
                    const rootApp = rootState.app;
                    if (rootApp && rootApp.router) {
                        rootApp.router.redirect(redirectUrl);
                    }
                } else {
                    this.app.router.redirect( redirectUrl );
                }
                return false;
            }

            throw Error( 'Forbidden to enter new state:' + newState.getId() );
        }

        if ( this.currentState )
        {
            // Check if current state can be exited
            if ( false === this.currentState.canExit() )
            {
                throw new Error( 'Cannot exit current state: ' + this.currentState.getId() );
            }

            previousStateId = this.currentState.getId();
            await this.currentState.exit();
            
            // Dispose of the current state to cleanup resources (including sub-states)
            if (typeof this.currentState.dispose === 'function') {
                await this.currentState.dispose();
            }
            
            delete this.currentState;
        }

        this.currentState = newState;
        
        // Update parent state reference if this is a sub-state manager
        if (this.parentState) {
            this.parentState.currentSubState = newState;
        }
        
        await newState.enter();
        currentStateId = this.currentState.getId();

        // Update event detail for after-change event
        eventDetail.previousStateId = previousStateId;
        eventDetail.currentStateId = currentStateId;

        this.app.dispatchEvent(
            new CustomEvent(CustomEvents.TYPE.AFTER_STATE_CHANGE, { detail: eventDetail })
        );

        return true;
    }

}

export { StateManager };
