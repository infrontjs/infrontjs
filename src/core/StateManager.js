import { Helper } from "../util/Helper.js";

class StateManager
{
    constructor( appInstance )
    {
        this._states =  {};
        this.app = appInstance;
        this.currentState = null;
        this.defaultStateId = null;
    }

    addState( stateClass )
    {
        // @todo Fix this, only check for function or class
        if ( false === Helper.isClass( stateClass ) )
        {
            throw new Error( 'StateManager.addState expects a class/subclass of State.' );
        }

        // Throw an error if ID is null or already taken
        if ( false === Helper.isString( stateClass.ID ) )
        {
            throw new Error( 'Given stateClass does not have a valid static ID' );
        }

        if ( true === this._states.hasOwnProperty( stateClass.ID ) )
        {
            return false;
        }

        this._states[ stateClass.ID ] = stateClass;

        if ( Helper.isString( stateClass.ROUTE ) )
        {
            this.app.router.addRoute( stateClass.ROUTE, stateClass );
        }
        else if ( Helper.isArray( stateClass.ROUTE ) )
        {
            for ( let route in stateClass.ROUTE )
            {
                this.app.router.addRoute( route, stateClass );
            }
        }

        if ( stateClass.IS_DEFAULT )
        {
            // @todo Add warning if defaultState is already set and not of the same ID
            this.defaultStateId = stateClass.ID;
        }

        return true;
    }

    createState( stateId, routeParams )
    {
        let stateInstance = null;

        if ( this._states.hasOwnProperty( stateId ) )
        {
            stateInstance = new this._states[ stateId ]( this.app, routeParams );
        }

        return stateInstance;
    }

    getDefaultStateId()
    {
        return this.defaultStateId;
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
