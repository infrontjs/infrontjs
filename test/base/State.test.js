import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing base.State", () =>
{
    let state;
    before ( () => {
        state = new IF.State( null, new IF.RouteParams( { "p1" : "one" }, { "q2" : "two" } ) );
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.State, true );
        assert.equal( state instanceof IF.State, true );
        assert.equal( "function" === typeof state.getId, true );
        assert.equal( "function" === typeof state.canEnter, true );
        assert.equal( "function" === typeof state.canExit, true );
        assert.equal( "function" === typeof state.getRedirectUrl, true );
        assert.equal( "function" === typeof state.enter, true );
        assert.equal( "function" === typeof state.getParams, true );
        assert.equal( "function" === typeof state.getParam, true );
        assert.equal( "function" === typeof state.getQueries, true );
        assert.equal( "function" === typeof state.getQuery, true );
    });

    it ( 'Test ID', () =>
    {
        IF.State.ID = 'test';
        assert.equal( 'test' === state.getId(), true );
    });

    it ( 'Test State.canEnter', () =>
    {
        assert.equal( "boolean" === typeof state.canEnter(), true );
        assert.equal( true === state.canEnter(), true );
    });

    it ( 'Test State.canExit', () =>
    {
        assert.equal( "boolean" === typeof state.canExit(), true );
        assert.equal( true === state.canExit(), true );
    });

    it ( 'Test State.getRedirect', () =>
    {
        assert.equal( null === state.getRedirectUrl(), true );
    });

    it ( 'Test State.enter', () =>
    {
        assert.equal( state.enter() instanceof Promise, true );
    });

    it ( 'Test State.exit', () =>
    {
        assert.equal( state.exit() instanceof Promise, true );
    });

    it ( 'Test State.getParams', () =>
    {
        const params = state.getParams();
        assert.equal( "object" === typeof params, true );
        assert.equal( 1 === Object.keys( params ).length, true );
        assert.equal( true === params.hasOwnProperty( "p1" ), true );
    });

    it ( 'Test State.getParam', () =>
    {
        assert.equal( null === state.getParam( 'does-not-exists' ), true );
        assert.equal( "one" === state.getParam( "p1"), true );
        assert.equal( "my-default" === state.getParam( 'does-not-exists', 'my-default' ), true );
    });

    it ( 'Test State.getQueries', () =>
    {
        const queries = state.getQueries();
        assert.equal( "object" === typeof queries, true );
        assert.equal( 1 === Object.keys( queries ).length, true );
        assert.equal( true === queries.hasOwnProperty( "q2" ), true );
    });

    it ( 'Test State.getQuery', () =>
    {
        assert.equal( null === state.getQuery( 'does-not-exists' ), true );
        assert.equal( "two" === state.getQuery( "q2"), true );
        assert.equal( "my-default" === state.getQuery( 'does-not-exists', 'my-default' ), true );
    });
});
