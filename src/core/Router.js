import { Util } from "../base/Util.js";
import { UrlPattern } from "../base/UrlPattern.js";
import { RouteParams } from "../base/RouteParams.js";

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

    addState( stateName, stateRoute = null )
    {
        let sRoute = Util.trim( stateRoute, '/' ),
            sName = Util.trim( stateName, '/' ),
            sPaths = sName.split( '/' ),
            sPath = '';

        sRoute = '/' + sRoute;

        if ( sPaths.length > 1 )
        {
            sName = sPaths.pop();
            for ( let pi = 0; pi < sPaths.length; pi++ )
            {
                sPath += sPaths[ pi ] + '/';
            }

            sPath = Utils.trim( sPath, '/' );
        }

        this._routeStatePool.push(
            {
                "name" : sName,
                "path" : sPath,
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
                    "stateName" : this._routeStatePool[ si ].name,
                    "statePath" : this._routeStatePool[ si ].path,
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
        this.enabled = true;
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
        route = '/' + Util.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute( route );
    }

    redirect( url, forceReload = false )
    {
        location.hash = '/' + Util.trim( url, '/' );
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
            if ( stateData && stateData.hasOwnProperty( 'stateName' ) && stateData.hasOwnProperty( 'routeParams' ) )
            {
                let stateInstance = await this.app.stateManager.createState(
                    stateData.stateName,
                    stateData.routeParams,
                    stateData.statePath
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
