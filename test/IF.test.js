import assert from 'assert';
import * as IF from './../src/IF.js';

it( 'Check for all IF exports exists', () =>
{
    assert.equal( "object" === typeof IF, true );
    assert.equal( "function" === typeof IF.State, true );
    assert.equal( "function" === typeof IF.App, true );
    assert.equal( "function" === typeof IF.Helper, true );
    assert.equal( "function" === typeof IF.L18n, true );
    assert.equal( "function" === typeof IF.StateManager, true );
    assert.equal( "function" === typeof IF.PathObject, true );
    assert.equal( "function" === typeof IF.RestApi, true );
    assert.equal( "function" === typeof IF.Router, true );
    assert.equal( "function" === typeof IF.View, true );
});
