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
        this.currentLanguage = this.defaultLanguage;

        this.dictionary = {};
    }

    /**
     * Export localization function to window scope.
     * @param {string=} [fnName=_lc] - Name of global localization function
     */
    expose( fnName = '_lc' )
    {
        if ( window )
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
     * Gets current translation by given key
     * @param {string} key - Translation key
     * @param {object=} [params=undefined] - Params object
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
}

export { L18n };
