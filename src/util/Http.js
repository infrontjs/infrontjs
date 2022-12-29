import { Helper } from "../util/Helper.js";
class Http
{
    constructor( endpoint = '', headers = {} )
    {
        this.endpoint = Helper.trim( endpoint, '/' );
        if ( this.endpoint.length <= 1 )
        {
            throw new Error( 'No endpoint set.' );
        }

        this.headers = new Headers( headers );
    }

    async get( route, cb = null )
    {
        let r = Helper.trim( route, "/" ),
            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "GET" ) );

        return await this._fetch( req, cb );
    }

    async post( route, data = {}, cb = null )
    {
        let r = Helper.trim( route, "/" ),
            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "POST", data ) );
        return await this._fetch( req, cb );
    }

    async delete( route, cb = null )
    {
        let r = Helper.trim( route, "/" ),
            req = new Request( this.endpoint + '/' + r,  this._createFetchOptions( "DELETE" ) );
        return await this._fetch( req, cb );
    }

    async put( route, data = {}, cb = null )
    {
        let r = Helper.trim( route, "/" ),
            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "PUT", data )  );
        return await this._fetch( req, cb );
    }

    async patch( route, data = {}, cb = null )
    {
        let r = Helper.trim( route, "/" ),
            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "PATCH", data ) );
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
