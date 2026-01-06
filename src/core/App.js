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
 * It serves as a dependency injection container and lifecycle manager for the framework's core subsystems:
 * Router, StateManager, View, and I18n.
 *
 * @class
 * @extends CustomEvents
 *
 * @example
 * // Basic app setup
 * const container = document.querySelector('#app');
 * const app = new IF.App(container, {
 *     app: { title: 'My Application' },
 *     router: { mode: 'url' },
 *     l18n: { defaultLanguage: 'en' }
 * });
 *
 * // Register states
 * app.stateManager.add(HomeState, AboutState, UserState);
 *
 * // Start the application
 * await app.run();
 *
 * @example
 * // Multiple app instances
 * const app1 = new IF.App(container1, { app: { id: 'main-app' } });
 * const app2 = new IF.App(container2, { app: { id: 'widget-app' } });
 *
 * // Access by ID
 * const mainApp = IF.App.get('main-app');
 *
 * @example
 * // Cleanup when done
 * await app.destroy(); // Properly cleans up all resources
 */
class App extends CustomEvents
{
    /**
     * Global pool of all app instances
     * @static
     * @type {Object.<string, App>}
     */
    static POOL = {};

    /**
     * Get an app instance from the global pool by UID
     *
     * @static
     * @param {string|null} [uid=null] - Unique identifier of the app. If null, returns the first app in the pool.
     * @returns {(App|null)} The app instance or null if not found
     *
     * @example
     * // Get specific app
     * const app = IF.App.get('my-app-id');
     *
     * @example
     * // Get first app (useful for single-app setups)
     * const app = IF.App.get();
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
     *
     * @constructor
     * @param {HTMLElement|null} [container=null] - The root container of the application. If null, creates a new <section> element in document.body
     * @param {object} [config={}] - Application configuration object
     * @param {object} [config.app] - App-level configuration
     * @param {string|null} [config.app.id=null] - Unique ID of app instance. Auto-generated if not provided
     * @param {string|null} [config.app.title=null] - App's title. If set, updates document.title
     * @param {boolean} [config.app.sayHello=true] - Whether to log InfrontJS version to console
     * @param {object} [config.l18n] - Internationalization configuration
     * @param {string} [config.l18n.defaultLanguage='en'] - Default language code
     * @param {object} [config.router] - Router configuration
     * @param {boolean} [config.router.isEnabled=true] - Enable/disable routing
     * @param {string} [config.router.mode='url'] - Router mode: 'url' (pushState) or 'hash'
     * @param {string|null} [config.router.basePath=null] - Base path for subdirectory deployments
     * @param {object} [config.stateManager] - State manager configuration
     * @param {Function} [config.stateManager.notFoundState] - State class to use for 404 errors
     *
     * @throws {Error} If not running in browser environment
     * @throws {Error} If container is not an HTMLElement
     *
     * @example
     * // Minimal setup with auto-generated container
     * const app = new IF.App();
     *
     * @example
     * // Full configuration
     * const app = new IF.App(document.querySelector('#app'), {
     *     app: {
     *         id: 'my-app',
     *         title: 'My Application',
     *         sayHello: false
     *     },
     *     router: {
     *         mode: 'url',
     *         basePath: '/myapp'
     *     },
     *     l18n: {
     *         defaultLanguage: 'de'
     *     },
     *     stateManager: {
     *         notFoundState: Custom404State
     *     }
     * });
     *
     * @example
     * // Using existing container
     * const container = document.createElement('div');
     * container.id = 'app-root';
     * document.body.appendChild(container);
     * const app = new IF.App(container);
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

    /**
     * Initialize internationalization subsystem
     * @private
     */
    initL18n()
    {
        this.l18n = new I18n( this );
    }

    /**
     * Initialize state management subsystem
     * @private
     */
    initStates()
    {
        this.stateManager = new StateManager( this );
    }

    /**
     * Initialize routing subsystem
     * @private
     */
    initRouter()
    {
        this.router = new Router( this );
    }

    /**
     * Initialize view/template rendering subsystem
     * @private
     */
    initView()
    {
        this.view = new View( this );
    }

    /**
     * Get InfrontJS version
     *
     * @returns {string} Version string (e.g., '1.0.0-rc9')
     *
     * @example
     * const version = app.getVersion();
     * console.log('Running InfrontJS', version);
     */
    getVersion()
    {
        return VERSION;
    }

    /**
     * Run application logic and activate routing
     * This is an asynchronous function that starts the application lifecycle.
     * It enables the router and processes the initial route.
     *
     * @async
     * @param {string|null} [route=null] - Initial route to navigate to. If null, uses current URL
     * @returns {Promise<void>}
     *
     * @example
     * // Start with current URL
     * await app.run();
     *
     * @example
     * // Start at specific route
     * await app.run('/dashboard');
     *
     * @example
     * // Complete startup flow
     * const app = new IF.App(container, config);
     * app.stateManager.add(HomeState, AboutState);
     *
     * // Load translations before starting
     * await app.l18n.loadTranslations('en', '/locales/en.json');
     *
     * // Start application
     * await app.run('/home');
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
     * Destroys InfrontJS application instance and cleans up all resources
     * This method properly disposes of all subsystems, removes event listeners,
     * cleans up the DOM, and removes the app from the global pool.
     *
     * @async
     * @returns {Promise<void>}
     *
     * @example
     * // Cleanup when app is no longer needed
     * await app.destroy();
     *
     * @example
     * // Cleanup before page navigation
     * window.addEventListener('beforeunload', async () => {
     *     await app.destroy();
     * });
     *
     * @example
     * // Switch between apps
     * await oldApp.destroy();
     * const newApp = new IF.App(container, newConfig);
     * await newApp.run();
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
