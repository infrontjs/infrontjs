import { trim } from "../util/Functions.js";
import { UrlPattern } from "../util/UrlPattern.js";
import { RouteParams } from "../util/RouteParams.js";
import { State } from "./../base/State.js";

class Router
{
    constructor( appInstance )
    {
        this._routeStatePool = [];
        this.app = appInstance;
        this.isEnabled = false;
        this.previousRoute = null;
        this.currentRoute = null;
    }

    addStateRoute( stateRoute, stateId )
    {
        let sRoute = trim( stateRoute, '/' ),
            sId = stateId;

        if ( sId instanceof State )
        {
            this.app.stateManager.addState( sId );
            sId = sId.ID;
        }

        sRoute = '/' + sRoute;

        this._routeStatePool.push(
            {
                "stateId" : sId,
                "route" : new UrlPattern( sRoute )
            }
        );
    }

    resolveStateDataByRoute( route )
    {
        let stateRouteData = null,
            params = {},
            query = {},
            routeSplits = route.split( "?" );

        route = routeSplits[ 0 ];
        if ( routeSplits.length > 0 )
        {
            let sp = new URLSearchParams( routeSplits[ 1 ] );
            query = Object.fromEntries( sp.entries() );
        }

        for (let si = 0; si < this._routeStatePool.length; si++ )
        {
            params = this._routeStatePool[ si ].route.match( route );
            if ( params )
            {

                stateRouteData = {
                    "stateId" : this._routeStatePool[ si ].stateId,
                    "routeParams" : new RouteParams( params, query )
                };
                break;
            }
        }

        return stateRouteData;
    }

    enable()
    {
        if ( true === this.isEnabled )
        {
            return;
        }
        this.isEnabled = true;
        window.addEventListener( 'hashchange', this.processHash.bind( this ) );
        this.processHash();
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
        route = '/' + trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute( route );
    }

    redirect( url, forceReload = false )
    {
        location.hash = '/' + trim( url, '/' );
        if ( true === forceReload )
        {
            this.processHash();
        }
    }

    async execute( route )
    {
        // Get view call
        try
        {
            let stateData = this.resolveStateDataByRoute( route );
            if ( stateData && stateData.hasOwnProperty( 'stateId' ) && stateData.hasOwnProperty( 'routeParams' ) )
            {
                let stateInstance = this.app.stateManager.createState(
                    stateData.stateId,
                    stateData.routeParams
                );

                this.app.stateManager.switchTo( stateInstance );
            }
        }
        catch( e )
        {
            console.error( e );
            // Uncatched error
        }
    }
}

export { Router };
