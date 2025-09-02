import { CustomEvents } from "./CustomEvents.js";

/**
 * I18n - Modern internationalization utility for multi-language applications
 * 
 * Features:
 * - Translation management with namespace support
 * - Named and numbered parameter interpolation
 * - Plural forms support
 * - Locale-aware number and date formatting
 * - Browser language detection with fallback chains
 * - Async translation loading
 * - Event-driven language switching
 * 
 * @example
 * // Basic usage
 * const i18n = new I18n(app);
 * i18n.addTranslation('en', { 'hello': 'Hello', 'welcome': 'Welcome {name}!' });
 * i18n.addTranslation('es', { 'hello': 'Hola', 'welcome': '¡Bienvenido {name}!' });
 * 
 * console.log(i18n.t('hello')); // 'Hello'
 * console.log(i18n.t('welcome', { name: 'John' })); // 'Welcome John!'
 * 
 * @example
 * // Namespace support
 * i18n.addTranslation('en', { 
 *   'common.save': 'Save',
 *   'user.profile.title': 'User Profile'
 * });
 * 
 * @example
 * // Plural forms
 * i18n.addTranslation('en', {
 *   'items': {
 *     one: '{count} item',
 *     other: '{count} items'
 *   }
 * });
 * console.log(i18n.t('items', { count: 1 })); // '1 item'
 * console.log(i18n.t('items', { count: 5 })); // '5 items'
 */
class I18n {
    // Default language constant
    static DEFAULT_LANG = 'en';

    // Common ISO 639-1 language codes
    static LANGUAGE_CODES = [
        'ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay', 'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca', 'ch', 'ce', 'ny', 'zh', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gl', 'ka', 'de', 'el', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'ia', 'id', 'ie', 'ga', 'ig', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks', 'kk', 'km', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'ku', 'kj', 'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'gv', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mh', 'mn', 'na', 'nv', 'nb', 'nd', 'ne', 'ng', 'nn', 'no', 'ii', 'nr', 'oc', 'oj', 'cu', 'om', 'or', 'os', 'pa', 'pi', 'fa', 'pl', 'ps', 'pt', 'qu', 'rm', 'rn', 'ro', 'ru', 'sa', 'sc', 'sd', 'se', 'sm', 'sg', 'sr', 'gd', 'sn', 'si', 'sk', 'sl', 'so', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'te', 'tg', 'th', 'ti', 'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo', 'za', 'zu'
    ];

    // Plural rules for different languages (simplified)
    static PLURAL_RULES = {
        // English, German, Dutch, etc. (1 = singular, other = plural)
        en: (n) => n === 1 ? 'one' : 'other',
        de: (n) => n === 1 ? 'one' : 'other',
        nl: (n) => n === 1 ? 'one' : 'other',
        
        // French (0-1 = singular, other = plural)
        fr: (n) => (n >= 0 && n <= 1) ? 'one' : 'other',
        
        // Russian, Ukrainian (complex rules)
        ru: (n) => {
            if (n % 10 === 1 && n % 100 !== 11) return 'one';
            if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'few';
            return 'many';
        },
        
        // Polish (complex rules)
        pl: (n) => {
            if (n === 1) return 'one';
            if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'few';
            return 'many';
        },
        
        // Arabic (complex rules)
        ar: (n) => {
            if (n === 0) return 'zero';
            if (n === 1) return 'one';
            if (n === 2) return 'two';
            if (n % 100 >= 3 && n % 100 <= 10) return 'few';
            if (n % 100 >= 11) return 'many';
            return 'other';
        }
    };

    /**
     * Constructor
     * @param {App} appInstance - InfrontJS App reference
     * @param {Object} options - Configuration options
     */
    constructor(appInstance, options = {}) {
        this.app = appInstance;
        this.options = {
            defaultLanguage: I18n.DEFAULT_LANG,
            fallbackLanguage: I18n.DEFAULT_LANG,
            detectBrowserLanguage: true,
            globalExpose: false,
            globalPrefix: '_',
            interpolation: {
                prefix: '{',
                suffix: '}'
            },
            ...options
        };

        this.defaultLanguage = this.options.defaultLanguage;
        this.fallbackLanguage = this.options.fallbackLanguage;
        this.dictionary = new Map(); // lang -> translations map
        this.loadingPromises = new Map(); // track async loading
        this.formatters = new Map(); // cached formatters

        // Initialize current language
        let initialLang = this.defaultLanguage;
        if (this.options.detectBrowserLanguage) {
            const browserLang = this.detectBrowserLanguage();
            if (browserLang) {
                initialLang = browserLang;
            }
        }

        this.setCurrentLanguage(initialLang);

        // Expose globally if requested
        if (this.options.globalExpose) {
            this.expose();
        }
    }

