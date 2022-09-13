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

    render( html, element = null )
    {
        const targetContainer = element instanceof HTMLElement ? element : this.rootContainer;
        targetContainer.innerHTML = html;
    }
}

export { ViewManager };
