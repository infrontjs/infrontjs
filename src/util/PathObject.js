import { get, set } from "./../_external/lodash/lodash-extract.js";

class PathObject
{
    constructor( properties = {} )
    {
        this._props = properties;
    }

    /**
     * Taken from lodash.
     * Refer to:
     * https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L13126
     *
     * Gets the value at `path` of `object`. If the resolved value is
     * `undefined`, the `defaultValue` is returned in its place.
     *
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values. Default is null
     * @returns {*} Returns the resolved value.
     * @example
     *
     * const pathObject = new PathObject( { 'a': [{ 'b': { 'c': 3 } }] } );
     *
     * pathObject.get('a[0].b.c');
     * // => 3
     *
     * pathObject.get(['a', '0', 'b', 'c']);
     * // => 3
     *
     * pathObject.get('a.b.c', 'default');
     * // => 'default'
     */
    get( path, defaultValue = null )
    {
        return get( this._props, path, defaultValue );
    }

    /**
     * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
     * it's created. Arrays are created for missing index properties while objects
     * are created for all other missing properties. Use `_.setWith` to customize
     * `path` creation.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, ['x', '0', 'y', 'z'], 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    set( path, value )
    {
        return set( this._props, path, value );
    }
}

export { PathObject };
