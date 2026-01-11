import { RouteParams } from "../base/RouteParams.js";
import { Helper } from "../util/Helper.js";
import { StateManager } from "./StateManager.js";
import { CustomEvents } from "./CustomEvents.js";
import { UP } from "../_external/url-pattern/UrlPattern.js";

const UrlPattern = UP();

/**
 * Router for handling routing events (ie. changes of the URL) and resolving and triggering corresponding states.
 */
class Router
{
    /**
     * Constructor
     * @param {App} appInstance - Instance of app
     */
    constructor( appInstance )
    {
        this.app = appInstance;

        this.mode = this.app.config.get( 'router.mode', 'url' );
        this.basePath = this.app.config.get( 'router.basePath', null );

        this._routeActions = [];
        this.isEnabled = false;
        this.previousRoute = null;
        this.currentRoute = null;

        // Bind event handlers once to avoid memory leaks
        this._boundProcessUrl = this.processUrl.bind(this);
        this._boundProcessHash = this.processHash.bind(this);
        this._boundPopState = ((e) => {
            this.app.dispatchEvent(
                new CustomEvent(CustomEvents.TYPE.POPSTATE,
                {
                    detail: {
                        originalEvent : e
                    }
                })
            );
            this.processUrl();
        }).bind(this);

        // Remove any index.html, index.php etc from url
        // Note: the query string (ie. window.location.search) gets also elimated here.
        const lastPathPart = window.location.href.split( "/" ).pop();
        if ( lastPathPart && lastPathPart.split( "." ).length > 1 )
        {
            let cleanPath = window.location.href.replace( lastPathPart, '' );
            cleanPath = cleanPath.replace( window.location.origin, '' );
            cleanPath = Helper.trim( cleanPath, '/' );
            if ( cleanPath.length > 0 )
            {
                window.history.replaceState( null, null, `/${cleanPath}/` );
            }
        }

        if ( null === this.basePath )
        {
            // Try "best guess"
            this.basePath = "";
        }
        this.basePath = Helper.trim( this.basePath, '/' );
    }

    /**
     * Adds route and action
     *
     * @param {string} route - Route pattern
     * @param {State} stateClass - State class which belongs to route pattern
     */
    addRoute( route, stateClass )
    {
        let sRoute = Helper.trim( route, '/' );
        sRoute = '/' + sRoute;

        if ( true === Helper.isClass( stateClass ) )
        {
            if ( false === this.app.stateManager.exists( stateClass.ID ) )
            {
                this.app.stateManager.add( stateClass );
            }

            this._routeActions.push(
                {
                    "action" : stateClass.ID,
                    "route" : new UrlPattern( sRoute )
                }
            );
        }
        // else: check if object and if object has an enter and exit method
        else
        {
            throw new Error( 'Invalid action.' );
        }
    }

