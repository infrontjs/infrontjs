import assert from 'assert';
import { RestApi } from "../../src/util/RestApi.js"

describe( "Testing util.RestApi", () =>
{
    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof RestApi, true );
        assert.throws( () => { new RestApi() }, Error );
    });

});
