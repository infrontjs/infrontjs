import { Router } from "./Router.js";
import { StateManager } from "./StateManager.js";
import { View } from "./View.js";
import { I18n } from "./I18n.js";
import { CustomEvents } from "./CustomEvents.js";

import { Helper } from "../util/Helper.js";
import { PathObject } from "../util/PathObject.js";
import { DefaultIndexState } from "../base/DefaultIndexState.js";


const VERSION = '1.0.0-rc9';

const DEFAULT_CONFIG = {
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
        "mode" : "url",
        "basePath" : null
    },
    "stateManager" : {
        "notFoundState" : DefaultIndexState
    }
};

/**
 * App
 * The App class is the logical core unit of every InfrontJS application.
 */
class App extends CustomEvents
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
     * @param {object=} config - Application configuration object.
     * @param {object=} config.app - App configuration.
     * @param {string|null} [settings.app.title=null] - App's title, if set it will be set to the title header value.
     * @param {string|null} [settings.app.id=null] - Unique id of app instance. If not set, it will be auto generated.
     */
    constructor( container = null, config = {} )
    {
        super();

        this.container = container;

        this.config = new PathObject( Helper.deepMerge( DEFAULT_CONFIG, config ) );
        if ( null === this.config.get( 'app.id', null ) )
        {
            this.config.set( 'app.id', Helper.createUid() );
        }

        if ( typeof window === 'undefined'  )
        {
            throw new Error( 'InfrontJS works only in browser mode.' );
        }

        // If container property is a string, check if it is a querySelector
        if ( this.container !== null && !(this.container instanceof HTMLElement) )
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

        this.container.setAttribute( 'data-ifjs-app-id', this.config.get( 'app.id') );

        // Init core components
        this.initRouter();
        this.initL18n();
        this.initStates();
        this.initView();

        // Add app to global app pool
        App.POOL[ this.config.get('app.id') ] = this;

        if ( true === this.config.get( 'app.sayHello' ) && console )
        {
            console && console.log( "%c»InfrontJS« Version " + VERSION, "font-family: monospace sans-serif; background-color: black; color: white;" );
        }

        this.dispatchEvent(new CustomEvent( CustomEvents.TYPE.READY ));
    }

    initL18n()
    {
        this.l18n = new I18n( this );
    }
    initStates()
    {
        this.stateManager = new StateManager( this );
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
        if ( this.config.get( 'app.title' ) )
        {
            this.view.setWindowTitle( this.config.get( 'app.title' ) );
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
     * Destroys InfrontJS application instance
     * @returns {Promise<void>}
     */
    async destroy()
    {
        // Disable router to stop processing events
        if (this.router) {
            this.router.disable();
        }

        // Exit current state and clean up state manager
        if (this.stateManager && this.stateManager.currentState) {
            try {
                await this.stateManager.currentState.exit();
                await this.stateManager.currentState.dispose();
            } catch (error) {
                console.warn('Error during state cleanup:', error);
            }
            this.stateManager.currentState = null;
        }

        // Clear container content
        if (this.container) {
            this.container.innerHTML = '';
            this.container.removeAttribute('data-ifjs-app-id');
        }

        // Remove from global app pool
        if (App.POOL[this.config.get('app.id')]) {
            delete App.POOL[this.config.get('app.id')];
        }

        // Clear references to prevent memory leaks
        this.router = null;
        this.stateManager = null;
        this.view = null;
        this.l18n = null;
        this.container = null;
        this.config = null;
    }
}

export { App };
