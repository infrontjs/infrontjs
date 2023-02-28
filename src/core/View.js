import { compile, render } from "./../_external/ejs/ejs.js";
import { Helper } from "../util/Helper.js";
import { DiffDOM, nodeToObj } from "../_external/diffDOM/index.js";

/**
 * View
 * Provides management and rendering of ejs templates including DOM diffing.
 * @namespace core
 */
class View
{
    constructor( appInstance )
    {
        this.app = appInstance;

        this.basePath = this.app.settings.get( "templateManager.basePath", null );
        if ( null !== this.basePath )
        {
            this.basePath = this.app.router.basePath + "/" + Helper.trim( this.basePath, "/" );
        }
        else
        {
            this.basePath = this.app.router.basePath;
        }

        this._cache = [];
        this.dd = new DiffDOM();
    }

    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }

    compile( template, opts )
    {
        return compile( template, opts );
    }

    /**
     *
     * @param {HTMLElement|null} container - Container in which template should be rendered
     * @param {string} tmpl - EJS template string
     * @param {object=} [data={}] - Template data.
     * @param {boolean} [forceRepaint=false] - If false, DOM diffing is enabled.
     * @returns {undefined|string} - If container is undefined|null, the rendered html is returned.
     */
    render( container, tmpl, data = {}, forceRepaint = false )
    {
        const html = render( tmpl, data );
        if ( !container || false === ( container instanceof HTMLElement ) )
        {
            return html;
        }
        else
        {
            if ( true === forceRepaint )
            {
                container.innerHTML = html;
            }
            else
            {
                let outDiv = container.querySelector( 'div:first-child' );
                if ( !outDiv )
                {
                    container.innerHTML = '<div></div>';
                    outDiv = container.querySelector( 'div:first-child' );
                }

                const newDiv = document.createElement( 'div' );
                newDiv.innerHTML = html;

                this.dd.apply(
                    outDiv,
                    this.dd.diff(
                        nodeToObj( outDiv ),
                        nodeToObj( newDiv )
                    )
                );
            }
        }
    }

    async load( templateUrl, useCache = true )
    {
        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
        if ( !tmplHtml )
        {
            const response = await fetch( null === this.basePath ? templateUrl : `/${this.basePath}/${Helper.trim( templateUrl, '/' )}` );
            if ( response.status > 399 )
            {
                throw new Error( `${response.status}: ${response.statusText}`);
            }
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

    _getTemplateFromCache( templateUrl )
    {
        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
        if ( cachedTemplate )
        {
            return cachedTemplate.html;
        }
    }
}

export { View };
