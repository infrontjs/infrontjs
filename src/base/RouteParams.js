/**
 * RouteParams
 * Container class for route parameters and query string values.
 * Instances are passed to State lifecycle methods when a route is matched.
 *
 * @class
 *
 * @example
 * // Route: /users/:userId/posts/:postId
 * // URL: /users/123/posts/456?sort=date&order=desc
 *
 * class UserPostState extends State {
 *     static ROUTE = '/users/:userId/posts/:postId';
 *
 *     async onEnter() {
 *         const userId = this.getParam('userId');     // '123'
 *         const postId = this.getParam('postId');     // '456'
 *         const sort = this.getQuery('sort');         // 'date'
 *         const order = this.getQuery('order');       // 'desc'
 *         const limit = this.getQuery('limit', 10);   // 10 (default)
 *
 *         // Get all params/queries at once
 *         const allParams = this.getParams();   // { userId: '123', postId: '456' }
 *         const allQueries = this.getQueries(); // { sort: 'date', order: 'desc' }
 *     }
 * }
 */
class RouteParams
{
    /**
     * Create a new RouteParams instance
     *
     * @constructor
     * @param {object} [params={}] - Route parameters (e.g., from :param patterns)
     * @param {object} [query={}] - Query string parameters (e.g., from ?key=value)
     *
     * @example
     * // Usually created automatically by the Router
     * const routeParams = new RouteParams(
     *     { userId: '123', postId: '456' },
     *     { sort: 'date', order: 'desc' }
     * );
     */
    constructor( params = {}, query = {} )
    {
        /**
         * Route parameters
         * @private
         * @type {Object}
         */
        this._p = params;

        /**
         * Query string parameters
         * @private
         * @type {Object}
         */
        this._q = query;
    }

    /**
     * Get all route parameters as an object
     *
     * @returns {Object} Object containing all route parameters
     *
     * @example
     * // Route: /users/:userId/posts/:postId
     * // URL: /users/123/posts/456
     * const params = this.getParams();
     * // Returns: { userId: '123', postId: '456' }
     */
    getParams()
    {
        return this._p;
    }

    /**
     * Get a single route parameter value by key
     *
     * @param {string} key - Parameter name (from route pattern)
     * @param {*} [defaultValue=null] - Value to return if parameter doesn't exist
     * @returns {*} Parameter value or defaultValue
     *
     * @example
     * // Route: /users/:userId
     * // URL: /users/123
     * const userId = this.getParam('userId');        // '123'
     * const missing = this.getParam('foo', 'bar');   // 'bar'
     *
     * @example
     * // Wildcard routes
     * // Route: /files/*
     * // URL: /files/documents/report.pdf
     * const path = this.getParam('_');  // 'documents/report.pdf'
     */
    getParam( key, defaultValue = null )
    {
        if ( this._p && this._p.hasOwnProperty( key ) )
        {
            return this._p[ key ];
        }
        else
        {
            return defaultValue;
        }
    }

    /**
     * Get a single query string parameter value by key
     *
     * @param {string} key - Query parameter name
     * @param {*} [defaultValue=null] - Value to return if query parameter doesn't exist
     * @returns {*} Query parameter value or defaultValue
     *
     * @example
     * // URL: /search?q=javascript&category=tutorials&page=2
     * const searchTerm = this.getQuery('q');          // 'javascript'
     * const category = this.getQuery('category');     // 'tutorials'
     * const page = this.getQuery('page');             // '2'
     * const limit = this.getQuery('limit', 10);       // 10 (default)
     *
     * @example
     * // Type conversion
     * const pageNum = parseInt(this.getQuery('page', '1'));  // 2 (as number)
     * const isActive = this.getQuery('active') === 'true';   // boolean conversion
     */
    getQuery( key, defaultValue = null )
    {
        if ( this._q && this._q.hasOwnProperty( key ) )
        {
            return this._q[ key ];
        }
        else
        {
            return defaultValue;
        }
    }

    /**
     * Get all query string parameters as an object
     *
     * @returns {Object} Object containing all query parameters
     *
     * @example
     * // URL: /search?q=javascript&category=tutorials&page=2
     * const queries = this.getQueries();
     * // Returns: { q: 'javascript', category: 'tutorials', page: '2' }
     *
     * @example
     * // Check if any filters applied
     * const filters = this.getQueries();
     * if (Object.keys(filters).length > 0) {
     *     console.log('Filters active:', filters);
     * }
     */
    getQueries()
    {
        return this._q;
    }
}

export { RouteParams };
