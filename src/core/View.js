import { compile, render } from "./../_external/ejs/ejs.js";

/**
 * View
 * Template rendering system using EJS (Embedded JavaScript) templates.
 * Provides automatic injection of localization helpers and efficient DOM updates.
 *
 * @class
 *
 * @example
 * // Basic template rendering
 * app.view.render(container, `
 *     <h1>Welcome <%= username %></h1>
 *     <p><%= _lcs('greeting') %></p>
 * `, { username: 'John' });
 *
 * @example
 * // With localization helpers
 * app.view.render(container, `
 *     <h1><%= _lcs('welcome', { name: username }) %></h1>
 *     <p>Price: <%= _lcn(price, { style: 'currency', currency: 'USD' }) %></p>
 *     <time><%= _lcd(date, { dateStyle: 'long' }) %></time>
 * `, { username: 'John', price: 29.99, date: new Date() });
 *
 * @example
 * // Pre-compile templates for performance
 * const template = app.view.compile(`<h1><%= title %></h1>`);
 * // Later, use compiled template multiple times
 * const html1 = template({ title: 'Page 1' });
 * const html2 = template({ title: 'Page 2' });
 */
class View
{
    /**
     * Create a new View instance
     *
     * @constructor
     * @param {App} appInstance - Reference to the parent App instance
     */
    constructor( appInstance )
    {
        /**
         * Parent app instance
         * @type {App}
         */
        this.app = appInstance;

        /**
         * Global data available to all templates
         * @type {Object}
         */
        this.globalViewData = {};
    }

    /**
     * Set the browser window title
     *
     * @param {string} title - Title to set
     *
     * @example
     * app.view.setWindowTitle('My App - Dashboard');
     *
     * @example
     * // In state onEnter
     * async onEnter() {
     *     this.app.view.setWindowTitle(`User Profile - ${userName}`);
     * }
     */
    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }

    /**
     * Compile an EJS template into a reusable function
     * Useful for templates that will be rendered multiple times.
     *
     * @param {string} template - EJS template string
     * @param {object} [opts=null] - EJS compiler options
     * @param {boolean} [opts.client=false] - Generate standalone client function
     * @param {string} [opts.filename] - Used by cache to key caches
     * @param {boolean} [opts.strict=false] - Use strict mode
     * @returns {Function} Compiled template function that accepts data object
     *
     * @see {@link https://ejs.co/#docs}
     *
     * @example
     * // Compile once, use many times
     * const userCard = app.view.compile(`
     *     <div class="user-card">
     *         <h3><%= name %></h3>
     *         <p><%= email %></p>
     *     </div>
     * `);
     *
     * const html1 = userCard({ name: 'John', email: 'john@example.com' });
     * const html2 = userCard({ name: 'Jane', email: 'jane@example.com' });
     */
    compile( template, opts )
    {
        return compile( template, opts );
    }

    /**
     * Generate HTML string from template and data without rendering to DOM
     *
     * @param {string} tmpl - EJS template string
     * @param {object} [data={}] - Template data
     * @param {object} [tmplOptions=null] - EJS rendering options
     * @returns {string} Rendered HTML string
     *
     * @example
     * // Get HTML for manual insertion
     * const html = app.view.getHtml(`<h1><%= title %></h1>`, { title: 'Hello' });
     * console.log(html); // '<h1>Hello</h1>'
     *
     * @example
     * // Use in AJAX response
     * const itemHtml = app.view.getHtml(itemTemplate, itemData);
     * fetch('/api/items', {
     *     method: 'POST',
     *     body: JSON.stringify({ html: itemHtml })
     * });
     */
    getHtml( tmpl, data = {}, tmplOptions = null )
    {
        return render( tmpl, this.createData( data ), tmplOptions );
    }

    /**
     * Render template with data directly to a DOM container
     * Automatically injects localization helpers (_lcs, _lcn, _lcd) into template data.
     *
     * @param {HTMLElement} container - Container element to render into
     * @param {string} tmpl - EJS template string
     * @param {object} [data={}] - Template data variables
     * @param {object} [tmplOptions=null] - EJS rendering options
     *
     * @throws {Error} If container is not an HTMLElement
     *
     * @example
     * // Simple rendering
     * app.view.render(this.app.container, `
     *     <h1>Hello <%= name %></h1>
     * `, { name: 'World' });
     *
     * @example
     * // With loops and conditions
     * app.view.render(container, `
     *     <ul>
     *     <% users.forEach(user => { %>
     *         <li><%= user.name %> - <%= user.email %></li>
     *     <% }); %>
     *     </ul>
     *     <% if (users.length === 0) { %>
     *         <p>No users found</p>
     *     <% } %>
     * `, { users: userList });
     *
     * @example
     * // Using localization helpers (auto-injected)
     * app.view.render(container, `
     *     <h1><%= _lcs('welcome') %></h1>
     *     <p><%= _lcs('greeting', { name: userName }) %></p>
     *     <span><%= _lcn(price, { style: 'currency', currency: 'EUR' }) %></span>
     *     <time><%= _lcd(date, { dateStyle: 'medium' }) %></time>
     * `, { userName: 'John', price: 99.99, date: new Date() });
     */
    render( container, tmpl, data = {}, tmplOptions = null )
    {
        const html = this.getHtml( tmpl, data, tmplOptions );
        this.renderHtml( container, html );
    }

    /**
     * Render pre-generated HTML string directly to a container
     * Uses replaceChildren() for efficient DOM updates.
     *
     * @param {HTMLElement} container - Container element to render into
     * @param {string} html - Pre-generated HTML string
     *
     * @throws {Error} If container is not an HTMLElement
     *
     * @example
     * // Render pre-generated HTML
     * const html = '<h1>Hello</h1><p>World</p>';
     * app.view.renderHtml(container, html);
     *
     * @example
     * // Combined with getHtml
     * const html = app.view.getHtml(template, data);
     * app.view.renderHtml(container, html);
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
