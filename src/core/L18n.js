import { CustomEvents} from "./CustomEvents.js";

/**
 * L18n
 * Simple internationalization logic
 */
class L18n
{
    static LANG_EN = 'en';

    // List of valid 2-chared-county-codes
    static COUNTRY_CODES = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AN", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
    "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
    "DE", "DJ", "DK", "DM", "DO", "DZ",
    "EC", "EE", "EG", "EH", "EN", "ER", "ES", "ET",
    "FI", "FJ", "FK", "FM", "FO", "FR",
    "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
    "HK", "HM", "HN", "HR", "HT", "HU",
    "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
    "JE", "JM", "JO", "JP",
    "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
    "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
    "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
    "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
    "OM",
    "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
    "QA",
    "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
    "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
    "UA", "UG", "UM", "US", "UY", "UZ",
    "VA", "VC", "VE", "VG", "VI", "VN", "VU",
    "WF", "WS", "YE", "YT",
    "ZA","ZM", "ZW" ];


    /**
     * Constructor
     * @param {App} appInstance - InfrontJS App reference
     */
    constructor( appInstance )
    {
        this.app = appInstance;
        this.defaultLanguage = L18n.LANG_EN;
        let cl = this.resolveBrowserLanguage();
        if ( null === cl )
        {
            cl = this.defaultLanguage.toLowerCase();
        }

        this.dictionary = {};
        this.setCurrentLanguage( cl );
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
     * Export localization functions to window scope.
     */
    expose()
    {
        if ( typeof window !== "undefined" )
        {
            window[ '_lcs' ] = this.getLocale.bind( this );
            window[ '_lcn' ] = this.getNumber.bind( this );
            window[ '_lcd' ] = this.getDateTime.bind( this );
        }
    }

    /**
     * Sets dictionary
     * @param {object=}  [dict={ defaultLang : { "langCode" : "translation", ... }, ... } ] - Dictionary
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
     * @param {object} translationObject - The translation object, simple key-value object, e.g. { 'Hello' : 'Hallo' }
     */
    addTranslation( langCode, translationObject )
    {
        if ( langCode && langCode.length > 2 )
        {
            langCode = langCode.slice( 0, 2);
        }

        if ( !langCode || false === this._isValidLangCode( langCode ) )
        {
            throw new Error( 'Invalid langCode: ' + langCode )
        }

        for ( const [ key, value ] of Object.entries( translationObject ) )
        {
            if ( false === this.dictionary.hasOwnProperty( key ) )
            {
                this.dictionary[ key ] = {};
            }
            this.dictionary[ key ][ langCode ] = value;
        }
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

        let langEntry = null;

        if ( dictionary.hasOwnProperty( key ) && dictionary[ key ].hasOwnProperty( language ) && typeof dictionary[ key ][ language ] === 'string' )
        {
            langEntry = dictionary[ key ][ language ];
        }
        else
        {
            langEntry = key;
        }

        return langEntry.replace(/{(\d+)}/g, function(match, number)
        {
            return typeof params[number] != 'undefined'
                ? params[number]
                : match
                ;
        });
    }

    /**
     * Get formatted number
     *
     * @param {Date} num - Number to format
     * @param {Object=} [opts=null] - NumberFormat options used if set. @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|NumberFormat}
     * @returns {string}
     */
    getNumber( num = 0, opts = null )
    {
        if ( opts )
        {
            return Intl.NumberFormat( this.currentLanguage, opts ).format( num );
        }
        else
        {
            return this._nf.format( num );
        }
    }

    /**
     * Get formatted date time
     *
     * @param {Date} dt - Date object to format
     * @param {Object=} [opts=null] - DateTimeFormat options used if set. @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat|DateTimeFormat}
     * @returns {string}
     */
    getDateTime( dt, opts = null )
    {
        if ( opts )
        {
            return Intl.DateTimeFormat( this.currentLanguage, opts ).format( dt );
        }
        else
        {
            return this._dtf.format( dt );
        }
    }


    /**
     * Set current language
     * @param {string} langCode - 2 chared language code
     * @throws {Error} - Invalid language code
     */
    setCurrentLanguage( langCode )
    {
        if ( langCode && langCode.length > 2 )
        {
            langCode = langCode.slice( 0, 2);
        }

        if ( !langCode || false === this._isValidLangCode( langCode ) )
        {
            throw new Error( 'Invalid langCode: ' + langCode )
        }

        if ( this.app )
        {
            this.app.dispatchCustomEvent(
                CustomEvents.TYPE.BEFORE_LANGUAGE_SWITCH,
                {
                    currentLanguage: this.currentLanguage,
                    newLanguage: langCode.toLowerCase()
                }
            );
        }

        const oldLanguage = this.currentLanguage;
        this.currentLanguage = langCode.toLowerCase();
        this._nf = new Intl.NumberFormat(
            this.currentLanguage,
            {
                minimumFractionDigits : 2,
                maximumFractionDigits : 2
            }
        );
        this._dtf = new Intl.DateTimeFormat( this.currentLanguage );

        if ( this.app )
        {
            this.app.dispatchCustomEvent(
                CustomEvents.TYPE.AFTER_LANGUAGE_SWITCH,
                {
                    oldLanguage: oldLanguage,
                    currentLanguage: this.currentLanguage
                }
            );
        }
    }

    /**
     * Get current selected language
     * @returns {string} - Returns 2 chared language code
     */
    getCurrentLanguage()
    {
        return this.currentLanguage;
    }

    _isValidLangCode( langCode )
    {
        return -1 < L18n.COUNTRY_CODES.indexOf( langCode.toUpperCase() );
    }
}

export { L18n };
