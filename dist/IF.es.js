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

    let proto = value;
    while ( Object.getPrototypeOf( proto ) !== null)
    {
        proto = Object.getPrototypeOf(proto);
    }

    return Object.getPrototypeOf( value ) === proto
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

class Api
{
    constructor( endpoint = '' )
    {
        this.endpoint = trim( endpoint, '/' );
    }

    async get( route, cb = null )
    {
        trim( route, "/" );
            let req = new Request( this.endpoint + '/' + route, { method: 'GET' } );

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

class State
{
    constructor( app, routeParams )
    {
        this.app = app;
        this.routeParams = routeParams;
    }

    canEnter()
    {
        return true;
    }

    enter()
    {
    }

    exit()
    {
    }
}

// Generated by CoffeeScript 1.10.0

function UP() {
    var slice = [].slice;
    var P, UrlPattern, astNodeContainsSegmentsForProvidedParams, astNodeToNames, astNodeToRegexString, baseAstNodeToRegexString, concatMap, defaultOptions, escapeForRegex, getParam, keysAndValuesToObject, newParser, regexGroupCount, stringConcatMap, stringify;
    escapeForRegex = function(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    concatMap = function(array, f) {
        var i, length, results;
        results = [];
        i = -1;
        length = array.length;
        while (++i < length) {
            results = results.concat(f(array[i]));
        }
        return results;
    };
    stringConcatMap = function(array, f) {
        var i, length, result;
        result = '';
        i = -1;
        length = array.length;
        while (++i < length) {
            result += f(array[i]);
        }
        return result;
    };
    regexGroupCount = function(regex) {
        return (new RegExp(regex.toString() + '|')).exec('').length - 1;
    };
    keysAndValuesToObject = function(keys, values) {
        var i, key, length, object, value;
        object = {};
        i = -1;
        length = keys.length;
        while (++i < length) {
            key = keys[i];
            value = values[i];
            if (value == null) {
                continue;
            }
            if (object[key] != null) {
                if (!Array.isArray(object[key])) {
                    object[key] = [object[key]];
                }
                object[key].push(value);
            } else {
                object[key] = value;
            }
        }
        return object;
    };
    P = {};
    P.Result = function(value, rest) {
        this.value = value;
        this.rest = rest;
    };
    P.Tagged = function(tag, value) {
        this.tag = tag;
        this.value = value;
    };
    P.tag = function(tag, parser) {
        return function(input) {
            var result, tagged;
            result = parser(input);
            if (result == null) {
                return;
            }
            tagged = new P.Tagged(tag, result.value);
            return new P.Result(tagged, result.rest);
        };
    };
    P.regex = function(regex) {
        return function(input) {
            var matches, result;
            matches = regex.exec(input);
            if (matches == null) {
                return;
            }
            result = matches[0];
            return new P.Result(result, input.slice(result.length));
        };
    };
    P.sequence = function() {
        var parsers;
        parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return function(input) {
            var i, length, parser, rest, result, values;
            i = -1;
            length = parsers.length;
            values = [];
            rest = input;
            while (++i < length) {
                parser = parsers[i];
                result = parser(rest);
                if (result == null) {
                    return;
                }
                values.push(result.value);
                rest = result.rest;
            }
            return new P.Result(values, rest);
        };
    };
    P.pick = function() {
        var indexes, parsers;
        indexes = arguments[0], parsers = 2 <= arguments.length ? slice.call(arguments, 1) : [];
        return function(input) {
            var array, result;
            result = P.sequence.apply(P, parsers)(input);
            if (result == null) {
                return;
            }
            array = result.value;
            result.value = array[indexes];
            return result;
        };
    };
    P.string = function(string) {
        var length;
        length = string.length;
        return function(input) {
            if (input.slice(0, length) === string) {
                return new P.Result(string, input.slice(length));
            }
        };
    };
    P.lazy = function(fn) {
        var cached;
        cached = null;
        return function(input) {
            if (cached == null) {
                cached = fn();
            }
            return cached(input);
        };
    };
    P.baseMany = function(parser, end, stringResult, atLeastOneResultRequired, input) {
        var endResult, parserResult, rest, results;
        rest = input;
        results = stringResult ? '' : [];
        while (true) {
            if (end != null) {
                endResult = end(rest);
                if (endResult != null) {
                    break;
                }
            }
            parserResult = parser(rest);
            if (parserResult == null) {
                break;
            }
            if (stringResult) {
                results += parserResult.value;
            } else {
                results.push(parserResult.value);
            }
            rest = parserResult.rest;
        }
        if (atLeastOneResultRequired && results.length === 0) {
            return;
        }
        return new P.Result(results, rest);
    };
    P.many1 = function(parser) {
        return function(input) {
            return P.baseMany(parser, null, false, true, input);
        };
    };
    P.concatMany1Till = function(parser, end) {
        return function(input) {
            return P.baseMany(parser, end, true, true, input);
        };
    };
    P.firstChoice = function() {
        var parsers;
        parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return function(input) {
            var i, length, parser, result;
            i = -1;
            length = parsers.length;
            while (++i < length) {
                parser = parsers[i];
                result = parser(input);
                if (result != null) {
                    return result;
                }
            }
        };
    };
    newParser = function(options) {
        var U;
        U = {};
        U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));
        U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(function() {
            return U.pattern;
        }), P.string(options.optionalSegmentEndChar)));
        U.name = P.regex(new RegExp("^[" + options.segmentNameCharset + "]+"));
        U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(function() {
            return U.name;
        })));
        U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));
        U["static"] = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(function() {
            return U.escapedChar;
        }), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));
        U.token = P.lazy(function() {
            return P.firstChoice(U.wildcard, U.optional, U.named, U["static"]);
        });
        U.pattern = P.many1(P.lazy(function() {
            return U.token;
        }));
        return U;
    };
    defaultOptions = {
        escapeChar: '\\',
        segmentNameStartChar: ':',
        segmentValueCharset: 'a-zA-Z0-9-_~ %',
        segmentNameCharset: 'a-zA-Z0-9',
        optionalSegmentStartChar: '(',
        optionalSegmentEndChar: ')',
        wildcardChar: '*'
    };
    baseAstNodeToRegexString = function(astNode, segmentValueCharset) {
        if (Array.isArray(astNode)) {
            return stringConcatMap(astNode, function(node) {
                return baseAstNodeToRegexString(node, segmentValueCharset);
            });
        }
        switch (astNode.tag) {
            case 'wildcard':
                return '(.*?)';
            case 'named':
                return "([" + segmentValueCharset + "]+)";
            case 'static':
                return escapeForRegex(astNode.value);
            case 'optional':
                return '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?';
        }
    };
    astNodeToRegexString = function(astNode, segmentValueCharset) {
        if (segmentValueCharset == null) {
            segmentValueCharset = defaultOptions.segmentValueCharset;
        }
        return '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$';
    };
    astNodeToNames = function(astNode) {
        if (Array.isArray(astNode)) {
            return concatMap(astNode, astNodeToNames);
        }
        switch (astNode.tag) {
            case 'wildcard':
                return ['_'];
            case 'named':
                return [astNode.value];
            case 'static':
                return [];
            case 'optional':
                return astNodeToNames(astNode.value);
        }
    };
    getParam = function(params, key, nextIndexes, sideEffects) {
        var index, maxIndex, result, value;
        if (sideEffects == null) {
            sideEffects = false;
        }
        value = params[key];
        if (value == null) {
            if (sideEffects) {
                throw new Error("no values provided for key `" + key + "`");
            } else {
                return;
            }
        }
        index = nextIndexes[key] || 0;
        maxIndex = Array.isArray(value) ? value.length - 1 : 0;
        if (index > maxIndex) {
            if (sideEffects) {
                throw new Error("too few values provided for key `" + key + "`");
            } else {
                return;
            }
        }
        result = Array.isArray(value) ? value[index] : value;
        if (sideEffects) {
            nextIndexes[key] = index + 1;
        }
        return result;
    };
    astNodeContainsSegmentsForProvidedParams = function(astNode, params, nextIndexes) {
        var i, length;
        if (Array.isArray(astNode)) {
            i = -1;
            length = astNode.length;
            while (++i < length) {
                if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
                    return true;
                }
            }
            return false;
        }
        switch (astNode.tag) {
            case 'wildcard':
                return getParam(params, '_', nextIndexes, false) != null;
            case 'named':
                return getParam(params, astNode.value, nextIndexes, false) != null;
            case 'static':
                return false;
            case 'optional':
                return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
        }
    };
    stringify = function(astNode, params, nextIndexes) {
        if (Array.isArray(astNode)) {
            return stringConcatMap(astNode, function(node) {
                return stringify(node, params, nextIndexes);
            });
        }
        switch (astNode.tag) {
            case 'wildcard':
                return getParam(params, '_', nextIndexes, true);
            case 'named':
                return getParam(params, astNode.value, nextIndexes, true);
            case 'static':
                return astNode.value;
            case 'optional':
                if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
                    return stringify(astNode.value, params, nextIndexes);
                } else {
                    return '';
                }
        }
    };
    UrlPattern = function(arg1, arg2) {
        var groupCount, options, parsed, parser, withoutWhitespace;
        if (arg1 instanceof UrlPattern) {
            this.isRegex = arg1.isRegex;
            this.regex = arg1.regex;
            this.ast = arg1.ast;
            this.names = arg1.names;
            return;
        }
        this.isRegex = arg1 instanceof RegExp;
        if (!(('string' === typeof arg1) || this.isRegex)) {
            throw new TypeError('argument must be a regex or a string');
        }
        if (this.isRegex) {
            this.regex = arg1;
            if (arg2 != null) {
                if (!Array.isArray(arg2)) {
                    throw new Error('if first argument is a regex the second argument may be an array of group names but you provided something else');
                }
                groupCount = regexGroupCount(this.regex);
                if (arg2.length !== groupCount) {
                    throw new Error("regex contains " + groupCount + " groups but array of group names contains " + arg2.length);
                }
                this.names = arg2;
            }
            return;
        }
        if (arg1 === '') {
            throw new Error('argument must not be the empty string');
        }
        withoutWhitespace = arg1.replace(/\s+/g, '');
        if (withoutWhitespace !== arg1) {
            throw new Error('argument must not contain whitespace');
        }
        options = {
            escapeChar: (arg2 != null ? arg2.escapeChar : void 0) || defaultOptions.escapeChar,
            segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : void 0) || defaultOptions.segmentNameStartChar,
            segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : void 0) || defaultOptions.segmentNameCharset,
            segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : void 0) || defaultOptions.segmentValueCharset,
            optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : void 0) || defaultOptions.optionalSegmentStartChar,
            optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : void 0) || defaultOptions.optionalSegmentEndChar,
            wildcardChar: (arg2 != null ? arg2.wildcardChar : void 0) || defaultOptions.wildcardChar
        };
        parser = newParser(options);
        parsed = parser.pattern(arg1);
        if (parsed == null) {
            throw new Error("couldn't parse pattern");
        }
        if (parsed.rest !== '') {
            throw new Error("could only partially parse pattern");
        }
        this.ast = parsed.value;
        this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
        this.names = astNodeToNames(this.ast);
    };
    UrlPattern.prototype.match = function(url) {
        var groups, match;
        match = this.regex.exec(url);
        if (match == null) {
            return null;
        }
        groups = match.slice(1);
        if (this.names) {
            return keysAndValuesToObject(this.names, groups);
        } else {
            return groups;
        }
    };
    UrlPattern.prototype.stringify = function(params) {
        if (params == null) {
            params = {};
        }
        if (this.isRegex) {
            throw new Error("can't stringify patterns generated from a regex");
        }
        if (params !== Object(params)) {
            throw new Error("argument must be an object or undefined");
        }
        return stringify(this.ast, params, {});
    };
    UrlPattern.escapeForRegex = escapeForRegex;
    UrlPattern.concatMap = concatMap;
    UrlPattern.stringConcatMap = stringConcatMap;
    UrlPattern.regexGroupCount = regexGroupCount;
    UrlPattern.keysAndValuesToObject = keysAndValuesToObject;
    UrlPattern.P = P;
    UrlPattern.newParser = newParser;
    UrlPattern.defaultOptions = defaultOptions;
    UrlPattern.astNodeToRegexString = astNodeToRegexString;
    UrlPattern.astNodeToNames = astNodeToNames;
    UrlPattern.getParam = getParam;
    UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
    UrlPattern.stringify = stringify;
    return UrlPattern;
}
const UrlPattern = new UP();

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

