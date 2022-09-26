/**
 * Refer to:
 * https://github.com/lodash/lodash/blob/master/isPlainObject.js
 * @param value
 * @returns {boolean}
 */
function isPlainObject( value )
{
    if ( !_isObjectLike( value ) || _getTag( value ) != '[object Object]' )
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
 * Checks if given value is string
 *
 * @param {*} v Value to check
 * @returns {boolean}
 */
function isString( v )
{
    return ( typeof v === 'string' || v instanceof String );
}

/**
 * Checks if given value is a class constructor
 * Refer:
 * https://stackoverflow.com/questions/30758961/how-to-check-if-a-variable-is-an-es6-class-declaration
 * @param v
 * @returns {boolean}
 */
function isClass( v )
{
    return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

function isClassChildOf( classContructor, parentClassName )
{
    let ret = false,
        regexEnd = new RegExp( 'function ()', "gm" ),
        regex = new RegExp( `class ${parentClassName}`, "gm" );

    while ( ret === false && null === regexEnd.exec( Object.getPrototypeOf( classContructor ).toString() ) )
    {
        if ( null !== regex.exec( Object.getPrototypeOf( classContructor ).toString() ) )
        {
            ret = true;
        }
        else
        {
            classContructor = Object.getPrototypeOf( classContructor );
        }
    }

    return ret;
}

function createUid()
{
    return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, c =>
        ( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> c / 4 ).toString( 16 )
    );
}

function trim( str, characters, flags )
{
    characters = characters || " ";
    flags = flags || "g";
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

function serializeForm( form )
{
    var object = {};
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



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start: private methods

/**
 * Refer to:
 * https://github.com/lodash/lodash/blob/master/isObjectLike.js
 *
 * @param value
 * @returns {boolean}
 */
function _isObjectLike( value )
{
    return typeof value === 'object' && value !== null
}

/**
 * Refer to:
 * https://github.com/lodash/lodash/blob/master/.internal/getTag.js
 *
 * @param value
 * @returns {string|string}
 */
function _getTag( value )
{
    if ( value == null )
    {
        return value === undefined ? '[object Undefined]' : '[object Null]'
    }
    return Object.prototype.toString.call( value );
}

// stop: private methods
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export { trim, createUid, isPlainObject, isString, isClass, isClassChildOf, serializeForm };
