import assert from 'assert';
import * as IF from './../../src/IF.js';

it( 'Checks for StateManager class and its structure', () =>
{
    assert.equal( "function" === typeof IF.StateManager, true );
    const states = new IF.StateManager( null );
    assert.equal( states instanceof IF.StateManager, true );
    assert.equal( "function" === typeof states.add, true );
    assert.equal( "function" === typeof states.create, true );
    assert.equal( "function" === typeof states.switchTo, true );
    assert.equal( "function" === typeof states.setStateNotFoundClass, true );
});

it ( 'Checks for States.add function', () =>
{
    const stateManager = new IF.StateManager( null );
    assert.equal( "object" === typeof stateManager._states, true );
    class TestState extends IF.State {
        static ID = 'test-state';
        static ROUTE = null;    // Note: set no route on purpose in order to make test work
    };
    class TestTwoState extends TestState
    {
        static ID = 'test-state-two';
    }
    stateManager.add( TestState, TestTwoState );
    assert.equal( stateManager._states.hasOwnProperty( TestState.ID ), true );
    assert.equal( stateManager._states.hasOwnProperty( TestTwoState.ID ), true );
});