    resolveActionDataByRoute( route )
    {
        let routeData = null,
            params = {},
            query = {},
            routeSplits = route.split( "?" );

        route = routeSplits[ 0 ];
        if ( routeSplits.length > 1 )
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
                    "routeAction" : this._routeActions[ si ].action,
                    "routeParams" : new RouteParams( params, query )
                };
                break;
            }
        }

        // If it is default route
        if ( null === routeData )
        {
            this.app.dispatchEvent(
                new CustomEvent(CustomEvents.TYPE.ON_STATE_NOT_FOUND,
                {
                    detail: {
                        route: route
                    }
                })
            );

            if ( null !== this.app.stateManager.stateNotFoundClass )
            {
                routeData = {
                    "routeAction" : this.app.stateManager.stateNotFoundClass.ID,
                    "routeParams" : null
                }
            }
        }

        return routeData;
    }

    createUrl( str )
    {
        if ( this.mode === 'hash' )
        {
            return '#/' + Helper.trim( str, '/' );
        }
        else if ( 'url' === this.mode )
        {
            return window.location.origin + '/' + this.basePath + '/' + Helper.trim( str, '/' );
        }
    }

    startsWithHash(string)
    {
        const regEx = /^#/;
        const startsWithHash = regEx.test(string);
        return Boolean(startsWithHash);
    }

    /**
     * Enables router logic
     */
    enable()
    {
        if ( true === this.isEnabled )
        {
            return;
        }
        this.isEnabled = true;

        if ( this.mode === 'url' )
        {
            this.app.container.addEventListener( 'click', this._boundProcessUrl, false);
            // Fix to properly handle backbutton
            window.addEventListener( 'popstate', this._boundPopState);
        }
        else if ( this.mode === 'hash' )
        {
            window.addEventListener( 'hashchange', this._boundProcessHash );
        }
        else
        {
            console.error( `Invalid mode: ${mode} detected` );
        }
    }

    /**
     * Disables router logic
     */
    disable()
    {
        this.isEnabled = false;
        if ( this.mode === 'url' )
        {
            this.app.container.removeEventListener( 'click', this._boundProcessUrl );
            window.removeEventListener( 'popstate', this._boundPopState );
        }
        else if ( this.mode === 'hash' )
        {
            window.removeEventListener( 'hashchange', this._boundProcessHash );
        }
    }

    /**
     * @private
     */
    process()
    {
        if ( this.mode === 'url' )
        {
            this.processUrl();
        }
        else if ( this.mode === 'hash' )
        {
            this.processHash();
        }
    }

    processHash()
    {
        const hash = location.hash || '#';
        let route = hash.slice(1);

        // always start with a leading slash
        route = '/' + Helper.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute(  this.resolveActionDataByRoute( route ) );
    }

    processUrl( event = null )
    {
        let url = window.location.href;

        if ( event )
        {
            const target = event.target.closest('a');

            // we are interested only in anchor tag clicks
            if ( !target || target.hostname !== location.hostname ) {
                return;
            }

            event.preventDefault();

            url = target.getAttribute('href');
        }

        // we don't care about example.com#hash or
        // example.com/#hash links
        if (this.startsWithHash(url)) {
            return;
        }

        let route = url.replace( window.location.origin + '/' + Helper.trim( this.basePath, '/' ), '' );
        route = '/' + Helper.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;

        const actionData = this.resolveActionDataByRoute( route );
        if ( actionData )
        {
            window.history.pushState( null, null, url );
        }
        this.execute( actionData );
    }

    redirect( url, forceReload = false )
    {
        if ( 'hash' === this.mode )
        {
            location.hash = '/' + Helper.trim( url, '/' );
            if ( true === forceReload )
            {
                this.processHash();
            }
        }
        else if ( 'url' === this.mode )
        {
            if ( true === forceReload )
            {
                window.history.pushState( null, null, url );
            }
            else
            {
                window.history.replaceState( null, null, url );
                this.processUrl();
            }
        }
    }

    /**
     * Update browser URL without triggering the processing
     *
     * @param {String} url - Sets the url part
     */
    setUrl( url )
    {
        if ( 'hash' === this.mode )
        {
            location.hash = '/' + Helper.trim( url, '/' );

        }
        else if ( 'url' === this.mode )
        {
            window.history.replaceState( null, null, url );
        }
    }

    resolveRoute( route )
    {
        let r = Helper.trim( route, '/#' );
        r = Helper.trim( r, '#' );
        r = Helper.trim( r, '/' );

        return '/' + r;
    }

    async execute( actionData )
    {
        // Get view call
        try
        {
            if ( actionData && actionData.hasOwnProperty( 'routeAction' ) && actionData.hasOwnProperty( 'routeParams' ) )
            {
                let stateInstance = this.app.stateManager.create(
                    actionData.routeAction,
                    actionData.routeParams
                );
                await this.app.stateManager.switchTo( stateInstance );
            }
            else
            {
                console.error( 'No state found.' );
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