    /**
     * Detect browser language with improved locale support
     * @returns {string|null} Detected language code or null
     */
    detectBrowserLanguage() {
        if (typeof window === "undefined" || !window.navigator) {
            return null;
        }

        const nav = window.navigator;
        const languages = [];

        // Collect all available languages
        if (Array.isArray(nav.languages)) {
            languages.push(...nav.languages);
        }

        // Fallback properties
        const fallbackProps = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'];
        for (const prop of fallbackProps) {
            if (nav[prop] && typeof nav[prop] === 'string') {
                languages.push(nav[prop]);
            }
        }

        // Find best match
        for (const lang of languages) {
            if (!lang) continue;

            // Try exact match first (e.g., 'en-US')
            if (this._isValidLanguageCode(lang)) {
                return lang.toLowerCase();
            }

            // Try language part only (e.g., 'en' from 'en-US')
            const langCode = lang.split('-')[0];
            if (this._isValidLanguageCode(langCode)) {
                return langCode.toLowerCase();
            }
        }

        return null;
    }


    /**
     * Set current language with validation and events
     * @param {string} langCode - Language code (e.g., 'en', 'en-US')
     * @throws {Error} Invalid language code
     */
    setCurrentLanguage(langCode) {
        if (!langCode || typeof langCode !== 'string') {
            throw new Error(`Invalid langCode: ${langCode}`);
        }

        const normalizedLang = this._normalizeLanguageCode(langCode);
        if (!normalizedLang) {
            throw new Error(`Invalid langCode: ${langCode}`);
        }

        // Fire before event
        if (this.app && this.currentLanguage !== normalizedLang) {
            this.app.dispatchEvent(new CustomEvent(CustomEvents.TYPE.BEFORE_LANGUAGE_SWITCH, {
                detail: {
                    currentLanguage: this.currentLanguage,
                    newLanguage: normalizedLang
                }
            }));
        }

        const oldLanguage = this.currentLanguage;
        this.currentLanguage = normalizedLang;

        // Update formatters
        this._updateFormatters();

        // Fire after event
        if (this.app && oldLanguage !== normalizedLang) {
            this.app.dispatchEvent(new CustomEvent(CustomEvents.TYPE.AFTER_LANGUAGE_SWITCH, {
                detail: {
                    oldLanguage: oldLanguage,
                    currentLanguage: this.currentLanguage
                }
            }));
        }
    }

    /**
     * Get current language
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Set entire dictionary for a language
     * @param {string} langCode - Language code
     * @param {Object} translations - Translation object
     */
    setDictionary(langCode, translations) {
        const normalizedLang = this._normalizeLanguageCode(langCode);
        if (!normalizedLang) {
            throw new Error(`Invalid langCode: ${langCode}`);
        }

        if (!translations || typeof translations !== 'object') {
            throw new Error('Translations must be an object');
        }

        this.dictionary.set(normalizedLang, this._flattenTranslations(translations));
    }

    /**
     * Add translations for a language (merge with existing)
     * @param {string} langCode - Language code
     * @param {Object} translationObject - Translations to add
     * @param {string} namespace - Optional namespace prefix
     */
    addTranslation(langCode, translationObject, namespace = '') {
        const normalizedLang = this._normalizeLanguageCode(langCode);
        if (!normalizedLang) {
            throw new Error(`Invalid langCode: ${langCode}`);
        }

        if (!translationObject || typeof translationObject !== 'object') {
            throw new Error('Translation object must be an object');
        }

        let currentDict = this.dictionary.get(normalizedLang) || {};
        const flatTranslations = this._flattenTranslations(translationObject, namespace);

        // Merge translations
        currentDict = { ...currentDict, ...flatTranslations };
        this.dictionary.set(normalizedLang, currentDict);
    }

