import assert from 'assert';
import { RouteParams } from "../../src/base/RouteParams.js";

describe( "Testing base.RouteParams", () =>
{
    let rp;
    before ( () => {
        rp = new RouteParams( { "p1" : "one", "p2" : 2 }, { "q1" : "qone" } );
    });

    it( 'Test class and its structure', () =>
    {
        assert.equal( "function" === typeof RouteParams, true );
        assert.equal( rp instanceof RouteParams, true );
        assert.equal( "function" === typeof rp.getParams, true );
        assert.equal( "function" === typeof rp.getParam, true );
        assert.equal( "function" === typeof rp.getQueries, true );
        assert.equal( "function" === typeof rp.getQuery, true );
    });

    it ( 'Test RouteParams.getParams', () =>
    {
        const p = rp.getParams();
        assert.equal( "object" === typeof p, true );
        assert.equal( 2 === Object.keys( p ).length, true );
        assert.equal( true === p.hasOwnProperty( "p1"), true );
        assert.equal( true === p.hasOwnProperty( "p2"), true );
    });

    it( 'Test RouteParams.getParam', () =>
    {
        assert.equal( "string" === typeof rp.getParam( "p1" ), true );
        assert.equal( "one" === rp.getParam( "p1" ), true );
        assert.equal( "number" === typeof rp.getParam( "p2" ), true );
        assert.equal( 2 === rp.getParam( "p2" ), true );
        assert.equal( null === rp.getParam( 'does-not-exists' ), true );
        assert.equal( 'my-default' ===  rp.getParam( 'does-not-exists', 'my-default'), true );
    });

    it ( 'Test RouteParams.getQueries', () =>
    {
        const q = rp.getQueries();
        assert.equal( "object" === typeof q, true );
        assert.equal( 1 === Object.keys( q ).length, true );
        assert.equal( true === q.hasOwnProperty( "q1"), true );
    });

    it( 'Test RouteParams.getQuery', () =>
    {
        assert.equal( "string" === typeof rp.getQuery( "q1" ), true );
        assert.equal( "qone" === rp.getQuery( "q1" ), true );
        assert.equal( null === rp.getQuery( 'does-not-exists' ), true );
        assert.equal( 'my-default' ===  rp.getQuery( 'does-not-exists', 'my-default'), true );
    });
});
