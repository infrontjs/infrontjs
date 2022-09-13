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

export { trim, createUid, isPlainObject };
