import assert from 'assert';
import { Fetcher } from "../../src/util/Fetcher.js"

describe( "Testing util.Fetcher", () =>
{
    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof Fetcher, true );
        assert.throws( () => { new Fetcher() }, Error );
    });

});
