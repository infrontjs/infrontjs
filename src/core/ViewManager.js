class ViewManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this.rootContainer = this.app.container;
    }

    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }
}

export { ViewManager };