    /**
     * Load translations asynchronously
     * @param {string} langCode - Language code
     * @param {string|Function} source - URL string or function returning translations
     * @returns {Promise} Loading promise
     */
    async loadTranslations(langCode, source) {
        const normalizedLang = this._normalizeLanguageCode(langCode);
        if (!normalizedLang) {
            throw new Error(`Invalid langCode: ${langCode}`);
        }

        // Return existing promise if already loading
        const loadingKey = `${normalizedLang}-${typeof source === 'string' ? source : 'function'}`;
        if (this.loadingPromises.has(loadingKey)) {
            return this.loadingPromises.get(loadingKey);
        }

        const loadingPromise = this._loadTranslationsInternal(normalizedLang, source);
        this.loadingPromises.set(loadingKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.loadingPromises.delete(loadingKey);
            return result;
        } catch (error) {
            this.loadingPromises.delete(loadingKey);
            throw error;
        }
    }

    /**
     * Get translation with interpolation and pluralization
     * @param {string} key - Translation key (supports namespaces with dots)
     * @param {Object|Array} params - Parameters for interpolation
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        if (!key || typeof key !== 'string') {
            return '';
        }

        // Get translation with fallback
        let translation = this._getTranslation(key, this.currentLanguage);
        
        if (!translation && this.currentLanguage !== this.fallbackLanguage) {
            translation = this._getTranslation(key, this.fallbackLanguage);
        }

        if (!translation) {
            // Return key as fallback
            translation = key;
        }

        // Handle pluralization
        if (typeof translation === 'object' && params.count !== undefined) {
            translation = this._selectPluralForm(translation, params.count, this.currentLanguage);
        }

        if (typeof translation !== 'string') {
            return key;
        }

        // Interpolate parameters
        return this._interpolate(translation, params);
    }


    /**
     * Get formatted number
     * @param {number} num - Number to format
     * @param {Object} options - Intl.NumberFormat options
     * @returns {string} Formatted number
     */
    n(num = 0, options = null) {
        try {
            if (options) {
                return new Intl.NumberFormat(this.currentLanguage, options).format(num);
            }
            
            if (!this.formatters.has('number')) {
                this.formatters.set('number', new Intl.NumberFormat(this.currentLanguage, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }));
            }
            
            return this.formatters.get('number').format(num);
        } catch (error) {
            console.warn('Number formatting failed:', error);
            return String(num);
        }
    }


    /**
     * Get formatted date/time
     * @param {Date} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    d(date, options = null) {
        try {
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                throw new Error('Invalid date provided');
            }

            if (options) {
                return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
            }
            
            if (!this.formatters.has('date')) {
                this.formatters.set('date', new Intl.DateTimeFormat(this.currentLanguage));
            }
            
            return this.formatters.get('date').format(date);
        } catch (error) {
            console.warn('Date formatting failed:', error);
            return String(date);
        }
    }


    /**
     * Check if translation exists
     * @param {string} key - Translation key
     * @param {string} langCode - Language code (optional, uses current if not provided)
     * @returns {boolean} True if translation exists
     */
    exists(key, langCode = null) {
        const lang = langCode ? this._normalizeLanguageCode(langCode) : this.currentLanguage;
        return !!this._getTranslation(key, lang);
    }

    /**
     * Get all available languages
     * @returns {Array} Array of language codes
     */
    getAvailableLanguages() {
        return Array.from(this.dictionary.keys());
    }

    /**
     * Remove translations for a language
     * @param {string} langCode - Language code
     */
    removeLanguage(langCode) {
        const normalizedLang = this._normalizeLanguageCode(langCode);
        if (normalizedLang) {
            this.dictionary.delete(normalizedLang);
        }
    }

    /**
     * Clear all translations
     */
    clearAll() {
        this.dictionary.clear();
        this.formatters.clear();
    }

    /**
     * Expose functions to global scope (optional)
     */
    expose() {
        if (typeof window === "undefined") {
            return;
        }

        const prefix = this.options.globalPrefix;
        const functions = {
            [`${prefix}t`]: this.t.bind(this),
            [`${prefix}n`]: this.n.bind(this),
            [`${prefix}d`]: this.d.bind(this)
        };

        for (const [name, func] of Object.entries(functions)) {
            if (window[name]) {
                console.warn(`Global function ${name} already exists, skipping`);
                continue;
            }
            window[name] = func;
        }
    }

    // Private methods
    
    /**
     * Normalize language code
     * @private
     */
    _normalizeLanguageCode(langCode) {
        if (!langCode || typeof langCode !== 'string') {
            return null;
        }

        const normalized = langCode.toLowerCase().trim();
        
        // Check full locale first (e.g., 'en-us')
        if (this._isValidLanguageCode(normalized)) {
            return normalized;
        }

        // Check language part only (e.g., 'en' from 'en-us')
        const langPart = normalized.split('-')[0];
        if (this._isValidLanguageCode(langPart)) {
            return langPart;
        }

        return null;
    }

    /**
     * Check if language code is valid
     * @private
     */
    _isValidLanguageCode(langCode) {
        if (!langCode) return false;
        
        const code = langCode.toLowerCase();
        
        // Check if it's a basic language code
        if (I18n.LANGUAGE_CODES.includes(code)) {
            return true;
        }

        // Check if it's a locale (language-region)
        const parts = code.split('-');
        if (parts.length === 2) {
            return I18n.LANGUAGE_CODES.includes(parts[0]);
        }

        return false;
    }


    /**
     * Update formatters when language changes
     * @private
     */
    _updateFormatters() {
        this.formatters.clear();
    }

    /**
     * Flatten nested translation object
     * @private
     */
    _flattenTranslations(obj, prefix = '') {
        const flattened = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Check if it's a plural form object
                if (this._isPluralForm(value)) {
                    flattened[newKey] = value;
                } else {
                    // Recursively flatten
                    Object.assign(flattened, this._flattenTranslations(value, newKey));
                }
            } else {
                flattened[newKey] = value;
            }
        }
        
        return flattened;
    }

    /**
     * Check if object is a plural form
     * @private
     */
    _isPluralForm(obj) {
        const pluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other'];
        const keys = Object.keys(obj);
        return keys.some(key => pluralKeys.includes(key));
    }

    /**
     * Get translation for specific language
     * @private
     */
    _getTranslation(key, langCode) {
        const translations = this.dictionary.get(langCode);
        return translations ? translations[key] : null;
    }

    /**
     * Select appropriate plural form
     * @private
     */
    _selectPluralForm(pluralObj, count, langCode) {
        const langBase = langCode.split('-')[0];
        const pluralRule = I18n.PLURAL_RULES[langBase] || I18n.PLURAL_RULES.en;
        const form = pluralRule(count);
        
        return pluralObj[form] || pluralObj.other || pluralObj.one || '';
    }

    /**
     * Interpolate parameters in translation
     * @private
     */
    _interpolate(text, params) {
        if (!params || (typeof params !== 'object' && !Array.isArray(params))) {
            return text;
        }

        const { prefix, suffix } = this.options.interpolation;
        
        return text.replace(new RegExp(`${this._escapeRegex(prefix)}([^${this._escapeRegex(suffix)}]+)${this._escapeRegex(suffix)}`, 'g'), (match, key) => {
            // Handle array parameters (numbered: {0}, {1}, etc.)
            if (Array.isArray(params)) {
                const index = parseInt(key, 10);
                return !isNaN(index) && params[index] !== undefined ? params[index] : match;
            }
            
            // Handle object parameters (named: {name}, {count}, etc.)
            return params.hasOwnProperty(key) ? params[key] : match;
        });
    }

    /**
     * Escape regex special characters
     * @private
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Internal translation loading
     * @private
     */
    async _loadTranslationsInternal(langCode, source) {
        let translations;

        if (typeof source === 'string') {
            // Load from URL
            const response = await fetch(source);
            if (!response.ok) {
                throw new Error(`Failed to load translations from ${source}: ${response.status}`);
            }
            translations = await response.json();
        } else if (typeof source === 'function') {
            // Load from function
            translations = await source();
        } else {
            throw new Error('Source must be a URL string or function');
        }

        this.setDictionary(langCode, translations);
        return translations;
    }
}

export { I18n };