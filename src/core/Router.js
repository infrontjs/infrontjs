import { RouteParams } from "../base/RouteParams.js";
import { Helper } from "../util/Helper.js";
import { StateManager } from "./StateManager.js";
import { CustomEvents } from "./CustomEvents.js";

const UrlPattern = new UP();

/**
 * Router for handling routing events (ie. changes of the URL) and resolving and triggering corresponding states.
 */
class Router
{
    /**
     * Constructor
     * @param {App} appInstance - Instance of app
     */
    constructor( appInstance )
    {
        this.app = appInstance;

        this.mode = this.app.config.get( 'router.mode', 'url' );
        this.basePath = this.app.config.get( 'router.basePath', null );

        this._routeActions = [];
        this.isEnabled = false;
        this.previousRoute = null;
        this.currentRoute = null;

        // Remove any index.html, index.php etc from url
        // Note: the query string (ie. window.location.search) gets also elimated here.
        const lastPathPart = window.location.href.split( "/" ).pop();
        if ( lastPathPart && lastPathPart.split( "." ).length > 1 )
        {
            let cleanPath = window.location.href.replace( lastPathPart, '' );
            cleanPath = cleanPath.replace( window.location.origin, '' );
            cleanPath = Helper.trim( cleanPath, '/' );
            if ( cleanPath.length > 0 )
            {
                window.history.replaceState( null, null, `/${cleanPath}/` );
            }
        }

        if ( null === this.basePath )
        {
            // Try "best guess"
            this.basePath = "";
        }
        this.basePath = Helper.trim( this.basePath, '/' );
    }

    /**
     * Adds route and action
     *
     * @param {string} route - Route pattern
     * @param {State} stateClass - State class which belongs to route pattern
     */
    addRoute( route, stateClass )
    {
        let sRoute = Helper.trim( route, '/' );
        sRoute = '/' + sRoute;

        if ( true === Helper.isClass( stateClass ) )
        {
            if ( false === this.app.stateManager.exists( stateClass.ID ) )
            {
                this.app.stateManager.add( stateClass );
            }

            this._routeActions.push(
                {
                    "action" : stateClass.ID,
                    "route" : new UrlPattern( sRoute )
                }
            );
        }
        // else: check if object and if object has an enter and exit method
        else
        {
            throw new Error( 'Invalid action.' );
        }
    }

    resolveActionDataByRoute( route )
    {
        let routeData = null,
            params = {},
            query = {},
            routeSplits = route.split( "?" );

        route = routeSplits[ 0 ];
        if ( routeSplits.length > 1 )
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
                    "routeAction" : this._routeActions[ si ].action,
                    "routeParams" : new RouteParams( params, query )
                };
                break;
            }
        }

        // If it is default route
        if ( null === routeData )
        {
            this.app.dispatchCustomEvent(
                CustomEvents.TYPE.ON_STATE_NOT_FOUND,
                {
                    route: route
                }
            );

            if ( null !== this.app.stateManager.stateNotFoundClass )
            {
                routeData = {
                    "routeAction" : this.app.stateManager.stateNotFoundClass.ID,
                    "routeParams" : null
                }
            }
        }

        return routeData;
    }

    createUrl( str )
    {
        if ( this.mode === 'hash' )
        {
            return '#/' + Helper.trim( str, '/' );
        }
        else if ( 'url' === this.mode )
        {
            return window.location.origin + '/' + this.basePath + '/' + Helper.trim( str, '/' );
        }
    }

    startsWithHash(string)
    {
        const regEx = /^#/;
        const startsWithHash = regEx.test(string);
        return Boolean(startsWithHash);
    }

    /**
     * Enables router logic
     */
    enable()
    {
        if ( true === this.isEnabled )
        {
            return;
        }
        this.isEnabled = true;

        if ( this.mode === 'url' )
        {
            this.app.container.addEventListener( 'click', this.processUrl.bind( this ), false);
            // Fix to properly handle backbutton
            window.addEventListener( 'popstate', ( e ) =>
            {
                this.app.dispatchCustomEvent(
                    CustomEvents.TYPE.POPSTATE,
                    {
                        originalEvent : e
                    }
                );
                this.processUrl();
            });
        }
        else if ( this.mode === 'hash' )
        {
            window.addEventListener( 'hashchange', this.processHash.bind( this ) );
        }
        else
        {
            console.erorr( `Invalid mode: ${mode} detected` );
        }
    }

    /**
     * Disables router logic
     */
    disable()
    {
        this.isEnabled = false;
        if ( this.mode === 'url' )
        {
            document.removeEventListener( 'click', this.processUrl.bind( this ) );
        }
        else if ( this.mode === 'hash' )
        {
            window.removeEventListener( 'hashchange', this.processHash.bind( this ) );
        }
    }

    /**
     * @private
     */
    process()
    {
        if ( this.mode === 'url' )
        {
            this.processUrl();
        }
        else if ( this.mode === 'hash' )
        {
            this.processHash();
        }
    }

    processHash()
    {
        const hash = location.hash || '#';
        let route = hash.slice(1);

        // always start with a leading slash
        route = '/' + Helper.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;
        this.execute(  this.resolveActionDataByRoute( route ) );
    }

    processUrl( event = null )
    {
        let url = window.location.href;

        if ( event )
        {
            const target = event.target.closest('a');

            // we are interested only in anchor tag clicks
            if ( !target || target.hostname !== location.hostname ) {
                return;
            }

            event.preventDefault();

            url = target.getAttribute('href');
        }

        // we don't care about example.com#hash or
        // example.com/#hash links
        if (this.startsWithHash(url)) {
            return;
        }

        let route = url.replace( window.location.origin + '/' + Helper.trim( this.basePath, '/' ), '' );
        route = '/' + Helper.trim( route, '/' );

        this.previousRoute = this.currentRoute;
        this.currentRoute = route;

        const actionData = this.resolveActionDataByRoute( route );
        if ( actionData )
        {
            window.history.pushState( null, null, url );
        }
        this.execute( actionData );
    }

    redirect( url, forceReload = false )
    {
        if ( 'hash' === this.mode )
        {
            location.hash = '/' + Helper.trim( url, '/' );
            if ( true === forceReload )
            {
                this.processHash();
            }
        }
        else if ( 'url' === this.mode )
        {
            if ( true === forceReload )
            {
                window.history.pushState( null, null, url );
            }
            else
            {
                window.history.replaceState( null, null, url );
                this.processUrl();
            }
        }
    }

    /**
     * Update browser URL without triggering the processing
     *
     * @param {String} url - Sets the url part
     */
    setUrl( url )
    {
        if ( 'hash' === this.mode )
        {
            location.hash = '/' + Helper.trim( url, '/' );

        }
        else if ( 'url' === this.mode )
        {
            window.history.replaceState( null, null, url );
        }
    }

    resolveRoute( route )
    {
        let r = Helper.trim( route, '/#' );
        r = Helper.trim( r, '#' );
        r = Helper.trim( r, '/' );

        return '/' + r;
    }

    async execute( actionData )
    {
        // Get view call
        try
        {
            if ( actionData && actionData.hasOwnProperty( 'routeAction' ) && actionData.hasOwnProperty( 'routeParams' ) )
            {
                let stateInstance = this.app.stateManager.create(
                    actionData.routeAction,
                    actionData.routeParams
                );
                await this.app.stateManager.switchTo( stateInstance );
            }
            else
            {
                console.error( 'No state found.' );
            }
        }
        catch( e )
        {
            console && console.error( e );
            // Uncatched error
        }
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
};

export { Router };
