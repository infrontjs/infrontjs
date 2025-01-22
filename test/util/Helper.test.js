import assert from 'assert';
import { Helper } from "../../src/util/Helper.js";

describe( "Testing util.Helper", () =>
{
    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof Helper, true );
        assert.equal( "function" === typeof Helper.trim, true );
        assert.equal( "function" === typeof Helper.serializeForm, true );
        assert.equal( "function" === typeof Helper.createUid, true );
        assert.equal( "function" === typeof Helper.isString, true );
        assert.equal( "function" === typeof Helper.isArray, true );
        assert.equal( "function" === typeof Helper.isPlainObject, true );
        assert.equal( "function" === typeof Helper.isClass, true );
        assert.equal( "function" === typeof Helper.createObservable, true );
        assert.equal( "function" === typeof Helper.deepMerge, true );
    });

    it( 'Test Helper.trim', () =>
    {
        assert.equal( 'test' === Helper.trim( '    test    ' ), true );
        assert.equal( 'test' === Helper.trim( '******test******', '*' ), true );
        assert.equal( 'test' === Helper.trim( 'test' ), true );
    });

    it ( 'Test Helper.createUid', () =>
    {
        // Crypto module is not available for unit testing
        assert.throws( () => { Helper.createUid() }, Error );
    });

    it ( 'Test Helper.isString', () =>
    {
        assert.equal( "boolean" === typeof Helper.isString( 1 ), true );
        assert.equal( true === Helper.isString( 'test' ), true );
        assert.equal( false === Helper.isString( 123), true );
        assert.equal( false === Helper.isString( { "hello" : "world" } ), true );
    });

    it ( 'Test Helper.isArray', () =>
    {
        assert.equal( "boolean" === typeof Helper.isArray( 1 ), true );
        assert.equal( true === Helper.isArray( [] ), true );
        assert.equal( false === Helper.isArray( 123), true );
        assert.equal( false === Helper.isArray( { "hello" : "world" } ), true );
    });

    it ( 'Test Helper.isPlainObject', () =>
    {
        assert.equal( "boolean" === typeof Helper.isPlainObject( 1 ), true );
        assert.equal( true === Helper.isPlainObject( { "hello" : "world" } ), true );
        assert.equal( false === Helper.isPlainObject( 123 ), true );
        assert.equal( false === Helper.isPlainObject( "dfjks" ), true );
        assert.equal( false === Helper.isPlainObject( [] ), true );
    });

    it ( 'Test Helper.isClass', () =>
    {
        assert.equal( "boolean" === typeof Helper.isClass( 1 ), true );
        assert.equal( true === Helper.isClass( Helper ), true );
        assert.equal( false === Helper.isClass( 123 ), true );
        assert.equal( false === Helper.isClass( "dfjks" ), true );
        assert.equal( false === Helper.isClass( [] ), true );
    });

    it ( 'Test Helper.createObservable', () =>
    {
        const obs = Helper.createObservable();
        assert.equal( null !== obs, true );
    });

    it ( 'Test Helper.deepMerge', () =>
    {
        const merged = Helper.deepMerge( {}, { a: 1, b: 2 } );
        assert.equal( merged.hasOwnProperty( 'a' ), true );
        assert.equal( merged.hasOwnProperty( 'b' ), true );
        assert.equal( merged.a, 1 );
        assert.equal( merged.b, 2 );
        const merged2 = Helper.deepMerge( { a : 1, b : 2 }, { a: 3, b : 4, c : { c1 : 33 } } );
        assert.equal( merged2.hasOwnProperty( 'a' ), true );
        assert.equal( merged2.hasOwnProperty( 'b' ), true );
        assert.equal( merged2.hasOwnProperty( 'c' ), true );
        assert.equal( merged2.a, 3 );
        assert.equal( merged2.b, 4 );
        assert.equal( Helper.isPlainObject( merged2.c ), true );
        assert.equal( merged2.c.hasOwnProperty( 'c1' ), true );
        assert.equal( merged2.c.c1, 33 );

    });

    it ( 'Test Helper.createObservable', () =>
    {
        const form = document.createElement( 'form' );
        console.log( form );
        assert.equal( null !== form, true );
    });
});