class Router
{
    static ACTION_TYPE_FUNCTION = "function";
    static ACTION_TYPE_STATE = "state";

    constructor( appInstance )
    {
        this._routeActions = [];
        this.app = appInstance;
        this.isEnabled = false;
        this.previousRoute = null;
        this.currentRoute = null;
    }

    // Add third optional param called isIndexAction to be triggered, when route is empty
    addRoute( route, action )
    {
        let sRoute = trim( route, '/' ),
            type = Router.ACTION_TYPE_FUNCTION;

        sRoute = '/' + sRoute;

        if ( true === isClass( action ) && true === isClassChildOf( action, 'State' )  )
        {
            type = Router.ACTION_TYPE_STATE;
            this.app.stateManager.addStateClass( action );
            this._routeActions.push(
                {
                    "type" : type,
                    "action" : action.ID,
                    "route" : new UrlPattern( sRoute )
                }
            );
        }
        // else: check if object and if object has an enter and exit method
        else
        {
            throw new Error( 'Invalid action type.' );
        }
    }

    resolveActionDataByRoute( route )
    {
        let routeData = null,
            params = {},
            query = {},
            routeSplits = route.split( "?" );

        route = routeSplits[ 0 ];
        if ( routeSplits.length > 0 )
        {
            let sp = new URLSearchParams( routeSplits[ 1 ] );
            query = Object.fromEntries( sp.entries() );
        }

        for (let si = 0; si < this._routeActions.length; si++ )
        {
            params = this._routeActions[ si ].route.match( route );
            if ( params )
            {

                routeData = {
                    "routeActionData" : this._routeActions[ si ],
                    "routeParams" : new RouteParams( params, query )
                };
                break;
            }
        }

        return routeData;
    }

