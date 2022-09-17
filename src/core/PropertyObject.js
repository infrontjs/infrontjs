import { isPlainObject } from "../util/Functions.js";

class PropertyObject
{
    constructor( props = {} )
    {
        if ( false === isPlainObject( props ) )
        {
            throw new Error( 'PropertyObject expects a plain object.' );
        }

        this._props = props;

        for ( let field in this._props )
        {
            Object.defineProperty(
                this,
                field,
                {
                    get : function()
                    {
                        return this._props[ field ];
                    },
                    set : function( newValue )
                    {
                        // @todo Trigger propertyChange event
                        this._props[ field ] = newValue;
                    }
                }
            );
        }
    }

    getPropertyValue( key, defValue = null )
    {
        if ( -1 < key.indexOf( '.') )
        {
            return key.split('.').reduce(function(prev, curr) {
                return prev ? prev[curr] : defValue
            }, this._props );
        }

        else if ( this._props.hasOwnProperty( key ) )
        {
            return this._props[ key ];
        }
        else
        {
            return defValue;
        }
    }
}

export { PropertyObject };
