import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing core.View", () =>
{
    let app;

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.View, true );
        assert.throws( () => { new IF.App() }, Error );
    });

});
