import assert from 'assert';
import * as IF from './../../src/IF.js';

it( 'Checks for States class and its structure', () =>
{
    assert.equal( "function" === typeof IF.States, true );
    const states = new IF.States( null );
    assert.equal( states instanceof IF.States, true );
    assert.equal( "function" === typeof states.add, true );
    assert.equal( "function" === typeof states.create, true );
    assert.equal( "function" === typeof states.switchTo, true );
});

it ( 'Checks for States.add function', () =>
{
    const states = new IF.States( null );
    assert.equal( "object" === typeof states._states, true );
    class TestState extends IF.State {
        static ID = 'test-state';
        static ROUTE = null;    // Note: set no route on purpose in order to make test work
    };
    class TestTwoState extends TestState
    {
        static ID = 'test-state-two';
    }
    states.add( TestState, TestTwoState );
    assert.equal( states._states.hasOwnProperty( TestState.ID ), true );
    assert.equal( states._states.hasOwnProperty( TestTwoState.ID ), true );
});

