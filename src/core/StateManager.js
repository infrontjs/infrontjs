import { Helper } from "../util/Helper.js";
import { DefaultState } from "../base/DefaultState.js";

class StateManager
{
    static DEFAULT_STATE_ID = 'INFRONT_DEFAULT_STATE_ID';

    constructor( appInstance )
    {
        this._states =  {};
        this.app = appInstance;
        this.currentState = null;
        this.defaultStateId = null;
    }

    add( stateClass )
    {
        // @todo Fix this, only check for function or class
        if ( false === Helper.isClass( stateClass ) )
        {
            throw new Error( 'StateManager.addState expects a class/subclass of State.' );
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

    create( stateId, routeParams )
    {
        let stateInstance = null;

        if ( this._states.hasOwnProperty( stateId ) )
        {
            stateInstance = new this._states[ stateId ]( this.app, routeParams );
        }
        else if ( stateId === StateManager.DEFAULT_STATE_ID )
        {
            stateInstance = new DefaultState( this.app, routeParams );
        }

        return stateInstance;
    }

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

export { StateManager };
