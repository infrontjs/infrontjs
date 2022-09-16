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

export { L18n };
