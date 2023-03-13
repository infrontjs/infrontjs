import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing core.L18n", () =>
{
    let l18n;
    before ( () => {
        l18n = new IF.L18n( null );
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.L18n, true );
        assert.equal( l18n instanceof IF.L18n, true );
        assert.equal( "function" === typeof l18n.resolveBrowserLanguage, true );
        assert.equal( "function" === typeof l18n.expose, true );
        assert.equal( "function" === typeof l18n.getLocale, true );
        assert.equal( "function" === typeof l18n.setDictionary, true );
        assert.equal( "function" === typeof l18n.getCurrentLanguage, true );
        assert.equal( "function" === typeof l18n.setCurrentLanguage, true );
    });

    it( 'Test getCurrentLanguage', () =>
    {
        assert.equal( IF.L18n.LANG_EN === l18n.getCurrentLanguage(), true );
    });


    it( 'Test getLocale', () =>
    {
        const dict = {
            "en" : {
                "KEY_HELLO" : "Hello",
                "KEY_WORLD" : "World",
                "KEY_HELLO_NAME" : "Hello {0} !"
            }
        };
        l18n.setDictionary( dict );

        const keyUndefined = 'KEY_UNKNOWN';

        assert.equal( l18n.getLocale( "KEY_HELLO" ) === "Hello", true );
        assert.equal( l18n.getLocale( "KEY_WORLD" ) === "World", true );
        assert.equal( l18n.getLocale( keyUndefined ) === '###' + keyUndefined + '###', true );
        assert.equal( l18n.getLocale( "KEY_HELLO_NAME", [ "InfrontJS" ] ) === "Hello InfrontJS !", true );
    });

    it( 'Test setCurrentLanguage with invalid call', () =>
    {
        assert.throws( () => { l18n.setCurrentLanguage( null, {} ) }, Error );
    });

    it( 'Test setCurrentLanguage', () =>
    {
        l18n.setCurrentLanguage( 'JP' );
        assert( l18n.getCurrentLanguage() === 'jp', true );
    });

    it( 'Test addTranslation with invalid call', () =>
    {
        assert.throws( () => { l18n.addTranslation( null, {} ) }, Error );
    });

    it( 'Test addTranslation', () =>
    {
        l18n.addTranslation(
            'de',
            {
                "KEY_HELLO" : "Hallo"
            }
        );
        l18n.setCurrentLanguage( 'de' );

        assert( l18n.dictionary.hasOwnProperty( 'de' ) );
        assert( 'Hallo' === l18n.getLocale( 'KEY_HELLO' ), true );
    });

    it( 'Test number formatting', () =>
    {
        l18n.setCurrentLanguage( 'de' );
        assert( l18n.getNumber( 100 ) === '100,00', true );
        l18n.setCurrentLanguage( 'en' );
        assert( l18n.getNumber( 100 ) === '100.00', true );
    });

    it( 'Test datetime formatting', () =>
    {
        const now = new Date();
        l18n.setCurrentLanguage( 'de' );
        assert( l18n.getDateTime( now ) === `${now.getDate()}.${(now.getMonth()+1)}.${now.getFullYear()}`, true );
        l18n.setCurrentLanguage( 'en' );
        assert( l18n.getDateTime( now ) === `${(now.getMonth()+1)}/${now.getDate()}/${now.getFullYear()}`, true );
    });

});
