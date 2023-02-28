import { Helper } from "../util/Helper.js";
import { DefaultState } from "../base/DefaultState.js";

/**
 * States - The state manager.
 * You can create multiple States instances in your application logic, e.g. for dealing with sub-states etc.
 */
class States
{
    static DEFAULT_STATE_ID = 'INFRONT_DEFAULT_STATE_ID';

    /**
     * Constructor
     * @param {App} appInstance - Instance of app
     */
    constructor( appInstance )
    {
        this._states =  {};
        this.app = appInstance;
        this.currentState = null;
        this.defaultStateId = null;
    }

    /**
     * Add state class
     *
     * @param {BaseState} stateClass - State class to be added.
     * @throws {Error}  - Throws an error when adding state is not possible
     * @returns {boolean} - Returns wheter or not adding was successful
     */
    add( stateClass )
    {
        // @todo Fix this, only check for function or class
        if ( false === Helper.isClass( stateClass ) )
        {
            throw new Error( 'States.addState expects a class/subclass of State.' );
        }

        // Throw an error if ID is null or already taken
        if ( false === Helper.isString( stateClass.ID ) )
        {
            stateClass.ID = Helper.createUid();
            // @todo show warning ... throw new Error( 'Given stateClass does not have a valid static ID' );
        }

        if ( true === this._states.hasOwnProperty( stateClass.ID ) )
        {
            // @todo Show warning ...
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

        return true;
    }

    /**
     * Create an instance of given state id
     *
     * @param {string} stateId - The state id to be instantiated
     * @param {RouteParams} routeParams - Current RouteParams
     * @returns {null}
     */
    create( stateId, routeParams )
    {
        let stateInstance = null;

        if ( this._states.hasOwnProperty( stateId ) )
        {
            stateInstance = new this._states[ stateId ]( this.app, routeParams );
        }
        else if ( stateId === States.DEFAULT_STATE_ID )
        {
            stateInstance = new DefaultState( this.app, routeParams );
        }

        return stateInstance;
    }

    /**
     * Switch to given state
     * @param {BaseState} newState - Instance of state to switch to
     * @throws {Error} - Throws an error if given state cannot be entered or if enter() function throws an error.
     * @returns {Promise<boolean>}
     */
    async switchTo( newState )
    {
        if ( false === newState.canEnter() )
        {
            const redirectTo = newState.getRedirectTo();
            if ( redirectTo )
            {
                this.app.router.redirect( redirectTo );
                return false;
            }

            throw Error( 'Forbidden to enter new state:' + newState.getId() );
        }

        if ( this.currentState )
        {
            await this.currentState.exit();
            delete this.currentState;
        }

        this.currentState = newState;
        await newState.enter();
    }

}

export { States };
