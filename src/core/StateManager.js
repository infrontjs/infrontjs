import { isClass, isClassChildOf } from "../util/Functions.js";
import { State } from "../base/State.js";

class StateManager
{
    constructor( appInstance )
    {
        this._states =  {};
        this.app = appInstance;
        this.currentState = null;
        this.pathToStateFolder = this.app.settings.getPropertyValue( 'stateManager.rootPath' );
    }

    addStateClass( stateClass )
    {
        if ( false === isClass( stateClass ) || false === isClassChildOf( stateClass, 'State') )
        {
            throw new Error( 'StateManager.addStateClass expects a class/subclass of State.' );
        }

        if ( false === this._states.hasOwnProperty( stateClass.ID ) )
        {
            this._states[ stateClass.ID ] = stateClass;
        }
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

    switchTo( newState )
    {
        if ( false === newState.canEnter() )
        {
            // @todo Think about how to handle this
            return false;
        }

        if ( this.currentState )
        {
            this.currentState.exit();
            delete this.currentState;
        }

        newState.enter();
        this.currentState = newState;
    }

}

export { StateManager };