    enable()
    {
        if ( true === this.isEnabled )
        {
            return;
        }
        this.isEnabled = true;
        window.addEventListener( 'hashchange', this.processHash.bind( this ) );
        this.processHash();
    }

    disable()
    {
        this.isEnabled = false;
    }

    processHash()
    {
        const hash = location.hash || '#';
        let route = hash.slice(1);

        // always start with a leading slash
        route = '/' + trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute( route );
    }

    redirect( url, forceReload = false )
    {
        location.hash = '/' + trim( url, '/' );
        if ( true === forceReload )
        {
            this.processHash();
        }
    }

    async execute( route )
    {
        // Get view call
        try
        {
            const actionData = this.resolveActionDataByRoute( route );
            if ( actionData && actionData.hasOwnProperty( 'routeActionData' ) && actionData.hasOwnProperty( 'routeParams' ) )
            {
                switch( actionData.routeActionData.type )
                {
                    case Router.ACTION_TYPE_STATE:
                        let stateInstance = this.app.stateManager.createState(
                            actionData.routeActionData.action,
                            actionData.routeParams
                        );
                        this.app.stateManager.switchTo( stateInstance );
                    break;
                }
            }
        }
        catch( e )
        {
            console.error( e );
            // Uncatched error
        }
    }
}

