/**
 * L18n
 * Simple internationalization logic
 */
class L18n
{
    static LANG_EN = 'en';

    /**
     * Constructor
     * @param {App} appInstance - InfrontJS App reference
     */
    constructor( appInstance )
    {
        this.app = appInstance;
        this.defaultLanguage = L18n.LANG_EN;
        this.currentLanguage = this.resolveBrowserLanguage();
        if ( null === this.currentLanguage )
        {
            this.currentLanguage = this.defaultLanguage.toLowerCase();
        }

        this.dictionary = {};
    }

    /**
     * Resolve preferred browser language
     * @returns {*|null|string}
     */
    resolveBrowserLanguage()
    {
        // See: https://stackoverflow.com/questions/1043339/javascript-for-detecting-browser-language-preference/46514247#46514247
        var nav = typeof window !== "undefined" && window.navigator ? window.navigator : null,
            browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
            i,
            language,
            len,
            shortLanguage = null;

        if ( !nav )
        {
            return null;
        }

        // support for HTML 5.1 "navigator.languages"
        if (Array.isArray(nav.languages)) {
            for (i = 0; i < nav.languages.length; i++) {
                language = nav.languages[i];
                len = language.length;
                if (!shortLanguage && len) {
                    shortLanguage = language;
                }
                if (language && len>2) {
                    return language.slice( 0, 2).toLowerCase();
                }
            }
        }

        // support for other well known properties in browsers
        for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = nav[browserLanguagePropertyKeys[i]];
            //skip this loop iteration if property is null/undefined.  IE11 fix.
            if (language == null) { continue; }
            len = language.length;
            if (!shortLanguage && len) {
                shortLanguage = language;
            }
            if (language && len > 2) {
                return language.slice( 0, 2).toLowerCase();
            }
        }

        return shortLanguage.toLowerCase();
    }

    /**
     * Export localization function to window scope.
     * @param {string=} [fnName=_lc] - Name of global localization function
     */
    expose( fnName = '_lc' )
    {
        if ( typeof window !== "undefined" )
        {
            window[ fnName ] = this.getLocale.bind( this );
        }
    }

    /**
     * Sets dictionary
     * @param {object=}  [dict={}] - Dictionary
     */
    setDictionary( dict = {} )
    {
        this.dictionary = dict;
    }

    /**
     *
     * Add given translation object to dictionary
     *
     * @param {string} langCode - Langugae code (2 chars)
     * @param {object} translationObject - The translation object, simple key-value object
     */
    addTranslation( langCode, translationObject )
    {
        if ( langCode && langCode.length > 2 )
        {
            langCode = langCode.slice( 0, 2);
        }

        if ( !langCode || langCode.length != 2 )
        {
            throw new Error( 'Invalid langCode: ' + langCode )
        }

        this.dictionary[ langCode ] = translationObject;
    }

    /**
     * Gets current translation by given key
     * @param {string} key - Translation key
     * @param {array=} [params=undefined] - Params array
     * @returns {string}
     */
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

    setCurrentLanguage( langCode )
    {
        if ( langCode && langCode.length > 2 )
        {
            langCode = langCode.slice( 0, 2);
        }

        if ( !langCode || langCode.length != 2 )
        {
            throw new Error( 'Invalid langCode: ' + langCode )
        }

        this.currentLanguage = langCode.toLowerCase();
    }

    getCurrentLanguage()
    {
        return this.currentLanguage;
    }
}

export { L18n };
