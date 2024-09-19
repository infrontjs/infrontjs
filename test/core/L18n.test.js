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
            "Hello World!" : {
                "de" : "Hallo Welt!"
            },
            "My name is {0}." : {
                "de" : "Mein Name ist {0}."
            }
        };
        l18n.setDictionary( dict );

        assert.equal( l18n.getLocale( "Hello World!" ) === "Hello World!", true );
        l18n.setCurrentLanguage( "de" );
        assert.equal( l18n.getLocale( "Hello World!" ) === "Hallo Welt!", true );
        l18n.setCurrentLanguage( "en" );
        assert.equal( l18n.getLocale( "My name is {0}.", [ "InfrontJS" ] ) === "My name is InfrontJS.", true );
        l18n.setCurrentLanguage( "de" );
        assert.equal( l18n.getLocale( "My name is {0}.", [ "InfrontJS" ] ) === "Mein Name ist InfrontJS.", true );
        l18n.setCurrentLanguage( "en" );
        assert.equal( l18n.getLocale( "New textkey!" ) === "New textkey!", true );
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
            { 'Hello' : "Hallo" }
        );
        l18n.setCurrentLanguage( 'de' );
        assert( 'Hallo' === l18n.getLocale( 'Hello' ), true );
        l18n.setCurrentLanguage( 'en' );
        assert( 'Hello' === l18n.getLocale( 'Hello' ), true );
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
