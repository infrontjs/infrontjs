import { PropertyObject } from "./PropertyObject.js";
import { Helper } from "../util/Helper.js";

import { Router } from "./Router.js";
import { StateManager } from "./StateManager.js";
import { ViewManager } from "./ViewManager.js";
import { TemplateManager } from "./TemplateManager.js";
import { L18n } from "./L18n.js";


const VERSION = '0.7.7';

const DEFAULT_PROPS = {
    "uid" : null,
    "title" : "InfrontJS",
    "container" : null
};

const DEFAULT_SETTINGS = {
    "sayHello" : true,
    "l18n" : {
        "defaultLanguage" : "en"
    },
    "router" : {
        "isEnabled" : true
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

class App extends PropertyObject
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
        super( { ...DEFAULT_PROPS, ...props } );

        this.settings = new PropertyObject( { ...DEFAULT_SETTINGS, settings } );

        if ( !this.uid )
        {
            this.uid = Helper.createUid();
        }

        // If container property is a string, check if it is a querySelector
        if ( Helper.isString( this.container ) )
        {
            this.container = document.querySelector( this.container );
        }

        if ( !this.container || false === this.container instanceof HTMLElement )
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
        //apps[ this.uid ] = this;
        App.POOL[ this.uid ] = this;

        if ( true === this.settings.sayHello && console )
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

    async run( route = null )
    {
        this.viewManager.setWindowTitle( this.title );
        this.router.enable();
        if ( route )
        {
            this.router.redirect( route, ( this.router.resolveRoute( route ) === this.router.resolveRoute( location.hash ) ) );
        }
        else
        {
            this.router.processHash();
        }
    }

    async destroy()
    {
        // @todo Implement logic, set innerHTML to zero ... etc
    }
}

export { App };
