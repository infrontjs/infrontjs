import { Helper } from "../util/Helper.js";

/**
 * Http
 * Simple helper class for http client requests.
 *
 * Note: All http verb functions support callback and await mode.
 *
 * @example <caption>Using callbacks</caption>
 * const apiClient = new Http( 'https://api.example.com' );
 * apiClient.get( '/books', function( err, result ) { } );
 *
 * @example <caption>Using await</caption>
 * const apiClient = new Http( 'https://api.example.com' );
 * try
 * {
 *     const result = apiClient.get( '/books' );
 * }
 * catch( e )
 * {
 *     // Handle error
 * }
 *
 */
class Http
{
    /**
     * Construcotr
     * @param {string} url - Base url
     * @param {object=} headers - Header data.
     */
    constructor( url = '', headers = {} )
    {
        this.url = Helper.trim( url, '/' );
        if ( this.url.length <= 1 )
        {
            throw new Error( 'No endpoint set.' );
        }

        this.headers = new Headers( headers );
    }

    /**
     * GET call
     * @param {string} endpoint - API endpoint
     * @param {function=} [cb=null] - Callback function
     * @returns {Promise<any|undefined>}
     */
    async get( endpoint, cb = null )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "GET" ) );

        return await this._fetch( req, cb );
    }

    /**
     * POST call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - Post data
     * @param {function=} [cb=null] - Callback function
     * @returns {Promise<any|undefined>}
     */
    async post( endpoint, data = {}, cb = null )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "POST", data ) );
        return await this._fetch( req, cb );
    }

    /**
     * DELETE call
     * @param {string} endpoint - API endpoint
     * @param {function=} [cb=null] - Callback function
     * @returns {Promise<any|undefined>}
     */
    async delete( endpoint, cb = null )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r,  this._createFetchOptions( "DELETE" ) );
        return await this._fetch( req, cb );
    }

    /**
     * PUT call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - PUT data
     * @param {function=} [cb=null] - Callback function
     * @returns {Promise<any|undefined>}
     */
    async put( endpoint, data = {}, cb = null )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "PUT", data )  );
        return await this._fetch( req, cb );
    }

    /**
     * PATCH call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - Patch data
     * @param {function=} [cb=null] - Callback function
     * @returns {Promise<any|undefined>}
     */
    async patch( endpoint, data = {}, cb = null )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "PATCH", data ) );
        return await this._fetch( req, cb );
    }

    async _fetch( req, cb = null )
    {
        if ( cb )
        {
            fetch( req )
                .then( response => response.json() )
                .then( json => cb( null, json ) )
                .catch( error => cb( error, null ) );
        }
        else
        {
            const response = await fetch( req );
            const json = await response.json();
            return json;
        }
    }

    _createFetchOptions( method, data = null )
    {
        const opts = {
            "method" : method.toUpperCase(),
            "headers" : this.headers
        };
        if ( Helper.isPlainObject( data ) )
        {
            opts.body = JSON.stringify( data );
        }
        return opts;
    }
}

export { Http };
