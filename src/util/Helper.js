import { ObservableSlim } from "../_external/observableSlim/ObservableSlim.js";

/**
 * Helper class provides static helper functions.
 */
class Helper
{
    /**
     *
     * @param {string} str String to trim
     * @param {string|undefined} characters Characters to trim. Default is empty space.
     * @param {string|undefined} flags RegExp flag. Default is "g"
     * @returns {string}
     */
    static trim ( str, characters = " ", flags = "g" )
    {
        if (typeof str !== "string" || typeof characters !== "string" || typeof flags !== "string")
        {
            throw new TypeError("argument must be string");
        }

        if (!/^[gi]*$/.test(flags))
        {
            throw new TypeError("Invalid flags supplied '" + flags.match(new RegExp("[^gi]*")) + "'");
        }

        characters = characters.replace(/[\[\](){}?*+\^$\\.|\-]/g, "\\$&");

        return str.replace(new RegExp("^[" + characters + "]+|[" + characters + "]+$", flags), '');
    }

    /**
     * Serialize given from
     * @param {HTMLFormElement} form - The form element to serialize
     * @returns {object} - Plain javascript object containing the name and value of given form.
     */
    static serializeForm( form )
    {
        // todo - check for disabled form elements which cannot be resolved and show an info/warning
        const object = {};
        new FormData( form ).forEach(( value, key) =>
        {
            // Reflect.has in favor of: object.hasOwnProperty(key)
            if( !Reflect.has( object, key ) )
            {
                object[ key ] = value;
                return;
            }

            if( !Array.isArray( object[ key ] ) )
            {
                object[ key ] = [ object[ key ] ];
            }

            object[ key ].push( value );
        });
        return object;
    }

    /**
     * Creates an unique ID
     * @returns {string}
     * @throws {Error} - If crypto module is not available
     */
    static createUid()
    {
        if ( typeof crypto === 'undefined'  )
        {
            throw new Error( 'Crypto is not available.' );
        }

        return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, c =>
            ( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> c / 4 ).toString( 16 )
        );
    }

    /**
     * Checks if given value is string
     *
     * @param {*} v - Value to check
     * @returns {boolean}
     */
    static isString( v )
    {
        return ( typeof v === 'string' || v instanceof String );
    }

    /**
     * Checks if given value is an array or not
     *
     * @param {*} v - Value to check
     * @returns {boolean}
     */
    static isArray( v )
    {
        return Array.isArray( v );
    }

    /**
     * Checks if given value is a plain object
     *
     * @see {@link https://github.com/lodash/lodash/blob/master/isPlainObject.js}
     * @param value
     * @returns {boolean}
     */
    static isPlainObject( value )
    {
        if ( !Helper._isObjectLike( value ) || Helper._getTag( value ) != '[object Object]' )
        {
            return false
        }

        if ( Object.getPrototypeOf( value ) === null )
        {
            return true
        }

        let proto = value
        while ( Object.getPrototypeOf( proto ) !== null)
        {
            proto = Object.getPrototypeOf(proto)
        }

        return Object.getPrototypeOf( value ) === proto
    }

    /**
     * Checks if given value is a class constructor
     *
     * @see {@link https://stackoverflow.com/questions/30758961/how-to-check-if-a-variable-is-an-es6-class-declaration}
     * @param v
     * @returns {boolean}
     */
    static isClass( v )
    {
        return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
    }

    /**
     * Deep merges two objects into target
     *
     * @param {Object} target
     * @param {Object} sources
     * @return {Object}
     * @example
     *
     * const merged = mergeDeep({a: 1}, { b : { c: { d: { e: 12345}}}});
     * // => { a: 1, b: { c: { d: [Object] } } }
     */
    static deepMerge( target, ...sources )
    {
        if (!sources.length) return target;
        const source = sources.shift();

        if ( Helper.isPlainObject( target ) && Helper.isPlainObject( source ) )
        {
            for ( const key in source )
            {
                if ( Helper.isPlainObject( source[ key ] ) )
                {
                    if ( !target[ key ] ) Object.assign( target, { [key]: {} } );
                    Helper.deepMerge( target[ key ], source[ key ] );
                }
                else
                {
                    Object.assign( target, { [key]: source[key] });
                }
            }
        }

        return Helper.deepMerge( target, ...sources );
    }

    /**
     * Create an observable object
     *
     * @param {function=} onChange - Callback triggered on change. Default is undefined.
     * @param {object=} objReference - Referenced object which will be transformed to an observable. Default is an empty new object.
     * @param {boolean=} batchUpDelay - Flag defining if change events are batched up for 10ms before being triggered. Default is true.
     * @returns {ProxyConstructor}
     */
    static createObservable( onChange = undefined, objReference = {}, batchUpDelay = true )
    {
        return ObservableSlim.create(
            objReference,
            batchUpDelay,
            onChange
        );
    }

    // Refer to:
    // https://github.com/lodash/lodash/blob/master/isObjectLike.js
    static _isObjectLike( value )
    {
        return typeof value === 'object' && value !== null
    }


    // Refer to:
    // https://github.com/lodash/lodash/blob/master/.internal/getTag.js
    static _getTag( value )
    {
        if ( value == null )
        {
            return value === undefined ? '[object Undefined]' : '[object Null]'
        }
        return Object.prototype.toString.call( value );
    }
}

export { Helper };
