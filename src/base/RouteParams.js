class RouteParams
{
    constructor( params = {}, query = {} )
    {
        this._p = params;
        this._q = query;
    }

    getParam( key, defaultValue = null )
    {
        if ( this._p && this._p.hasOwnProperty( key ) )
        {
            return this._p[ key ];
        }
        else
        {
            return defaultValue;
        }
    }

    getQuery( key, defaultValue = null )
    {
        if ( this._q && this._q.hasOwnProperty( key ) )
        {
            return this._q[ key ];
        }
        else
        {
            return defaultValue;
        }
    }
}

export { RouteParams };
