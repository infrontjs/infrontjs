import { trim } from "../util/Functions.js";

class Api
{
    constructor( endpoint = '' )
    {
        this.endpoint = trim( endpoint, '/' );
    }

    async get( route, cb = null )
    {
        let r = trim( route, "/" ),
            req = new Request( this.endpoint + '/' + route, { method: 'GET' } ),
            res = null;

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
}

export { Api };
