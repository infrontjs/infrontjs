import { UrlPattern } from "../util/UrlPattern.js";
import { RouteParams } from "../util/RouteParams.js";
import { Helper } from "../util/Helper.js";

class Router
{
    static ACTION_TYPE_FUNCTION = "function";
    static ACTION_TYPE_STATE = "state";

    constructor( appInstance )
    {
        this._routeActions = [];
        this.app = appInstance;
        this.isEnabled = false;
        this.previousRoute = null;
        this.currentRoute = null;
    }

    // Add third optional param called isIndexAction to be triggered, when route is empty
    addRoute( route, action )
    {
        let sRoute = Helper.trim( route, '/' ),
            type = Router.ACTION_TYPE_FUNCTION;

        sRoute = '/' + sRoute;

        if ( true === Helper.isClass( action ) ) // @todo fix - this does not work for webpack in production mode && true === isClassChildOf( action, 'State' )  )
        {
            type = Router.ACTION_TYPE_STATE
            this.app.stateManager.addStateClass( action );
            this._routeActions.push(
                {
                    "type" : type,
                    "action" : action.ID,
                    "route" : new UrlPattern( sRoute )
                }
            );
        }
        // else: check if object and if object has an enter and exit method
        else
        {
            throw new Error( 'Invalid action type.' );
        }
    }

    resolveActionDataByRoute( route )
    {
        let routeData = null,
            params = {},
            query = {},
            routeSplits = route.split( "?" );

        route = routeSplits[ 0 ];
        if ( routeSplits.length > 0 )
        {
            let sp = new URLSearchParams( routeSplits[ 1 ] );
            query = Object.fromEntries( sp.entries() );
        }

        for (let si = 0; si < this._routeActions.length; si++ )
        {
            params = this._routeActions[ si ].route.match( route );
            if ( params )
            {

                routeData = {
                    "routeActionData" : this._routeActions[ si ],
                    "routeParams" : new RouteParams( params, query )
                };
                break;
            }
        }

        return routeData;
    }

    enable()
    {
        if ( true === this.isEnabled )
        {
            return;
        }
        this.isEnabled = true;
        window.addEventListener( 'hashchange', this.processHash.bind( this ) );
    }

    disable()
    {
        this.isEnabled = false;
    }

    processHash()
    {
        const hash = location.hash || '#';
        let route = hash.slice(1);

        // always start with a leading slash
        route = '/' + Helper.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute( route );
    }

    redirect( url, forceReload = false )
    {
        location.hash = '/' + Helper.trim( url, '/' );
        if ( true === forceReload )
        {
            this.processHash();
        }
    }

    resolveRoute( route )
    {
        let r = Helper.trim( route, '/#' );
        r = Helper.trim( r, '#' );
        r = Helper.trim( r, '/' );

        return '/' + r;
    }

    async execute( route )
    {
        // Get view call
        try
        {
            const actionData = this.resolveActionDataByRoute( route );
            if ( actionData && actionData.hasOwnProperty( 'routeActionData' ) && actionData.hasOwnProperty( 'routeParams' ) )
            {
                switch( actionData.routeActionData.type )
                {
                    case Router.ACTION_TYPE_STATE:
                        let stateInstance = this.app.stateManager.createState(
                            actionData.routeActionData.action,
                            actionData.routeParams
                        );
                        await this.app.stateManager.switchTo( stateInstance );
                    break;
                }
            }
        }
        catch( e )
        {
            console && console.error( e );
            // Uncatched error
        }
    }
}

export { Router };
