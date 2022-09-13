import { PropertyObject } from "../base/PropertyObject.js";
import { createUid } from "../util/Functions.js";

import { Router } from "./Router.js";
import { StateManager } from "./StateManager.js";
import { ViewManager } from "./ViewManager.js";
import { TemplateManager } from "./TemplateManager.js";

// Global app pool
const apps = [];

const DEFAULT_PROPS = {
    "uid" : null,
    "title" : "InfrontJS",
    "container" : null
};

const DEFAULT_SETTINGS = {
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

        if ( !this.container || false === this.container instanceof HTMLElement )
        {
            this.container = document.querySelector( 'body' );
        }

        // Init core components
        this.initStateManager();
        this.initViewManager();
        this.initTemplateManager();
        this.initRouter();

        // Add app to global app pool
        apps[ this.uid ] = this;
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

    async run()
    {
        this.viewManager.setWindowTitle( this.title );
        this.router.enable();
    }

    async destroy()
    {
    }
}

function getApp( uid = '' )
{
    if ( uid )
    {
        uid = '' + uid;
        return apps.find( app => app.uid === uid );
    }
    else if ( apps.length > 0 )
    {
        return apps[ 0 ];
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
        console.warn( `App with UID ${uid} not found.` );
    }
}

export { App, getApp, destroyApp };
