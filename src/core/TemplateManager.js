class TemplateManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this._cache = [];
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

    async renderTemplate( templateUrl, element = null )
    {
        let html = await this.fetchTemplate( templateUrl );
        this.app.viewManager.render( html, element );
    }
}

export { TemplateManager };