class StateManager
{
    constructor( appInstance )
    {
        this._states =  {};
        this.app = appInstance;
        this.currentState = null;
        this.pathToStateFolder = this.app.settings.getPropertyValue( 'stateManager.rootPath' );
    }

    addStateClass( stateClass )
    {
        if ( false === isClass( stateClass ) || false === isClassChildOf( stateClass, 'State') )
        {
            throw new Error( 'StateManager.addStateClass expects a class/subclass of State.' );
        }

        if ( false === this._states.hasOwnProperty( stateClass.ID ) )
        {
            this._states[ stateClass.ID ] = stateClass;
        }
    }

    createState( stateId, routeParams )
    {
        let stateInstance = null;

        if ( this._states.hasOwnProperty( stateId ) )
        {
            stateInstance = new this._states[ stateId ]( this.app, routeParams );
        }

        return stateInstance;
    }

    switchTo( newState )
    {
        if ( false === newState.canEnter() )
        {
            // @todo Think about how to handle this
            return false;
        }

        if ( this.currentState )
        {
            this.currentState.exit();
            delete this.currentState;
        }

        newState.enter();
        this.currentState = newState;
    }

}

class ViewManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this.rootContainer = this.app.container;
    }

    setWindowTitle( title )
    {
        if ( window && window.document && window.document.title )
        {
            window.document.title = title;
        }
    }

    render( html, element = null )
    {
        const targetContainer = element instanceof HTMLElement ? element : this.rootContainer;
        targetContainer.innerHTML = html;
    }
}

function _template( html, data )
{
    var me = _template;
    return (function ()
    {
        var name = html,
            string = (name = 'template(string)', html); // no warnings
        var line = 1, body = (
            "try { " +
            (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
            "this.ret += '"  +
            string.
            replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
                replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
            replace(/^\s*|\s*$/g, '').
            replace(/\n|\r\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
            replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
            replace(/\x11=nl2br(.+?)\x13/g, "' + this.nl2br($1) + '").
            replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
            replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '") +
            "'; " + (me.variable ? "" : "}") + "return this.ret;" +
            "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
            "//@ sourceURL=" + name + "\n" // source map
        ).replace(/this\.ret \+= '';/g, '');
        var func = new Function(body);
        var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
        var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
        var nl2br = function(string) { return escapeHTML(string).replace(/(?:\ r\n|\r|\n)/g, '<br>')};
        return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, nl2br : nl2br, line: 1, ret : '', stash: stash }) };
    })()(data);
}


