import { Router } from "./Router.js";
import { States } from "./States.js";
import { View } from "./View.js";
import { L18n } from "./L18n.js";
import { Events } from "./Events.js";

import { Helper } from "../util/Helper.js";
import { PathObject } from "../util/PathObject.js";


const VERSION = '0.9.91';

const DEFAULT_SETTINGS = {
    "app" : {
        "id" : null,
        "title" : null,
        "sayHello" : true
    },
    "l18n" : {
        "defaultLanguage" : "en"
    },
    "router" : {
        "isEnabled" : true,
        "basePath" : null
    },
    "states" : {
        "basePath" : "",
        "useDefaultIndexState" : true,
        "useDefaultNotFoundState" : true
    }
};

/**
 * App
 * The App class is the logical core unit of every InfrontJS application.
 */
class App extends Events
{
    static POOL = {};

    /**
     *
     * @param {string|null} uid - Get instance by given uid. If no uid is given, the first app from pool is returned.
     * @returns {(App|null)}
     */
    static get( uid = null )
    {
        if ( uid && App.POOL.hasOwnProperty( uid ) )
        {
            return App.POOL[ uid ];
        }
        else if ( null === uid &&  Object.keys( App.POOL ).length > 0 )
        {
            return App.POOL[ Object.keys( App.POOL )[ 0 ] ];
        }
        else
        {
            return null;
        }
    }

    /**
     * Create an app instance
     * @param {HTMLElement} [container=document.body] - The root container of the application.
     * @param {object=} settings - Application settings object.
     * @param {object=} settings.app - App settings.
     * @param {string|null} [settings.app.title=null] - App's title, if set it will be set to the title header value.
     * @param {string|null} [settings.app.id=null] - Unique id of app instance. If not set, it will be auto generated.
     */
    constructor( container = null, settings = {} )
    {
        super();

        this.container = container;

        // @todo Replace spread logic with lodash merge function (inline)
        this.settings = new PathObject( { ...DEFAULT_SETTINGS, ...settings } );
        if ( null === this.settings.get( 'app.id', null ) )
        {
            this.settings.set( 'app.id', Helper.createUid() );
        }

        if ( typeof window === 'undefined'  )
        {
            throw new Error( 'InfrontJS works only in browser mode.' );
        }

        // If container property is a string, check if it is a querySelector
        if ( this.container !== null && false === this.container instanceof HTMLElement )
        {
            throw new Error( 'Invalid app container.' );
        }
        else if ( this.container === null )
        {
            const body = document.querySelector( 'body' );
            const customContainer = document.createElement( 'section' );
            body.appendChild( customContainer );
            this.container = customContainer;
        }

        this.container.setAttribute( 'data-ifjs-app-id', this.settings.get( 'app.id') );

        // Init core components
        this.initRouter();
        this.initL18n();
        this.initStates();
        this.initView();

        // Add app to global app pool
        App.POOL[ this.uid ] = this;

        if ( true === this.settings.get( 'app.sayHello' ) && console )
        {
            console && console.log( "%c»InfrontJS« Version " + VERSION, "font-family: monospace sans-serif; background-color: black; color: white;" );
        }

        this.emit( Events.EVENT.READY );
    }

    initL18n()
    {
        this.l18n = new L18n( this );

    }
    initStates()
    {
        this.states = new States( this );
    }

    initRouter()
    {
        this.router = new Router( this );
    }

    initView()
    {
        this.view = new View( this );
    }

    /**
     * Get InfrontJS version
     *
     * @returns {string} - Version string
     */
    getVersion()
    {
        return VERSION;
    }

    /**
     * Run application logic. This activates the InfrontJS application logic.
     * Note:
     * This is an asynchronous function providing the possibility to e.g. loading assets etc.
     *
     * @param {string|null} [route=null] - If route is set, this route is set initially.
     * @returns {Promise<void>}
     */
    async run( route = null )
    {
        if ( this.settings.get( 'app.title' ) )
        {
            this.view.setWindowTitle( this.settings.get( 'app.title' ) );
        }

        this.router.enable();
        if ( route )
        {
            // @todo Fix this for "url" router mode
            this.router.redirect( route, ( this.router.resolveRoute( route ) === this.router.resolveRoute( location.hash ) ) );
        }
        else
        {
            this.router.process();
        }
    }

    /**
     * Destorys InfrontJS application instance
     * @returns {Promise<void>}
     */
    async destroy()
    {
        // @todo Implement logic, set innerHTML to zero ... etc
    }
}

export { App };
