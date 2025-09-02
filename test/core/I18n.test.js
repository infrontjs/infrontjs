import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing core.I18n", () =>
{
    let i18n;
    before ( () => {
        i18n = new IF.I18n( null );
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.I18n, true );
        assert.equal( i18n instanceof IF.I18n, true );
        assert.equal( "function" === typeof i18n.detectBrowserLanguage, true );
        assert.equal( "function" === typeof i18n.expose, true );
        assert.equal( "function" === typeof i18n.t, true );
        assert.equal( "function" === typeof i18n.setDictionary, true );
        assert.equal( "function" === typeof i18n.getCurrentLanguage, true );
        assert.equal( "function" === typeof i18n.setCurrentLanguage, true );
        assert.equal( "function" === typeof i18n.addTranslation, true );
        assert.equal( "function" === typeof i18n.n, true );
        assert.equal( "function" === typeof i18n.d, true );
        assert.equal( "function" === typeof i18n.exists, true );
        assert.equal( "function" === typeof i18n.getAvailableLanguages, true );
        assert.equal( "function" === typeof i18n.loadTranslations, true );
    });

    it( 'Test getCurrentLanguage', () =>
    {
        assert.equal( IF.I18n.DEFAULT_LANG === i18n.getCurrentLanguage(), true );
    });


    it( 'Test modern API - t() method', () =>
    {
        // Add translations using modern API
        i18n.addTranslation('en', {
            'hello': 'Hello World!',
            'greeting': 'Hello {name}!',
            'items': {
                one: 'You have {count} item',
                other: 'You have {count} items'
            }
        });
        
        i18n.addTranslation('de', {
            'hello': 'Hallo Welt!',
            'greeting': 'Hallo {name}!',
            'items': {
                one: 'Du hast {count} Element',
                other: 'Du hast {count} Elemente'
            }
        });

        // Test basic translation
        assert.equal( i18n.t('hello'), 'Hello World!' );
        
        // Test named parameters
        assert.equal( i18n.t('greeting', { name: 'InfrontJS' }), 'Hello InfrontJS!' );
        
        // Test pluralization
        assert.equal( i18n.t('items', { count: 1 }), 'You have 1 item' );
        assert.equal( i18n.t('items', { count: 5 }), 'You have 5 items' );
        
        // Test language switching
        i18n.setCurrentLanguage('de');
        assert.equal( i18n.t('hello'), 'Hallo Welt!' );
        assert.equal( i18n.t('greeting', { name: 'InfrontJS' }), 'Hallo InfrontJS!' );
        assert.equal( i18n.t('items', { count: 1 }), 'Du hast 1 Element' );
        
        // Test fallback for missing key
        assert.equal( i18n.t('missing.key'), 'missing.key' );
        
        // Reset to English for other tests
        i18n.setCurrentLanguage('en');
    });

    it( 'Test array parameter support', () =>
    {
        // Test modern API with array parameters for backward compatibility
        i18n.addTranslation('en', { 'param.test': 'Hello {0}!' });
        i18n.addTranslation('de', { 'param.test': 'Hallo {0}!' });

        assert.equal( i18n.t('param.test', ['World']), 'Hello World!' );
        i18n.setCurrentLanguage('de');
        assert.equal( i18n.t('param.test', ['World']), 'Hallo World!' );
        i18n.setCurrentLanguage('en');
    });

    it( 'Test setCurrentLanguage with invalid call', () =>
    {
        assert.throws( () => { i18n.setCurrentLanguage( null ) }, Error );
        assert.throws( () => { i18n.setCurrentLanguage( '' ) }, Error );
    });

    it( 'Test setCurrentLanguage with valid codes', () =>
    {
        i18n.setCurrentLanguage('ja');
        assert.equal( i18n.getCurrentLanguage(), 'ja' );
        
        i18n.setCurrentLanguage('fr');
        assert.equal( i18n.getCurrentLanguage(), 'fr' );
        
        // Test with locale
        i18n.setCurrentLanguage('en-US');
        assert.equal( i18n.getCurrentLanguage(), 'en-us' );
        
        // Reset for other tests
        i18n.setCurrentLanguage('en');
    });

    it( 'Test addTranslation with invalid call', () =>
    {
        assert.throws( () => { i18n.addTranslation( null, {} ) }, Error );
        assert.throws( () => { i18n.addTranslation( 'en', null ) }, Error );
    });

    it( 'Test addTranslation', () =>
    {
        i18n.addTranslation('de', { 'test.key': 'Deutsch' });
        i18n.addTranslation('fr', { 'test.key': 'Français' });
        
        i18n.setCurrentLanguage('de');
        assert.equal( i18n.t('test.key'), 'Deutsch' );
        
        i18n.setCurrentLanguage('fr');
        assert.equal( i18n.t('test.key'), 'Français' );
        
        i18n.setCurrentLanguage('en');
        assert.equal( i18n.t('test.key'), 'test.key' ); // Fallback to key
    });

    it( 'Test number formatting', () =>
    {
        i18n.setCurrentLanguage('de');
        assert.equal( i18n.n(100), '100,00' );
        
        i18n.setCurrentLanguage('en');
        assert.equal( i18n.n(100), '100.00' );
    });

    it( 'Test datetime formatting', () =>
    {
        const now = new Date('2023-12-25T10:30:00Z'); // Fixed date for consistent testing
        
        i18n.setCurrentLanguage('de');
        const deFormat = i18n.d(now);
        assert.equal( typeof deFormat, 'string' );
        assert.equal( deFormat.length > 0, true );
        
        i18n.setCurrentLanguage('en');
        const enFormat = i18n.d(now);
        assert.equal( typeof enFormat, 'string' );
        assert.equal( enFormat.length > 0, true );
    });

    it( 'Test namespace support', () =>
    {
        i18n.addTranslation('en', {
            'user.profile.name': 'Name',
            'user.profile.email': 'Email',
            'admin.settings.title': 'Admin Settings'
        });
        
        assert.equal( i18n.t('user.profile.name'), 'Name' );
        assert.equal( i18n.t('user.profile.email'), 'Email' );
        assert.equal( i18n.t('admin.settings.title'), 'Admin Settings' );
    });

    it( 'Test utility methods', () =>
    {
        // Test exists method
        i18n.addTranslation('en', { 'existing.key': 'Value' });
        assert.equal( i18n.exists('existing.key'), true );
        assert.equal( i18n.exists('non.existing.key'), false );
        
        // Test getAvailableLanguages
        const languages = i18n.getAvailableLanguages();
        assert.equal( Array.isArray(languages), true );
        assert.equal( languages.includes('en'), true );
    });

});