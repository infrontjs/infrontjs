import assert from 'assert';
import { PathObject } from "../../src/util/PathObject.js"

describe( "Testing util.PathObject", () =>
{
    let po;
    before ( () => {
        po = new PathObject({
            "one" : 123,
            "two" : {
                "three" : 3
            },
            "four" : [ 4, 5, 6 ]
        })
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof PathObject, true );
        assert.equal( po instanceof PathObject, true );
        assert.equal( "function" === typeof po.get, true );
        assert.equal( "function" === typeof po.set, true );

    });

    it( 'Test PathObject.get', () =>
    {
        assert.equal( null === po.get ( "does.not.exists" ), true );
        assert.equal( 123 === po.get( "one" ), true );
        assert.equal( 3 === po.get( "two.three" ), true );
        assert.equal( 6 === po.get( "four[2]" ), true );
        assert.equal( "def-value" === po.get( "does.not.exists", "def-value" ), true );
    });

    it( 'Test PathObject.set', () =>
    {
        po.set( "one", 111 );
        assert.equal( 111 === po.get( "one" ), true );
        po.set( "two.three", 23 );
        assert.equal( 23 === po.get( "two.three" ), true );
        po.set( "five", { "six": 6 } );
        assert.equal( 6 === po.get( "five.six" ), true );
        po.set( "four[3]", 333 );
        assert.equal( 333 === po.get( "four[3]" ), true );
    });

});
