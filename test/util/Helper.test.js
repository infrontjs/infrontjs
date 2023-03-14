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
});
