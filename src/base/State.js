/**
 * State class. Parent state class. Extend this class for your state logic.
 *
 * @example
 * Create a state called MyState with is executed when the url 'my-state' is called. When executed,
 * it prints 'Hello from MyState' to the console.
 *
 * class MyState extends State
 * {
 *     asnyc enter()
 *     {
 *         console.log( "Hello from MyState" );
 *     }
 * }
 */
class State
{
    /**
     * ID of state. Should be an unique identifier. If not set it will be auto-generated.
     * @type {string|null}
     */
    static ID = null;

    /**
     * Route(s) which trigger this state
     * @type {string|array}
     */
    static ROUTE = "/";

    /**
     *
     * @param {App} app - App instance
     * @param {RouteParams|null} [routeParams=null] - Current route params
     */
    constructor( app, routeParams )
    {
        this.app = app;
        this.routeParams = routeParams;
    }

    /**
     * Return current ID
     *
     * @returns {string}
     */
    getId()
    {
        return this.constructor.ID;
    }

    /**
     * Called before entering state.
     * @returns {boolean}
     */
    canEnter()
    {
        return true;
    }

    /**
     * Called before exiting state.
     * @returns {boolean}
     */
    canExit()
    {
        return true;
    }

    /**
     * Called when canEnter() function returns false.
     * @returns {string|null} - Return redirect route.
     */
    getRedirectTo()
    {
        return null;
    }

    /**
     * Called when entering scene and after canEnter() call returned true.
     * @returns {Promise<void>}
     */
    async enter()
    {
    }

    /**
     * Called when exiting scene and after canExit() call return true.
     * @returns {Promise<void>}
     */
    async exit()
    {
    }
}

export { State };
