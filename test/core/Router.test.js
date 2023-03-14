import assert from 'assert';
import * as IF from './../../src/IF.js';

describe( "Testing core.Router", () =>
{
    let app;

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof IF.Router, true );
        assert.throws( () => { new IF.Router() }, Error );
    });

});
