class ViewManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
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
