import { Router } from "./Router.js";
import { StateManager } from "./StateManager.js";
import { ViewManager } from "./ViewManager.js";
import { TemplateManager } from "./TemplateManager.js";
import { L18n } from "./L18n.js";

import { Helper } from "../util/Helper.js";
import { PathObject } from "../util/PathObject.js";


const VERSION = '0.9.0 ';

const DEFAULT_PROPS = {
    "uid" : null,
    "title" : null,
    "container" : null
};

const DEFAULT_SETTINGS = {
    "app" : {
        "sayHello" : true,
    },
    "l18n" : {
        "defaultLanguage" : "en"
    },
    "router" : {
        "isEnabled" : true,
        "basePath" : "/"
    },
    "stateManager" : {
        "rootPath" : ""
    },
    "viewManager" : {
    },
    "templateManager" : {
        "rootPath" : ""
    }
};

class App
{
    static POOL = {};

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

    constructor( props = {}, settings = {} )
    {
        props = { ...DEFAULT_PROPS, ...props };
        for ( let prop in props )
        {
            this[ prop ] = props[ prop ];
        }

        if ( !this.uid )
        {
            this.uid = Helper.createUid();
        }

        this.settings = new PathObject( { ...DEFAULT_SETTINGS, ...settings } );

        // If container property is a string, check if it is a querySelector
        if ( this.container !== null && false === this.container instanceof HTMLElement )
        {
            throw new Error( 'Invalid app container.' );
        }
        else
        {
            this.container = document.querySelector( 'body' );
        }

        // Init core components
        this.initL18n();
        this.initStateManager();
        this.initViewManager();
        this.initTemplateManager();
        this.initRouter();

        // Add app to global app pool
        App.POOL[ this.uid ] = this;

        if ( true === this.settings.get( 'app.sayHello' ) && console )
        {
            console && console.log( "%c»InfrontJS« Version " + VERSION, "font-family: monospace sans-serif; background-color: black; color: white;" );
        }
    }

    initL18n()
    {
        this.l18n = new L18n( this );

    }
    initStateManager()
    {
        this.stateManager = new StateManager( this );
    }

    initRouter()
    {
        this.router = new Router( this );
    }

    initViewManager()
    {
        this.viewManager = new ViewManager( this );
    }

    initTemplateManager()
    {
        this.templateManager = new TemplateManager( this );
    }

    getVersion()
    {
        return VERSION;
    }

    async run( route = null )
    {
        if ( this.title )
        {
            this.viewManager.setWindowTitle( this.title );
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

    async destroy()
    {
        // @todo Implement logic, set innerHTML to zero ... etc
    }
}

export { App };
