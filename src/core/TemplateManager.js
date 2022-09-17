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

    getHtml( tmpl, data = {} )
    {
        return _template( tmpl, data );
    }

    async get( templateUrl, useCache = true )
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
}

export { TemplateManager };
