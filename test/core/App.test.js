import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing core.App", () =>
{
    let app;

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.App, true );
        assert.throws( () => { new IF.App() }, Error );
    });

});
