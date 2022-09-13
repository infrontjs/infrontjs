class ViewManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this.rootContainer = this.app.container;
        this._cache = [];
    }

    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }

    _getTemplateFromCache( templateUrl )
    {
        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
        if ( cachedTemplate )
        {
            return cachedTemplate.html;
        }
    }

    async fetchTemplate( templateUrl, useCache = true )
    {
        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
        if ( !tmplHtml )
        {
            const response = await fetch( templateUrl );
            tmplHtml = await response.text();
            this._cache.push(
                {
                    url : templateUrl,
                    html : tmplHtml
                }
            );
        }
        return tmplHtml;
    }

    render( html, element = null )
    {
        const targetContainer = element instanceof HTMLElement ? element : this.rootContainer;
        targetContainer.innerHTML = html;
    }

    async renderTemplate( templateUrl, element = null )
    {
        let html = await this.fetchTemplate( templateUrl );
        this.render( html, element );
    }
}

export { ViewManager };
