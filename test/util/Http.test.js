import assert from 'assert';
import { Http } from "../../src/util/Http.js"

describe( "Testing util.Http", () =>
{
    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof Http, true );
        assert.throws( () => { new Http() }, Error );
    });

});
