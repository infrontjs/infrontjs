import assert from 'assert';
import { DefaultNotFoundState } from "../../src/base/DefaultNotFoundState.js";

describe( "Testing base.DefaultState", () =>
{
    let state;
    before ( () => {
        state = new DefaultNotFoundState( null );
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof DefaultNotFoundState, true );
        assert.equal( state instanceof DefaultNotFoundState, true );
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
        assert.equal( 'INFRONT_DEFAULT_NOTFOUND_STATE' === state.getId(), true );
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
});