class TemplateManager
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this._cache = [];
    }

    _getTemplateFromCache( templateUrl )
    {
        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
        if ( cachedTemplate )
        {
            return cachedTemplate.html;
        }
    }

    async fetchTemplate( templateUrl, useCache = true )
    {
        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
        if ( !tmplHtml )
        {
            const response = await fetch( templateUrl );
            tmplHtml = await response.text();
            this._cache.push(
                {
                    url : templateUrl,
                    html : tmplHtml
                }
            );
        }
        return tmplHtml;
    }

    compileTemplate( tmpl, data = {} )
    {
        return _template( tmpl, data );
    }

    async renderTemplate( templateUrl, data = {}, containerElement = null )
    {
        let tmpl = await this.fetchTemplate( templateUrl ),
            html = this.compileTemplate( tmpl, data );

        this.app.viewManager.render( html, containerElement );

        return html;
    }
}

class L18n
{
    constructor( appInstance )
    {
        this.app = appInstance;
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;

        this.dictionary = {};
    }

    expose( fnName = '_lc' )
    {
        if ( window )
        {
            window[ fnName ] = this.getLocale.bind( this );
        }
    }

    getLocale( key, params )
    {
        const defaultLanguage = this.defaultLanguage,
            language = this.currentLanguage,
            dictionary = this.dictionary;

        if ( language && dictionary[ language ].hasOwnProperty( key ) )
        {
            return dictionary[ language][ key ].replace(/{(\d+)}/g, function(match, number)
            {
                return typeof params[number] != 'undefined'
                    ? params[number]
                    : match
                    ;
            });
        }
        else if ( defaultLanguage &&
            dictionary.hasOwnProperty( defaultLanguage ) &&
            dictionary[ defaultLanguage ].hasOwnProperty( key ) )
        {
            return dictionary[ defaultLanguage ][ key ].replace(/{(\d+)}/g, function(match, number)
            {
                return typeof params[number] != 'undefined'
                    ? params[number]
                    : match
                    ;
            });
        }
        else
        {
            return '###' + key + '###';
        }
    }
}

// Global app pool
const apps = [];

const DEFAULT_PROPS = {
    "uid" : null,
    "title" : "InfrontJS",
    "container" : null
};

const DEFAULT_SETTINGS = {
    "l18n" : {
        "defaultLanguage" : "en"
    },
    "router" : {
        "isEnabled" : true
    },
    "stateManager" : {
        "rootPath" : ""
    },
    "viewManager" : {
    },
    "templateManager" : {
        "rootPath" : ""
    }
};

class App extends PropertyObject
{
    constructor( props = {}, settings = {} )
    {
        super( { ...DEFAULT_PROPS, ...props } );

        this.settings = new PropertyObject( { ...DEFAULT_SETTINGS, settings } );

        if ( !this.uid )
        {
            this.uid = createUid();
        }

        if ( !this.container || false === this.container instanceof HTMLElement )
        {
            this.container = document.querySelector( 'body' );
        }

        // Init core components
        this.initL18n();
        this.initStateManager();
        this.initViewManager();
        this.initTemplateManager();
        this.initRouter();

        // Add app to global app pool
        apps[ this.uid ] = this;
    }

    initL18n()
    {
        this.l18n = new L18n( this );

    }
    initStateManager()
    {
        this.stateManager = new StateManager( this );
    }

    initRouter()
    {
        this.router = new Router( this );
    }

    initViewManager()
    {
        this.viewManager = new ViewManager( this );
    }

    initTemplateManager()
    {
        this.templateManager = new TemplateManager( this );
    }

    async run( route = null )
    {
        this.viewManager.setWindowTitle( this.title );
        this.router.enable();
        if ( route )
        {
            this.router.redirect( route );
        }
    }

    async destroy()
    {
    }
}

function getApp( uid = '' )
{
    if ( uid )
    {
        uid = '' + uid;
        return apps.find( app => app.uid === uid );
    }
    else if ( apps.length > 0 )
    {
        return apps[ 0 ];
    }
    else
    {
        return null;
    }

}

async function destroyApp( appToDestroy )
{
    let idx = -1;
    if ( appToDestroy instanceof App )
    {
        idx = apps.findIndex( app => app.uid === appToDestroy.uid );
    }
    else
    {
        let appUid = '' + appToDestroy;
        idx = apps.findIndex( app => app.uid === appUid );
    }

    if ( -1 < idx )
    {
        await apps[ idx ].destroy();
        apps.splice( idx, 1 );
    }
    else
    {
        console.warn( `App with UID ${uid} not found.` );
    }
}

const version = "0.2.3";

const base = {};
base.Api = Api;
base.PropertyObject = PropertyObject;
base.State = State;

// Marketing ;-)
console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );

export { App, base, createUid, destroyApp, getApp, isClass, isClassChildOf, isPlainObject, trim, version };
