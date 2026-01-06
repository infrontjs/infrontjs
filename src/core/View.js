import { compile, render } from "./../_external/ejs/ejs.js";

/**
 * View
 * Provides management and rendering of ejs templates including DOM diffing.
 */
class View
{
    /**
     * Constructor
     * @param {App} appInstance - App reference
     */
    constructor( appInstance )
    {
        this.app = appInstance;
        this.globalViewData = {};
    }

    /**
     * Sets window title
     * @param {string} title - Title to set
     */
    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }

    /**
     * Compiles template with given options
     * @param {string} template - EJS based template
     * @param {object} opts - EJS template options. @see {@link https://ejs.co/#docs}
     * @returns {*} - Compiled template function
     */
    compile( template, opts )
    {
        return compile( template, opts );
    }

    /**
     * Generate HTML from given template string and data
     * @param tmpl
     * @param data
     * @param tmplOptions
     * @returns {string} - Generated HTML
     */
    getHtml( tmpl, data = {}, tmplOptions = null )
    {
        return render( tmpl, this.createData( data ), tmplOptions );
    }

    /**
     * Renders template with given data to html container.
     *
     * @param {HTMLElement|null} container - Container in which template should be rendered.
     * @param {string} tmpl - EJS template string
     * @param {object=} [data={}] - Template data.
     * @param {boolean} [forceRepaint=false] - If false, DOM diffing is enabled.
     * @param {object=} [tmplOptions=null] - EJS template options. @see {@link https://ejs.co/#docs}
     */
    render( container, tmpl, data = {}, forceRepaint = false, tmplOptions = null )
    {
        const html = this.getHtml( tmpl, data, tmplOptions );
        this.renderHtml( container, html );
    }

    /**
     *
     * @param {HTMLElement|null} container - Container in which template should be rendered.
     * @param {string} html - HTML string to be rendered
     */
    renderHtml( container, html )
    {
        if ( !container || false === ( container instanceof HTMLElement ) )
        {
            throw new Error( 'Invalid container. Given container must be an instance of an HTMLElement.' );
        }

        const temp = document.createElement('div');
        temp.innerHTML = html;
        container.replaceChildren(...temp.childNodes);
    }

    createData( data = {} )
    {
        if ( data.hasOwnProperty( '_lcs' ) )
        {
            console.warn( '_lcs already exists in template data.' );
        }
        else
        {
            data[ '_lcs' ] = this.app.l18n.t.bind( this.app.l18n );
        }

        if ( data.hasOwnProperty( '_lcn' ) )
        {
            console.warn( '_lcn already exists in template data.' );
        }
        else
        {
            data[ '_lcn' ] = this.app.l18n.n.bind( this.app.l18n );
        }

        if ( data.hasOwnProperty( '_lcd' ) )
        {
            console.warn( '_lcd already exists in template data.' );
        }
        else
        {
            data[ '_lcd' ] = this.app.l18n.d.bind( this.app.l18n );
        }

        const gvdKeys = Object.keys( this.globalViewData );
        for ( let gi = 0; gi < gvdKeys.length; gi++ )
        {
            if ( data.hasOwnProperty( gvdKeys[ gi ] ) )
            {
                console.warn( `The globalViewData entry ${gvdKeys[ gi ]} already exists in template data.` );
            }
            else
            {
                data[ gvdKeys[ gi ] ] = this.globalViewData[ gvdKeys[ gi ] ];
            }
        }

        return data;
    }
}

export { View };
