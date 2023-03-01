/**
 * RouteParams
 * The router params of current state call
 */
class RouteParams
{
    /**
     *
     * @param {object} [params={}]
     * @param {object} [query={}]
     */
    constructor( params = {}, query = {} )
    {
        this._p = params;
        this._q = query;
    }

    /**
     * Get param object
     * @returns {Object}
     */
    getParams()
    {
        return this._p;
    }

    /**
     * Get param value by given key. If key does not exists, the defaultValue is returned
     * @param {string} key - Param key
     * @param {*|null} [defaultValue=null] - The default return value if given key does not exists
     * @returns {*|null}
     */
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

    /**
     * Get query value by given key. If key does not exitss, the defaultValue is returned
     * @param {string} key - Query key
     * @param {*|null} [defaultValue=null] - The default return value if given key does not exists
     * @returns {*|null}
     */
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

    /**
     * Get query object
     * @returns {Object}
     */
    getQueries()
    {
        return this._q;
    }
}

export { RouteParams };
