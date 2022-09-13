import { Util } from "./../base/Util.js";

class StateManager
{
    constructor( appInstance, pathToStateFolder = './../states' )
    {
        this.app = appInstance;
        this.currentState = null;
        this.pathToStateFolder = Util.trim( pathToStateFolder, '/' );
    }

    async createState( name, routeParams, path = '' )
    {
        let stateInstance = null;

        if ( path && path.length > 0 )
        {
            path = Utils.trim( path, '/' );
            path += '/';
        }

        // Note
        // Webpack workaround to make dynamic module loading possble
        const stateModule = await import( `${this.pathToStateFolder}/${path}${name}` );

        if ( stateModule && stateModule.hasOwnProperty( name ) )
        {
            stateInstance = new stateModule[ name ]( this.app, routeParams );
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
