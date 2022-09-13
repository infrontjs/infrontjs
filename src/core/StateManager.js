import { trim } from "../util/Functions.js";

class StateManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this.currentState = null;
        this.pathToStateFolder = this.app.settings.getPropertyValue( 'stateManager.rootPath' );
        console.log( this.pathToStateFolder );
    }

    async createState( name, routeParams, path = '' )
    {
        let stateInstance = null;

        if ( path && path.length > 0 )
        {
            path = trim( path, '/' );
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
