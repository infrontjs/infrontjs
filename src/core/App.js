import { PropertyObject } from "./PropertyObject.js";
import { createUid, isString } from "../util/Functions.js";
import { version } from "../IF.js";

import { Router } from "./Router.js";
import { StateManager } from "./StateManager.js";
import { ViewManager } from "./ViewManager.js";
import { TemplateManager } from "./TemplateManager.js";
import { L18n } from "./L18n.js";

// Global app pool
const apps = {};

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
    constructor( props = {}, settings = {} )
    {
        super( { ...DEFAULT_PROPS, ...props } );

        this.settings = new PropertyObject( { ...DEFAULT_SETTINGS, settings } );

        if ( !this.uid )
        {
            this.uid = createUid();
        }

        // If container property is a string, check if it is a querySelector
        if ( isString( this.container ) )
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
        apps[ this.uid ] = this;

        if ( true === this.settings.sayHello && console )
        {
            console && console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );
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
            this.router.redirect( route );
        }
    }

    async destroy()
    {
    }
}

function getApp( uid = null )
{
    if ( uid && apps.hasOwnProperty( uid ) )
    {
        return apps[ uid ];
    }
    else if ( null === uid &&  Object.keys( apps ) > 0 )
    {
        return apps[ Object.keys( apps )[ 0 ] ];
    }
    else
    {
        return null;
    }
}

async function destroyApp( appToDestroy )
{
    let idx = -1;
    if ( appToDestroy instanceof App )
    {
        idx = apps.findIndex( app => app.uid === appToDestroy.uid );
    }
    else
    {
        let appUid = '' + appToDestroy;
        idx = apps.findIndex( app => app.uid === appUid );
    }

    if ( -1 < idx )
    {
        await apps[ idx ].destroy();
        apps.splice( idx, 1 );
    }
    else
    {
        console && console.warn( `App with UID ${uid} not found.` );
    }
}

export { App, getApp, destroyApp };
