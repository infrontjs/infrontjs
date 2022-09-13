class Configuration
{
    constructor( global = {}, local = {} )
    {
        this._config = { ...global, ...local };
    }

    get( key, defValue = null )
    {
        if ( -1 < key.indexOf( '.') )
        {
            return key.split('.').reduce(function(prev, curr) {
                return prev ? prev[curr] : defValue
            }, this._config );
        }

        else if ( this._config.hasOwnProperty( key ) )
        {
            return this._config[ key ];
        }
        else
        {
            return defValue;
        }
    }
}

export { Configuration };
