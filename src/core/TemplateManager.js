import { DiffDOM, nodeToObj } from './../_external/diffDOM/index.js';
import { _template, _extendedFunctions } from "../_external/micro-template/micro-template.js";

class TemplateManager
{
    // @todo Think about a templateRootDirectory
    constructor( appInstance )
    {
        this.app = appInstance;
        this._cache = [];
        this.dd = new DiffDOM();
    }

    _getTemplateFromCache( templateUrl )
    {
        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
        if ( cachedTemplate )
        {
            return cachedTemplate.html;
        }
    }

    addTemplateFunction( name, fn )
    {
        // @todo Add Check of type function
        _extendedFunctions[ name ] = fn;
    }

    removeTemplateFunction( name )
    {
        if ( _extendedFunctions.hasOwnProperty( name ) )
        {
            delete _extendedFunctions[ name ];
        }
    }

    compile( tmpl, data = {} )
    {
        return _template( tmpl, data );
    }

    // rename to render
    render( htmlElement, tmpl, data = {}, forceRepaint = false )
    {
        if ( !htmlElement || false === ( htmlElement instanceof HTMLElement ) )
        {
            throw new Error( 'First parameter is no valid HTMLElement.' );
        }

        if ( true === forceRepaint )
        {
            htmlElement.innerHTML = this.compile( tmpl, data );
        }
        else
        {
            let outDiv = htmlElement.querySelector( 'div:first-child' );
            if ( !outDiv )
            {
                htmlElement.innerHTML = '<div></div>';
                outDiv = htmlElement.querySelector( 'div:first-child' );
            }

            const newDiv = document.createElement( 'div' );
            newDiv.innerHTML = this.compile( tmpl, data );

            this.dd.apply(
                outDiv,
                this.dd.diff(
                    nodeToObj( outDiv ),
                    nodeToObj( newDiv )
                )
            );
        }
    }

    renderHtml( htmlElement, html )
    {
        if ( !htmlElement || false === ( htmlElement instanceof HTMLElement ) )
        {
            throw new Error( 'First parameter is no valid HTMLElement.' );
        }

        htmlElement.innerHTML = html;
    }

    async load( templateUrl, useCache = true )
    {
        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
        if ( !tmplHtml )
        {
            const response = await fetch( templateUrl );
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
}

export { TemplateManager };
