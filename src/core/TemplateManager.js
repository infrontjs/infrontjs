import { DiffDOM, nodeToObj, stringToObj } from './../_external/diffDOM/index.js';

const _extendedFunctions = {};

function _template( html, data )
{
    var me = _template;

    return (function ()
    {
        var name = html,
            string = (name = 'template(string)', html); // no warnings

        // Add replaces in here
        string = string.
                    replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
                    replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
                    replace(/^\s*|\s*$/g, '').
                    replace(/\n|\r\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
                    replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
                    replace(/\x11=nl2br(.+?)\x13/g, "' + this.nl2br($1) + '").
                    replace(/\x11=tmpl(.+?)\x13/g, "' + this.tmpl($1) + '");


        Object.keys( _extendedFunctions ).forEach( (v) =>
        {
            string = string.replace( new RegExp( '\\x11=' + v + '(.+?)\\x13', 'g' ), "' + this.extFunc[ '" + v + "' ]($1) + '" );
        });

        string = string.
                    replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
                    replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '");

        var line = 1, body = (
            "try { " +
            (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
            "this.ret += '"  + string +
            "'; " + (me.variable ? "" : "}") + "return this.ret;" +
            "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
            "//@ sourceURL=" + name + "\n" // source map
        ).replace(/this\.ret \+= '';/g, '');
        var func = new Function(body);
        var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
        var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
        var nl2br = function(string) { return escapeHTML(string).replace(/(?:\ r\n|\r|\n)/g, '<br>')};
        var tmpl = function(d) { return _template( d[0], d[1] ); };
        return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, nl2br : nl2br, tmpl: tmpl, extFunc : _extendedFunctions, line: 1, ret : '', stash: stash }) };
    })()(data);
}


class TemplateManager
{
    // @todo Think about a templateRootDirectory
    constructor( appInstance )
    {
        this.app = appInstance;
        this._cache = [];
        this.dd = new DiffDOM();
    }

    _getTemplateFromCache( templateUrl )
    {
        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
        if ( cachedTemplate )
        {
            return cachedTemplate.html;
        }
    }

    addTemplateFunction( name, fn )
    {
        // @todo Add Check of type function
        _extendedFunctions[ name ] = fn;
    }

    removeTemplateFunction( name )
    {
        if ( _extendedFunctions.hasOwnProperty( name ) )
        {
            delete _extendedFunctions[ name ];
        }
    }

    compile( tmpl, data = {} )
    {
        return _template( tmpl, data );
    }

    // rename to render
    render( htmlElement, tmpl, data = {} )
    {
        const obj1 = nodeToObj( htmlElement );
        const obj2 = stringToObj( this.compile( tmpl, data ) );
        const diff = this.dd.diff( obj1, obj2 );
        console.log( diff );
        this.dd.apply( htmlElement, diff );
        //this.renderHtml(htmlElement, this.compile( tmpl, data ) );
    }

    renderHtml( htmlElement, html )
    {
        if ( !htmlElement || false === ( htmlElement instanceof HTMLElement ) )
        {
            throw new Error( 'First parameter is no valid HTMLElement.' );
        }

        htmlElement.innerHTML = html;
    }

    async load( templateUrl, useCache = true )
    {
        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
        if ( !tmplHtml )
        {
            const response = await fetch( templateUrl );
            if ( response.status > 399 )
            {
                throw new Error( `${response.status}: ${response.statusText}`);
            }
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
}

export { TemplateManager };
